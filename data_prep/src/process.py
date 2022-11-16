import random
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import DefaultDict, List

from tqdm import tqdm

from src.api import Api
from src.models import (
    Channel,
    ChannelsByCountry,
    Place,
    PlacesByCountry,
)

# ----------------------------------------------------------------------
# Places
# ----------------------------------------------------------------------


def convert_to_places_by_country(places: List[Place]) -> PlacesByCountry:
    """
    Return a dict keyed by country with a list of places as values.
    """
    places_by_country: DefaultDict = defaultdict(list)
    for place in places:
        c = place.country
        places_by_country[c].append(place)
    return dict(places_by_country)


def sample_places_by_country(
    places_by_country: PlacesByCountry, n=5
) -> PlacesByCountry:
    """
    Take a sample of [up-to] n places for each country.
    """
    sample_places = {}
    for country, places in places_by_country.items():
        use_n = min(len(places), n)
        sample_places[country] = random.sample(places, use_n)
    return sample_places


# ----------------------------------------------------------------------
# Radio Stations
# ----------------------------------------------------------------------


def select_random_stations(
    data: PlacesByCountry,
) -> ChannelsByCountry:
    """
    Return a dict keyed by place with the first station as value.
    """
    select_channels = defaultdict(list)
    places = _flatten(data)
    for place in tqdm(places):
        chan = _get_random_station_for_place(place.id)
        select_channels[place.country].append(chan)
    return dict(select_channels)


def select_random_stations_multithreaded(
    data: PlacesByCountry,
    workers: int = 15,
) -> ChannelsByCountry:
    select_channels: DefaultDict = defaultdict(list)
    future_to_country: dict = {}
    places = _flatten(data)

    with tqdm(total=len(places)) as pbar:

        # Create a thread pool to process the list of places
        with ThreadPoolExecutor(max_workers=workers) as executor:
            # launch thread for each place
            for place in places:
                f = executor.submit(_get_random_station_for_place, place.id)
                future_to_country[f] = place.country

            # as the futures complete, add the results to the dict
            for future in as_completed(future_to_country):
                country = future_to_country[future]
                select_channels[country].append(future.result())
                pbar.update(1)

    return dict(select_channels)


def _get_random_station_for_place(place_id: str) -> Channel:
    """
    Given a place id, make an API call to get a list of channels.
    Return a random channel from the list, formatted as Channel.
    """
    place_channels = Api.get_place_channels(place_id)
    ch = random.choice(place_channels.data.content[0].items)
    return Channel(id=ch.href.split("/")[-1], title=ch.title)


def _flatten(places_by_country: PlacesByCountry) -> List[Place]:
    flat: List[Place] = []
    for _, places in places_by_country.items():
        flat.extend(places)
    return flat
