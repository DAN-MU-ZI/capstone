import os
import uuid
import requests
import logging
import nest_asyncio
import asyncio

from typing import List, Literal, Any, TypedDict

from pydantic import BaseModel, Field

from langchain.chains import create_extraction_chain
from langchain.prompts import PromptTemplate, ChatPromptTemplate

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from langchain_openai import ChatOpenAI

from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_transformers import BeautifulSoupTransformer

from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebSocket")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME")
CSE_API_KEY = os.getenv("CSE_API_KEY")
CSE_ID = os.getenv("CSE_ID")

nest_asyncio.apply()

CURRICULUM_SUMMARY = """
# 교육 프로그램 계층 구조 요약

## 1. Program (프로그램)
- 설명: 전체 교육 과정을 의미하는 최상위 개념으로, 특정 직업, 자격증, 학위 등을 목표로 하는 학습 과정을 포함.
- 예시: `백엔드 개발자 과정`, `데이터 과학 석사 과정`

## 2. Curriculum (커리큘럼)
- 설명: 학과 내에서 특정 분야에 대한 세부 학습 경로. 여러 Subject(과목)를 포함.
- 예시: `백엔드 개발자 커리큘럼`, `AI 프로그래밍 커리큘럼`

## 3. Subject (과목)
- 설명: 특정 학습 주제를 다루는 단위. 하나의 Curriculum 안에 여러 Subject가 포함됨.
- 예시: `Java Persistence API (JPA)`, `알고리즘`, `데이터베이스`

## 4. Module (모듈)
- 설명: 특정 과목 내에서 다루는 주제를 세분화한 단위. 하나의 Module은 여러 Lesson을 포함.
- 예시: `JPA 기초`, `JPA 고급`

## 5. Lesson (레슨)
- 설명: 모듈 내에서 학습 활동이 이루어지는 구체적인 단위. 여러 Topic을 포함.
- 예시: `JPA 소개`, `엔티티와 관계 설정`

## 6. Topic (주제)
- 설명: 레슨 내에서 다루는 가장 작은 학습 단위. 세부 개념이나 기능을 설명.
- 예시: `ORM이란?`, `@Entity 어노테이션 사용법`
"""

CATEGORIES = (
    "programs",
    "curriculums",
    "subjects",
    "modules",
    "lessons",
    "topics",
    "none",
)


class State(TypedDict):
    input: str
    goal: str
    category: Literal[CATEGORIES]  # type: ignore
    example: Any
    llm_styles: List[str]
    extracted_insights: Any
    web_styles: List[str]
    styles: List[str]
    selected_styles: Any
    blogs: List[str]
    result: Any
    programs: Any
    curriculums: Any
    subjects: Any
    modules: Any
    lessons: Any
    topics: Any
    info: str


