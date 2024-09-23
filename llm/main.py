from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import service
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (보안 문제를 위해 실제 배포 시엔 제한 필요)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],  # 모든 헤더 허용
)


@app.get("/api/example")
async def example():
    return service.create_example()


@app.get("/api/curriculum")
async def create_curriculum():
    return service.create_curriculum()
