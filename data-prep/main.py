import json
import logging

from src.api import Api
from src.log import log
from src.process import (
    convert_to_places_by_country,
    sample_places_by_country,
    select_random_stations_multithreaded,
)
from src.util import save_json


def main():
    log.info("> Getting places...")
    places = Api.get_places().data.list

    log.info("> Converting to places by country...")
    places_by_country = convert_to_places_by_country(places)
    select_places = sample_places_by_country(places_by_country, n=4)

    log.info("> Selecting random stations...")
    res = select_random_stations_multithreaded(select_places)

    logging.info("> Saving file...")
    save_json(res, "data/out/saved_channels.json")


if __name__ == "__main__":
    main()