def classify_input(state):
    class Result(BaseModel):
        goal: str = Field(..., description="문장의 제목")
        content: str = Field(..., description="제목의 내용")
        category: Literal["programs", "curriculums", "subjects", "modules", "lessons", "topics", "none"] = Field(  # type: ignore
            ..., description="제목이 속하는 교육 프로그램 계층"
        )

    prompt = ChatPromptTemplate.from_template(
        """
        교육 프로그램 계층 구조에 대한 배경 정보가 제공되었습니다. 이 정보를 바탕으로 사용자가 질문한 내용에서 주요 주제를 찾아내고, 해당 주제가 어느 계층에 속하는지 분류하세요.
    
        교육 프로그램 계층 구조는 다음과 같습니다:
        {background}
        
        사용자 입력:
        {input}
    
        문장을 읽고 그에 해당하는 계층을 아래에서 선택하세요: programs, curriculums, subjects, modules, lessons, topicss, none
        선택한 계층에 대해 제목과 내용을 작성하세요.
        'Result' 의 속성을 참고하세요.
        사용자 입력이 협소적이지 않다면, topic은 지양하세요.
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)

    chain = prompt | llm
    res = chain.invoke(
        {
            "background": CURRICULUM_SUMMARY,
            "input": state.get("input"),
        }
    )
    res = res.dict()
    state["goal"] = res["goal"]
    state["category"] = res["category"]

    object = dict()
    object["uuid"] = str(uuid.uuid4())
    object["title"] = res["goal"]
    object["description"] = res["content"]
    state["info"] = object

    state[state["category"]] = {state["category"]: [object]}

    return state


def select_example(state):
    class Result(BaseModel):
        subject: str = Field(..., description="주제에 대해 설명할 일부 소주제")
        description: str = Field(..., description="소주제에 대한 간략한 설명")

    template = """
    주어진 목표에 대해 사용자가 학습하기위한 자료를 만드려고 합니다.
    학습 자료는 책의 일부에서 설명할만한 내용같은 느낌입니다.
    목표의 일부에서 세부적인 소주제와 내용을 짧게 작성해주세요.
    사용자 맞춤 학습 스타일을 선정하기 위한 예시로 사용됩니다.
    'Result' 의 양식에 맞게 작성해야 합니다.

    주제:
    {goal}
    """

    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm
    res = chain.invoke({"goal": state.get("goal")})

    res = res.dict()

    return {"example": res}


def recommend_style_by_llm(state):
    class Style(BaseModel):
        title: str = Field(..., description="스타일 제목")
        description: str = Field(..., description="스타일 설명")
        example: str = Field(..., description="스타일이 적용된 예시")

    class Result(BaseModel):
        styles: List[Style]

    template = """
    사용자에게 적합한 설명 스타일들을 제시하는 것이 목표입니다.
    주어진 주제에 대해 10가지 스타일을 제공해주세요.
    각 스타일은 제목과 간단한 설명, 스타일이 적용되어 주제에 설명하는 예시를 포함합니다.
    스타일은 주제를 매우 충분히 설명할 수 있을정도의 스타일 구성이어야 합니다.
    스타일은 하나 이상의 유형이 조합될 수 있습니다.
    스타일 설명은 스타일 제목과만 연관됩니다.
    스타일 설명은 예시에 대한 내용이 포함되면 안됩니다.
    예시는 충분히 길게 설명해주세요.

    주제:
    {example}
    """
    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    example = state["example"]
    res = chain.invoke({"example": example})
    res = res.dict()

    return {"llm_styles": res["styles"]}


def scrap_blog(state):
    query = state["goal"]

    sites = ["tistory.com", "velog.io"]
    site_query = " OR ".join([f"site:{site}" for site in sites])

    params = {"key": CSE_API_KEY, "cx": CSE_ID, "q": f"{query} {site_query}"}

    response = requests.get("https://www.googleapis.com/customsearch/v1", params=params)

    if response.status_code == 200:
        json_response = response.json()
        links = []

        if "items" in json_response:
            for item in json_response["items"]:
                link = item["link"]

                links.append(link)
        else:
            print("검색 결과가 없습니다.")

        return {"blogs": links}
    else:
        print(f"Error: {response.status_code}")


def extract_insight(state):
    llm = ChatOpenAI(model_name="gpt-4o-mini")

    schema = {
        "properties": {
            "title": {"type": "string", "description": "서술 스타일의 이름"},
            "description": {"type": "string", "description": "서술 스타일에 대한 설명"},
            "example": {"type": "string", "description": "서술 스타일이 적용된 예시"},
        },
        "required": ["style_title", "description", "example"],
    }

    prompt_template = PromptTemplate(
        input_variables=["text"],
        template=(
            "아래 블로그 글에서 사용된 서술 스타일을 분석해 주세요. "
            "스타일의 제목, 스타일에 대한 설명, 그리고 해당 스타일이 적용된 예시를 각각 추출하세요.\n\n{text}"
        ),
    )

    urls = state["blogs"][:5]
    loader = AsyncChromiumLoader(urls)
    docs = loader.load()
    bs_transformer = BeautifulSoupTransformer()
    docs_transformed = bs_transformer.transform_documents(
        docs, tags_to_extract=["span"]
    )

    # Grab the first 1000 tokens of the site
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=1000, chunk_overlap=0
    )
    splits = splitter.split_documents(docs_transformed)

    # extracted_contents = []

    # ext_chain = create_extraction_chain(schema=schema, llm=llm, prompt=prompt_template)
    # for split in splits:
    #     extracted_content = ext_chain.invoke(split.page_content)
    #     extracted_contents.extend(extracted_content)

    # state["extracted_insights"] = extracted_content

    async def create(chain, content):
        return await chain.ainvoke(content)

    async def gather_results():
        tasks = []
        for split in splits:
            chain = create_extraction_chain(
                schema=schema, llm=llm, prompt=prompt_template
            )
            tasks.append(create(chain, split))
        task_results = await asyncio.gather(*tasks)
        return task_results

    task_results = asyncio.run(gather_results())

    extracted_content = []
    for res in task_results:
        extracted_content.extend(res)

    state["extracted_insights"] = extracted_content

    return {"extracted_insights": extracted_content}


def recommend_style_by_blog(state):
    class Style(BaseModel):
        title: str = Field(..., description="스타일 제목")
        description: str = Field(..., description="스타일 설명")
        example: str = Field(..., description="스타일이 적용된 예시")

    class Result(BaseModel):
        styles: List[Style]

    template = """
    사용자에게 적합한 설명 스타일들을 제시하는 것이 목표입니다.
    주어진 주제에 대해 10가지 스타일을 제공해주세요.
    각 스타일은 제목과 간단한 설명, 스타일이 적용되어 주제에 설명하는 예시를 포함합니다.
    스타일은 주제를 매우 충분히 설명할 수 있을정도의 스타일 구성이어야 합니다.
    스타일은 하나 이상의 유형이 조합될 수 있습니다.
    스타일 설명은 스타일 제목과만 연관됩니다.
    스타일 설명은 예시에 대한 내용이 포함되면 안됩니다.
    예시는 충분히 길게 설명해주세요.

    요구되는 내용을 모두 충족하세요.

    주제:
    {example}
    """
    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    example = state["extracted_insights"]
    res = chain.invoke({"example": example})
    res = res.dict()

    return {"web_styles": res["styles"]}


def collect_data(state):
    class Style(BaseModel):
        title: str = Field(..., description="스타일 제목")
        description: str = Field(..., description="스타일 설명")
        example: str = Field(..., description="스타일이 적용된 예시")

    class Result(BaseModel):
        styles: List[Style]

    template = """
    주어진 데이터는 LLM 과 웹 검색을 통해 얻은 설명하는 스타일에 대한 정보입니다.
    이를 종합해서 사용자에게 주제를 설명하기 적절한 방식을 5가지로 종합해주세요.

    주제:
    {example}

    스타일 목록:
    {styles}
    """

    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    example = state["web_styles"]
    styles = state["llm_styles"]
    res = chain.invoke({"styles": styles, "example": example})
    res = res.dict()

    state["styles"] = res["styles"]
    return state


def handle_curriculum(state):
    class Curriculum(BaseModel):
        uuid: str = Field(
            default_factory=lambda: str(uuid.uuid4()),
            title="커리큘럼 UUID",
            description="커리큘럼의 고유 식별자",
        )
        title: str = Field(
            ..., max_length=200, description="커리큘럼의 제목을 나타냅니다."
        )
        order: int = Field(
            ..., ge=1, description="해당 커리큘럼에서 커리큘럼의 순서를 나타냅니다."
        )
        is_mandatory: bool = Field(
            ..., description="필수인지 여부를 나타냅니다 (True 또는 False)"
        )
        description: str = Field(
            ..., max_length=1000, description="커리큘럼에 대한 간단한 설명"
        )

    class Result(BaseModel):
        curriculums: List[Curriculum] = Field(
            description="커리큘럼 UUID 와 커리큘럼 연결"
        )

    prompt = ChatPromptTemplate.from_template(
        """
        주어진 목표와 프로그램(Program)을 바탕으로 커리큘럼을 작성하세요.
        만약 프로그램에 대한 정보가 없다면, 목표를 기준으로 작성하세요.
        각 프로그램은 목표 달성에 필요한 구체적인 학습 활동과 내용을 포함해야 합니다.
        오직 'Result'의 속성에 언급된 내용만 작성해주세요.
        단, 프로그램의 uuid 는 작성하지 않습니다.
    
        출력은 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "curriculums": [
                {{
                    "title": "커리큘럼명",
                    "order": 1,
                    "is_mandatory": true,
                    "description": "커리큘럼 설명"
                }}
            ]
        }}
    
        목표:
        {goal}
        
        프로그램:
        {program}
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    async def create(chain, program, goal):
        return await chain.ainvoke(
            {
                "program": program,
                "goal": goal,
            }
        )

    async def gather_results():
        tasks = []
        programs = []
        for sub in state["programs"].values():
            programs.extend(sub)
        for program in programs:
            tasks.append(create(chain, program, state.get("goal")))
        task_results = await asyncio.gather(*tasks)
        return task_results, programs

    task_results, programs = asyncio.run(gather_results())

    result = {}
    for program, res in zip(programs, task_results):
        curriculums = res.dict()["curriculums"]
        result[program["uuid"]] = curriculums

    return {"curriculums": result}


