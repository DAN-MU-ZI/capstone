from pydantic import BaseModel
from typing import Optional, List


class ExampleInput(BaseModel):
    input: str


class CurriculumItem(BaseModel):
    title: str
    subItems: Optional[List["CurriculumItem"]] = None


class StylesInput(BaseModel):
    styles: List[str]


class Response(BaseModel):
    data: object


class Explanation(BaseModel):
    style: str
    content: str


class Example(BaseModel):
    title: str
    examples: List[Explanation]


class ExampleInput(BaseModel):
    input: str
