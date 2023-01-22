import requests

from src.models import ApiGetChannelsResp, ApiGetPlacesResp


class Api:

    base_url = "https://radio.garden/api"

    @classmethod
    def get_places(cls) -> ApiGetPlacesResp:
        url = f"{cls.base_url}/ara/content/places"
        r = requests.get(url)
        resp = r.json()
        return ApiGetPlacesResp(**resp)

    @classmethod
    def get_place(cls, place_id):
        # TODO: create a model for this
        url = f"{cls.base_url}/ara/content/page/{place_id}"
        r = requests.get(url)
        return r.json()

    @classmethod
    def get_place_channels(cls, place_id) -> ApiGetChannelsResp:
        url = f"{cls.base_url}/ara/content/page/{place_id}/channels"
        r = requests.get(url)
        resp = r.json()
        return ApiGetChannelsResp(**resp)

    @classmethod
    def get_stream_url(cls, channel_id):
        url = f"{cls.base_url}/ara/content/listen/{channel_id}/channel.mp3"
        return url
