from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import service
from pydantic import BaseModel
from typing import Optional, List
from dto import *

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (보안 문제를 위해 실제 배포 시엔 제한 필요)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],  # 모든 헤더 허용
)


@app.post("/api/example")
async def example(input_data: ExampleInput):
    print(input_data)
    if not input_data.input:
        raise HTTPException(status_code=400, detail="Invalid input")

    return service.create_example(input_data)


@app.post("/api/curriculum")
async def create_curriculum(input_data: StylesInput):
    print(input_data)

    # 예시로 스타일을 기준으로 데이터를 필터링
    if not input_data:
        raise HTTPException(status_code=400, detail="No styles selected")

    return service.create_curriculum(input_data)


@app.get("/api/books", response_model=List[Book])
async def get_books():
    return service.get_books()
