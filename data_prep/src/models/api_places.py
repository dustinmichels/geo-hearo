from typing import List

from pydantic import BaseModel, Field


class Place(BaseModel):
    size: int  # Eg, 1
    id: str  # Eg, "7c7rwVkV"
    geo: tuple[float, float]  # Eg, [-100.532425, 18.24008]
    url: str  # Eg, "/visit/tlapehuala/7c7rwVkV"
    boost: bool  # Eg, false
    title: str  # Eg, "Tlapehuala"
    country: str  # Eg, "Mexico"


class Data(BaseModel):
    list: List[Place]
    version: str


class ApiGetPlacesResp(BaseModel):
    api_version: int = Field(..., alias="apiVersion")
    version: str
    data: Data
