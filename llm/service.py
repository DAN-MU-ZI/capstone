from pydantic import BaseModel
from typing import Optional, List


class CurriculumItem(BaseModel):
    title: str
    subItems: Optional[List["CurriculumItem"]] = None


class Response(BaseModel):
    data: object


def create_curriculum():

    data = [
        {
            "title": "1. 하이버네이트 소개",
            "subItems": [
                {"title": "1.1 하이버네이트란?"},
                {"title": "1.2 하이버네이트의 역사"},
                {"title": "1.3 하이버네이트의 장점"},
                {
                    "title": "1.4 하이버네이트 최신 버전",
                    "subItems": [
                        {"title": "1.4.1 Hibernate ORM 5.6.10.Final"},
                        {"title": "1.4.2 Java 17 호환성"},
                    ],
                },
            ],
        },
        {
            "title": "2. 설치 및 환경 설정",
            "subItems": [
                {
                    "title": "2.1 하이버네이트 설치",
                    "subItems": [
                        {"title": "2.1.1 Maven을 통한 설치"},
                        {"title": "2.1.2 Gradle을 통한 설치"},
                    ],
                },
                {
                    "title": "2.2 데이터베이스 설정",
                    "subItems": [
                        {"title": "2.2.1 데이터베이스 드라이버 설정"},
                        {"title": "2.2.2 Hibernate 설정 파일 (hibernate.cfg.xml)"},
                    ],
                },
                {
                    "title": "2.3 통합 개발 환경(IDE) 설정",
                    "subItems": [
                        {"title": "2.3.1 Eclipse 설정"},
                        {"title": "2.3.2 IntelliJ IDEA 설정"},
                    ],
                },
            ],
        },
    ]

    # Pydantic 모델로 변환
    curriculum_items = [CurriculumItem(**item) for item in data]

    return Response(data=curriculum_items)


class Explanation(BaseModel):
    style: str
    content: str


# Example 모델 정의
class Example(BaseModel):
    title: str
    examples: List[Explanation]


def create_example():
    example = {
        "title": "React",
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
