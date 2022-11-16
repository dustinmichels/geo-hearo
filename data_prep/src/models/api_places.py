from typing import List

from pydantic import BaseModel, Field


class Place(BaseModel):
    size: int
    id: str
    geo: tuple[float, float]
    url: str
    boost: bool
    title: str
    country: str


class Data(BaseModel):
    list: List[Place]
    version: str


class ApiGetPlacesResp(BaseModel):
    api_version: int = Field(..., alias="apiVersion")
    version: str
    data: Data
