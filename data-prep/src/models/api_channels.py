from typing import List
from pydantic import BaseModel, Field


class Item(BaseModel):
    href: str
    title: str


class Content(BaseModel):
    items_type: str = Field(..., alias="itemsType")
    type_: str = Field(alias="type")
    items: List[Item]


class Data(BaseModel):
    map: str
    url: str
    type: str
    count: int
    title: str
    subtitle: str
    utc_offset: int = Field(..., alias="utcOffset")
    content: List[Content]


class ApiGetChannelsResp(BaseModel):
    api_version: int = Field(..., alias="apiVersion")
    version: str
    data: Data