def handle_subject(state):
    class Subject(BaseModel):
        uuid: str = Field(
            default_factory=lambda: str(uuid.uuid4()),
            title="과목 UUID",
            description="과목의 고유 식별자",
        )
        title: str = Field(..., max_length=200, description="과목의 제목을 나타냅니다.")
        order: int = Field(
            ..., ge=1, description="해당 과목에서 과목의 순서를 나타냅니다."
        )
        is_mandatory: bool = Field(
            ..., description="필수인지 여부를 나타냅니다 (True 또는 False)"
        )
        description: str = Field(
            ..., max_length=1000, description="과목에 대한 간단한 설명"
        )

    class Result(BaseModel):
        subjects: List[Subject] = Field(description="과목 UUID 와 과목 연결")

    prompt = ChatPromptTemplate.from_template(
        """
        주어진 목표와 커리큘럼(Curriculum)을 바탕으로 과목을 작성하세요.
        만약 커리큘럼에 대한 정보가 없다면, 목표를 기준으로 작성하세요.
        각 커리큘럼은 목표 달성에 필요한 구체적인 학습 활동과 내용을 포함해야 합니다.
        오직 'Result'의 속성에 언급된 내용만 작성해주세요.
        단, 커리큘럼의 uuid 는 작성하지 않습니다.
    
        출력은 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "subjects": [
                {{
                    "title": "과목명",
                    "order": 1,
                    "is_mandatory": true,
                    "description": "과목 설명"
                }}
            ]
        }}
    
        목표:
        {goal}
        
        과목:
        {curriculum}
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    result = dict()

    curriculums = []
    for sub in state["curriculums"].values():
        curriculums.extend(sub)

    async def create(chain, curriculum, goal):
        return await chain.ainvoke(
            {
                "curriculum": curriculum,
                "goal": goal,
            }
        )

    async def gather_results():
        tasks = []
        for curriculum in curriculums:
            tasks.append(create(chain, curriculum, state.get("goal")))
        task_results = await asyncio.gather(*tasks)
        return task_results

    task_results = asyncio.run(gather_results())

    for curriculum, res in zip(curriculums, task_results):
        subjects = res.dict()["subjects"]
        result[curriculum["uuid"]] = subjects

    return {"subjects": result}


def handle_module(state):
    class Module(BaseModel):
        uuid: str = Field(
            default_factory=lambda: str(uuid.uuid4()),
            title="모듈 UUID",
            description="모듈의 고유 식별자",
        )
        title: str = Field(..., max_length=200, description="모듈의 제목을 나타냅니다.")
        order: int = Field(
            ..., ge=1, description="해당 과목에서 모듈의 순서를 나타냅니다."
        )
        is_mandatory: bool = Field(
            ..., description="필수인지 여부를 나타냅니다 (True 또는 False)"
        )
        description: str = Field(
            ..., max_length=1000, description="모듈에 대한 간단한 설명"
        )

    class Result(BaseModel):
        modules: List[Module] = Field(description="과목 UUID 와 모듈 연결")

    prompt = ChatPromptTemplate.from_template(
        """
        교육 프로그램 계층 구조에 대한 배경 정보가 제공되었습니다.        
        주어진 목표와 과목(Subject)을 바탕으로 모듈을 작성하세요.
        만약 과목에 대한 정보가 없다면, 목표를 기준으로 작성하세요.
        각 모듈은 목표 달성에 필요한 구체적인 학습 활동과 내용을 포함해야 합니다.
        오직 'Result'의 속성에 언급된 내용만 작성해주세요.
        단, 모듈의 uuid 는 작성하지 않습니다.
    
        출력은 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "subjects": [
                {{
                    "title": "모듈명",
                    "order": 1,
                    "is_mandatory": true,
                    "description": "모듈 설명"
                }}
            ]
        }}
    
        목표:
        {goal}
        
        과목:
        {subject}
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    result = dict()

    subjects = []
    for sub in state["subjects"].values():
        subjects.extend(sub)

    async def create(chain, subject, goal):
        return await chain.ainvoke(
            {
                "subject": subject,
                "goal": goal,
            }
        )

    async def gather_results():
        tasks = []
        for subject in subjects:
            tasks.append(create(chain, subject, state.get("goal")))
        task_results = await asyncio.gather(*tasks)
        return task_results

    task_results = asyncio.run(gather_results())

    for module, res in zip(subjects, task_results):
        modules = res.dict()["modules"]
        result[module["uuid"]] = modules

    return {"modules": result}


