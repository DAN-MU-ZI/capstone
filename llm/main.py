import os
import json
import logging  # 로깅 모듈 추가
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from contextlib import asynccontextmanager

from service import *
from ai import *

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_USER = os.getenv("MONGO_INITDB_ROOT_USERNAME", "admin")
MONGO_PASSWORD = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "password")

client = AsyncIOMotorClient(f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@mongo:27017")
db = client["test"]  # 'test' 데이터베이스 선택
collection = db["books"]  # 'books' 컬렉션


# FastAPI 애플리케이션 수명주기 관리
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        databases = await client.list_database_names()
        logger.info(databases)
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")

    logger.info("Starting up...")  # 서버 시작 시 로그 기록
    await initialize_data()  # 데이터 초기화
    yield
    logger.info("Shutting down...")  # 서버 종료 시 로그 기록


# app = FastAPI(lifespan=lifespan)
app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (보안 문제를 위해 실제 배포 시엔 제한 필요)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],  # 모든 헤더 허용
)


# ObjectId 처리하기 위한 클래스 (Pydantic v2에 맞게 수정)
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, strict=False, context=None):  # strict와 context를 추가
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        field_schema = handler(core_schema)
        field_schema.update(type="string")
        return field_schema


# Pydantic 모델 정의 (title, description, content 필드 포함)
class BookModel(BaseModel):
    title: str
    description: str
    content: Dict[str, Any]

    class Config:
        populate_by_name = (
            True  # Pydantic v2에서 `allow_population_by_field_name` 대신 사용
        )
        json_encoders = {ObjectId: str}  # ObjectId를 문자열로 직렬화
        arbitrary_types_allowed = True


class ExampleInput(BaseModel):
    input: str


class StylesInput(BaseModel):
    styles: List[str]


# JSON 파일에서 데이터를 읽고 저장하는 함수
async def initialize_data():
    logger.info("Initializing data...")  # 초기화 시작 로그
    try:
        # 기존 데이터 삭제
        try:
            delete_result = await collection.delete_many({})
            logger.info(
                f"Deleted {delete_result.deleted_count} existing records."
            )  # 삭제된 문서 수 기록
        except Exception as e:
            logger.error(f"Error deleting existing records: {e}")

        # 새로운 데이터를 읽어서 추가
        with open("data.json", "r", encoding="utf-8") as f1, open(
            "data2.json", "r", encoding="utf-8"
        ) as f2:
            data1 = json.load(f1)
            data2 = json.load(f2)

            book1 = {
                "title": "JPA Book",
                "description": "JPA 관련 학습 자료",
                "content": data1,
            }

            book2 = {
                "title": "백엔드 개발",
                "description": "백엔드 개발 관련 자료",
                "content": data2,
            }

            # MongoDB에 데이터를 저장
            result = await collection.insert_many([book1, book2])
            logger.info(
                f"Inserted {len(result.inserted_ids)} new records."
            )  # 삽입된 문서 수 기록
    except Exception as e:
        logger.error(f"Error during data initialization: {e}")  # 에러 발생 시 로그
        raise


# Book 생성 (POST)
@app.post("/api/books")
async def create_book(book: BookModel, userId: str):
    book_dict = book.dict(by_alias=True)

    # 유효한 ObjectId인지 확인
    try:
        obj_id = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    # 해당 사용자의 문서가 존재하는지 확인
    user = await collection.find_one({"_id": obj_id})

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # data 필드가 객체로 존재하는 경우, 배열로 변환하고 새로운 데이터를 추가
    if "data" in user and not isinstance(user["data"], list):
        # 기존 객체를 배열로 변환하여 새로운 책 데이터 추가
        existing_data = user["data"]  # 기존 객체 데이터
        result = await collection.update_one(
            {"_id": obj_id},
            {
                "$set": {"data": [existing_data, book_dict]}
            },  # 기존 데이터를 배열의 첫 번째 요소로 변환 후 추가
        )
    else:
        # data 필드가 배열이거나 없을 때, 새 책 데이터를 배열에 추가
        result = await collection.update_one(
            {"_id": obj_id},
            {"$push": {"data": book_dict}},  # data 리스트에 새로운 책 데이터를 추가
        )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update the user's data")

    return {"msg": "Book added successfully"}


# 사용자 책 목록 조회 (GET)
@app.get("/api/books", response_model=List[BookModel])
async def get_books(userId: str):
    # userId를 ObjectId로 변환
    try:
        user_object_id = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # MongoDB에서 해당 사용자의 책 목록을 검색
    response = await collection.find_one({"_id": user_object_id})

    books = response.get("data", [])

    return books


