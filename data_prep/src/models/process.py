from typing import List, TypedDict

from .api_places import Place

PlacesByCountry = dict[str, List[Place]]


class Channel(TypedDict):
    id: str
    title: str


ChannelsByCountry = dict[str, List[Channel]]
