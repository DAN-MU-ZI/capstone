import os
import json
import logging  # 로깅 모듈 추가
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from contextlib import asynccontextmanager

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB 연결 설정
# client = AsyncIOMotorClient("mongodb://localhost:27017")

MONGO_USER = os.getenv("MONGO_INITDB_ROOT_USERNAME", "admin")
MONGO_PASSWORD = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "password")

client = AsyncIOMotorClient(f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@localhost:27017/")
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


app = FastAPI(lifespan=lifespan)

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
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
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
@app.post("/api/books", response_model=BookModel)
async def create_book(book: BookModel):
    book_dict = book.dict(by_alias=True)
    result = await collection.insert_one(book_dict)
    return {**book_dict, "id": str(result.inserted_id)}


# Book 목록 조회 (GET)
@app.get("/api/books", response_model=List[BookModel])
async def get_books():
    books = await collection.find().to_list(100)
    return books


# 특정 Book 조회 (GET)
@app.get("/api/books/{book_id}", response_model=BookModel)
async def get_book(book_id: str):
    object_id = ObjectId(book_id)

    # MongoDB에서 _id로 책을 검색
    book = await collection.find_one({"_id": object_id})
    if book:
        return {**book, "id": str(book["_id"])}

    # 책을 찾지 못한 경우 예외 처리
    raise HTTPException(status_code=404, detail="Book not found")


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


# WebSocket 예시
@app.post("/api/example")
async def example(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        input_data: ExampleInput = await websocket.receive_json()
        print(input_data)

        if not input_data.input:
            raise HTTPException(status_code=400, detail="Invalid input")

        # 메시지 응답
        await manager.send_message(f"Received input: {input_data.input}", websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# WebSocket 연결 예시
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        steps = [
            "Step 1: Initializing",
            "Step 2: Processing",
            "Step 3: Finalizing",
            "Completed",
        ]

        for step in steps:
            await manager.send_message(step, websocket)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