# 특정 Book 조회 (GET)
@app.get("/api/books/{book_id}", response_model=BookModel)
async def get_book(userId: str, book_id: str):
    # 유효한 ObjectId인지 확인
    try:
        object_id = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    logger.info(f"Searching for book at index {book_id} for user {object_id}")
    # MongoDB에서 _id로 사용자 문서 검색
    user = await collection.find_one({"_id": object_id})

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # data 필드에서 책 데이터 가져오기 (book_id는 인덱스 번호)
    data = user.get("data", [])

    # 인덱스 범위 확인
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Data field is not a list")
    logger.info(f"Found {len(data)} books for user {object_id}")

    # 특정 책 반환 (book_id 인덱스의 책)
    book = data[int(book_id)]
    return book


# 특정 Book 삭제 (DELETE)
@app.delete("/api/books/{book_id}")
async def delete_book(book_id: str):
    result = await collection.delete_one({"id": ObjectId(book_id)})
    if result.deleted_count == 1:
        return {"message": "Book deleted successfully"}
    raise HTTPException(status_code=404, detail="Book not found")


# WebSocket 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket 연결 수립")

    # Step 1: 그래프 빌드
    graph = build_graph()
    logger.info("그래프 빌드 완료")

    # Step 2: 사용자 입력 수신
    user_input = await websocket.receive_text()
    logger.info(f"수신한 사용자 입력: {user_input}")

    initial_input = {"input": user_input}
    thread = {"configurable": {"thread_id": "1"}}

    # Step 3: 그래프 실행 (노드 결과를 프론트엔드로 전송)
    styles = []  # styles 배열 초기화
    logger.info("그래프 실행 시작")

    for output in graph.stream(initial_input, thread):
        for node_name, result in output.items():
            logger.info(f"노드 실행: {node_name}, 결과: {result}")
            # 프론트엔드로 각 노드 결과 전송
            await websocket.send_json(result)

            # CollectData 노드에서 스타일 정보 저장
            if node_name == "CollectData" and "styles" in result:
                styles = result["styles"]
                logger.info(f"CollectData 노드에서 스타일 수신: {styles}")

    # Step 4: 스타일 선택지 전송
    if styles:
        logger.info(f"스타일 선택지 전송: {styles}")
        await websocket.send_json({"styles": styles})
    else:
        logger.warning("스타일 선택지 없음")
        await websocket.send_text("No styles available.")

    # Step 5: 사용자가 선택한 스타일 인덱스 수신 및 처리
    selected_indexes = await websocket.receive_text()
    logger.info(f"수신한 선택한 스타일 인덱스: {selected_indexes}")

    try:
        selected_indexes = json.loads(selected_indexes)  # JSON 형식으로 파싱
        selected_styles = [
            styles[i] for i in selected_indexes
        ]  # 인덱스에 해당하는 스타일 추출
        logger.info(f"사용자가 선택한 스타일: {selected_styles}")
    except (ValueError, IndexError) as e:
        logger.error(f"선택한 스타일 처리 중 오류 발생: {e}")
        await websocket.send_text(f"Error processing selected styles: {e}")
        await websocket.close()
        return

    # Step 6: 그래프 상태 업데이트 (로드 과정 포함)
    logger.info(f"그래프 상태 업데이트, 선택한 스타일: {selected_styles}")
    graph.update_state(
        thread, {"selected_styles": selected_styles}, as_node="SelectNode"
    )

    # Step 7: 그래프 실행 계속 진행 (로드된 상태에서)
    logger.info("그래프 실행 계속 진행")
    for output in graph.stream(None, thread):  # None 대신 적절한 입력 값 사용 가능
        for node_name, result in output.items():
            logger.info(f"노드 실행: {node_name}, 결과: {result}")
            await websocket.send_json(result)

    # Step 8: 실행 완료 메시지 전송 및 WebSocket 종료
    logger.info("그래프 실행 완료, WebSocket 연결 종료")
    await websocket.close()


class UserModel(BaseModel):
    name: str


@app.post("/api/users")
async def create_user(user: UserModel):
    user_dict = user.dict(by_alias=True)
    result = await collection.insert_one(user_dict)
    return {"msg": "User created successfully"}


# 사용자 생성 (POST)
from fastapi import HTTPException
from bson import ObjectId


class UserResponse(BaseModel):
    id: str
    name: str


# 사용자 목록 조회 (GET)
@app.get("/api/users", response_model=List[UserResponse])
async def getUsers():
    data = await collection.find().to_list(100)
    users = [UserResponse(id=str(d["_id"]), name=d["name"]) for d in data]
    return users
