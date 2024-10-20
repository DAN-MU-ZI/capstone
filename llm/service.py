from pydantic import BaseModel
from typing import Optional, List
from dto import *


def create_example(input_data: ExampleInput):
    example = {
        "title": "React의 개념",
        "examples": [
            {
                "style": "간결하고 직관적인 설명",
                "content": "React는 사용자 인터페이스를 만들기 위한 JavaScript 라이브러리입니다. React는 컴포넌트라는 작은 코드 조각을 사용하여 사용자 인터페이스를 구성합니다. React는 사용자가 데이터를 변경할 때마다 자동으로 UI를 업데이트합니다.",
            },
            {
                "style": "비유적인 설명",
                "content": "React는 집을 짓는 것과 같습니다. 컴포넌트를 벽돌처럼 쌓아올려 페이지를 완성하며, 벽돌 하나를 바꾸면 전체 구조를 새로 만들 필요 없이 그 벽돌만 교체합니다.",
            },
            {
                "style": "실생활 예시를 활용한 설명",
                "content": "React는 마치 레고 블록으로 무언가를 만드는 것과 같습니다. 각 레고 블록(컴포넌트)을 조립하여 다양한 모양을 만들고, 변경할 부분이 생기면 해당 블록만 바꿔 다시 조립하면 됩니다.",
            },
            {
                "style": "기술적인 설명",
                "content": "React는 Virtual DOM을 활용하여 실제 DOM 조작을 최소화함으로써 성능을 최적화합니다. 상태(state)와 속성(props)을 통해 컴포넌트를 재사용하며, JSX를 사용하여 JavaScript 안에 HTML을 작성할 수 있습니다.",
            },
        ],
    }

    return Response(data=Example(**example))


def create_curriculum(input_data: StylesInput):
    data = [
        {
            "title": "1. React 소개",
            "subItems": [
                {"title": "1.1 React란?"},
                {"title": "1.2 React의 장점"},
                {"title": "1.3 React의 역사"},
                {
                    "title": "1.4 React 최신 버전",
                    "subItems": [
                        {"title": "1.4.1 React 18"},
                        {"title": "1.4.2 새로운 기능"},
                    ],
                },
            ],
        },
        {
            "title": "2. 설치 및 환경 설정",
            "subItems": [
                {
                    "title": "2.1 React 설치",
                    "subItems": [
                        {"title": "2.1.1 npm을 통한 설치"},
                        {"title": "2.1.2 yarn을 통한 설치"},
                    ],
                },
                {
                    "title": "2.2 개발 환경 설정",
                    "subItems": [
                        {"title": "2.2.1 코드 편집기 설정"},
                        {"title": "2.2.2 ESLint와 Prettier 설정"},
                    ],
                },
                {
                    "title": "2.3 통합 개발 환경(IDE) 설정",
                    "subItems": [
                        {"title": "2.3.1 Visual Studio Code 설정"},
                        {"title": "2.3.2 WebStorm 설정"},
                    ],
                },
            ],
        },
    ]

    # Pydantic 모델로 변환
    curriculum_items = [CurriculumItem(**item) for item in data]

    return Response(data=curriculum_items)


def get_books():
    books_data = [
        {
            "id": "book1",
            "title": "React 책",
            "curriculum": [
                {
                    "title": "1. React 소개",
                    "subItems": [
                        {"title": "1.1 React란?"},
                        {"title": "1.2 React의 장점"},
                        {"title": "1.3 React의 역사"},
                        {
                            "title": "1.4 React 최신 버전",
                            "subItems": [
                                {"title": "1.4.1 React 18"},
                                {"title": "1.4.2 새로운 기능"},
                            ],
                        },
                    ],
                },
                {
                    "title": "2. 설치 및 환경 설정",
                    "subItems": [
                        {
                            "title": "2.1 React 설치",
                            "subItems": [
                                {"title": "2.1.1 npm을 통한 설치"},
                                {"title": "2.1.2 yarn을 통한 설치"},
                            ],
                        },
                        {
                            "title": "2.2 개발 환경 설정",
                            "subItems": [
                                {"title": "2.2.1 코드 편집기 설정"},
                                {"title": "2.2.2 ESLint와 Prettier 설정"},
                            ],
                        },
                        {
                            "title": "2.3 통합 개발 환경(IDE) 설정",
                            "subItems": [
                                {"title": "2.3.1 Visual Studio Code 설정"},
                                {"title": "2.3.2 WebStorm 설정"},
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "id": "book2",
            "title": "하이버네이트 책",
            "curriculum": [
                {
                    "title": "1. 하이버네이트 소개",
                    "subItems": [
                        {"title": "1.1 하이버네이트란?"},
                        {"title": "1.2 하이버네이트의 역사"},
                    ],
                },
                {
                    "title": "2. 하이버네이트 설정",
                    "subItems": [
                        {"title": "2.1 설정 파일 만들기"},
                        {"title": "2.2 데이터베이스 연결"},
                    ],
                },
            ],
        },
    ]

    # Book 모델에 맞게 데이터를 변환하여 반환
    return [Book(**book) for book in books_data]