def handle_lesson(state):
    class Lesson(BaseModel):
        uuid: str = Field(
            default_factory=lambda: str(uuid.uuid4()),
            title="레슨 UUID",
            description="레슨의 고유 식별자",
        )
        title: str = Field(
            title="레슨명", max_length=200, description="레슨의 제목을 나타냅니다."
        )
        order: int = Field(
            title="레슨 순서",
            ge=1,
            description="해당 모듈에서 레슨의 순서를 나타냅니다.",
        )
        is_mandatory: bool = Field(
            title="필수 여부",
            description="필수인지 여부를 나타냅니다 (True 또는 False)",
        )
        description: str = Field(
            title="레슨 설명", max_length=1000, description="레슨에 대한 간단한 설명"
        )

    class Result(BaseModel):
        lessons: List[Lesson] = Field(description="모듈 UUID 와 주제 연결")

    prompt = ChatPromptTemplate.from_template(
        """
        주어진 목표와 모듈(Module)을 바탕으로 레슨을 작성하세요.
        만약 모듈에 대한 정보가 없다면, 목표를 기준으로 작성하세요.
        각 레슨은 목표 달성에 필요한 구체적인 학습 활동과 내용을 포함해야 합니다.
        오직 'Result'의 속성에 언급된 내용만 작성해주세요.
        단, 레슨의 uuid 는 작성하지 않습니다.
    
        출력은 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "lessons": [
                {{
                    "title": "레슨명",
                    "order": 1,
                    "is_mandatory": true,
                    "description": "레슨 설명"
                }}
            ]
        }}
    
        목표:
        {goal}
        
        모듈:
        {module}
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    # 동시 실행 작업 제한

    semaphore = asyncio.Semaphore(10)  # 동시에 최대 10개의 작업만 허용

    async def create(chain, module, goal, index, total):
        async with semaphore:  # 세마포어로 동시 작업 제한
            logger.info(f"진행 중: {index}/{total} - {module}")
            result = await chain.ainvoke(
                {
                    "module": module,
                    "goal": goal,
                }
            )
            logger.info(f"완료됨: {index}/{total} - {module}")
            return result

    async def gather_results():
        tasks = []
        modules = []

        # state에서 모듈 가져오기
        for sub in state["modules"].values():
            modules.extend(sub)

        total_modules = len(modules)  # 총 모듈 수 계산

        # 각 모듈에 대해 작업 생성
        for index, module in enumerate(modules, 1):
            tasks.append(create(chain, module, state.get("goal"), index, total_modules))

        task_results = await asyncio.gather(*tasks)
        logger.info("모든 작업 완료")
        return task_results, modules

    task_results, modules = asyncio.run(gather_results())

    result = {}
    for module, res in zip(modules, task_results):
        lessons = res.dict()["lessons"]
        result[module["uuid"]] = lessons

    return {"lessons": result}


def handle_topic(state):
    class Data(BaseModel):
        uuid: str = Field(
            default_factory=lambda: str(uuid.uuid4()),
            title="주제 UUID",
            description="주제의 고유 식별자",
        )
        name: str = Field(
            title="주제명", max_length=200, description="주제의 제목을 나타냅니다."
        )
        content: str = Field(
            title="주제 내용",
            max_length=4000,
            description="주제에 대한 상세 설명을 나타냅니다.",
        )

    class Result(BaseModel):
        topics: List[Data] = Field(description="레슨 UUID 와 주제 연결")

    prompt = ChatPromptTemplate.from_template(
        """
        교육 프로그램 계층 구조에 대한 배경 정보가 제공되었습니다.
        주어진 목표와 레슨(Lesson)을 바탕으로 주제(Topic)을 작성하세요.
        만약 레슨에 대한 정보가 없다면, 목표를 기준으로 작성하세요.
        오직 'Result'의 속성에 언급된 내용만 작성해주세요.
        content 에 대한 설명은 최대 4000자까지 작성할 수 있습니다.
        name 의 내용을 conten 에 충분히 서술해주세요.
    
        출력은 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "topics": [
                {{
                    "name": "주제명 1",
                    "content": "주제 내용 1"
                }},
                {{
                    "name": "주제명 2",
                    "content": "주제 내용 2"
                }}
            ]
        }}
    
        목표:
        {goal}
    
        레슨:
        {lesson}
        """
    )

    llm = ChatOpenAI(model_name="gpt-4o-mini").with_structured_output(Result)
    chain = prompt | llm

    # async def create(chain, lesson, goal):
    #     result = await chain.ainvoke(
    #         {
    #             "lesson": lesson,
    #             "goal": goal,
    #         }
    #     )
    #     logger.info("요청 처리됨")
    #     return result

    # async def gather_results():
    #     tasks = []
    #     lessons = []
    #     for sub in state["lessons"].values():
    #         lessons.extend(sub)
    #     for lesson in lessons:
    #         tasks.append(create(chain, lesson, state.get("goal")))
    #     task_results = await asyncio.gather(*tasks)
    #     return task_results, lessons

    # 동시 실행 작업 제한
    semaphore = asyncio.Semaphore(10)  # 동시에 최대 10개의 작업만 허용

    async def create(chain, lesson, goal, index, total):
        async with semaphore:  # 세마포어로 동시 작업 제한
            logger.info(f"진행 중: {index}/{total} - {lesson}")
            result = await chain.ainvoke(
                {
                    "lesson": lesson,
                    "goal": goal,
                }
            )
            logger.info(f"완료됨: {index}/{total} - {lesson}")
            return result

    async def gather_results():
        tasks = []
        lessons = []
        for sub in state["lessons"].values():
            lessons.extend(sub)

        total_lessons = len(lessons)

        for index, lesson in enumerate(lessons, 1):
            tasks.append(create(chain, lesson, state.get("goal"), index, total_lessons))

        task_results = await asyncio.gather(*tasks)
        logger.info("모든 작업 완료")
        return task_results, lessons

    task_results, lessons = asyncio.run(gather_results())

    result = {}
    for lesson, res in zip(lessons, task_results):
        topics = res.dict()["topics"]
        result[lesson["uuid"]] = topics

    state["topics"] = result
    logger.info(result)
    return {"topics": result}


def determine_next_node(state):
    if state["category"] == "programs":
        return "Curriculum"

    if state["category"] == "curriculums":
        return "Subject"

    if state["category"] == "subjects":
        return "Module"

    if state["category"] == "modules":
        return "Lesson"

    if state["category"] == "lessons":
        return "Topic"


def check_classify_result(state):
    result = state.get("classify_result", "")
    if result == "none":
        return "end"
    else:
        return "continue"


def select_node(state):
    print(state)
    return state


def summary_result(state):
    logger.info("Summary result")

    def update_relations(state, parent_key, child_key):
        parents = state[parent_key]
        children = state[child_key]

        ext = []
        for sub in parents.values():
            ext.extend(sub)

        for parent in ext:
            parent[child_key] = children[parent["uuid"]]

    update_relations(state, "lessons", "topics")

    if state["category"] == "lessons":
        return {"result": state["lessons"]}

    update_relations(state, "modules", "lessons")

    if state["category"] == "modules":
        return {"result": state["modules"]}

    update_relations(state, "subjects", "modules")

    if state["category"] == "subjects":
        return {"result": state["subjects"]}

    update_relations(state, "curriculums", "subjects")

    if state["category"] == "curriculums":
        return {"result": state["curriculums"]}

    update_relations(state, "programs", "curriculums")

    if state["category"] == "programs":
        return {"result": state["programs"]}

    return state


def build_graph():
    graph = StateGraph(State)

    # -------------------------
    # 1. Classify 및 선택 관련 노드
    # -------------------------
    graph.add_node("Classify", classify_input)
    graph.add_node("SelectExample", select_example)

    # -------------------------
    # 2. 스타일 추천 관련 노드
    # -------------------------
    graph.add_node("RecommendStyleByLLM", recommend_style_by_llm)
    graph.add_node("ScrapBlog", scrap_blog)
    graph.add_node("ExtractInsight", extract_insight)
    graph.add_node("RecommendStyleByBlog", recommend_style_by_blog)

    # -------------------------
    # 3. 데이터 수집 관련 노드
    # -------------------------
    graph.add_node("CollectData", collect_data)

    # -------------------------
    # 4. 커리큘럼 관련 노드
    # -------------------------
    graph.add_node("Curriculum", handle_curriculum)
    graph.add_node("Subject", handle_subject)
    graph.add_node("Module", handle_module)
    graph.add_node("Lesson", handle_lesson)
    graph.add_node("Topic", handle_topic)

    graph.add_node("SelectNode", select_node)
    graph.add_node("Summary", summary_result)

    # -------------------------
    # 엣지 정의
    # -------------------------

    # 1. Classify 및 선택 관련 경로 설정
    graph.set_entry_point("Classify")

    # Classify 결과가 "end"일 경우 종료
    graph.add_conditional_edges(
        "Classify", check_classify_result, {"end": END, "continue": "SelectExample"}
    )

    # 2. 스타일 추천 경로 설정
    graph.add_edge("SelectExample", "RecommendStyleByLLM")
    graph.add_edge("SelectExample", "ScrapBlog")
    graph.add_edge("ScrapBlog", "ExtractInsight")
    graph.add_edge("ExtractInsight", "RecommendStyleByBlog")

    # RecommendStyleByBlog 또는 RecommendStyleByLLM에서 CollectData로 이동
    graph.add_edge(["RecommendStyleByBlog", "RecommendStyleByLLM"], "CollectData")

    # CollectData와 Classify의 결과를 SelectNode로 연결
    graph.add_edge(["CollectData", "Classify"], "SelectNode")

    # 4. 커리큘럼 경로 설정
    graph.add_conditional_edges(
        "SelectNode",
        determine_next_node,
        {
            "Curriculum": "Curriculum",
            "Subject": "Subject",
            "Module": "Module",
            "Lesson": "Lesson",
            "Topic": "Topic",
        },
    )

    graph.add_edge("Curriculum", "Subject")
    graph.add_edge("Subject", "Module")
    graph.add_edge("Module", "Lesson")
    graph.add_edge("Lesson", "Topic")
    graph.add_edge("Topic", "Summary")
    graph.add_edge("Summary", END)

    # -------------------------
    # 메모리 설정
    # -------------------------
    memory = MemorySaver()
    return graph.compile(checkpointer=memory, interrupt_after=["SelectNode"])
