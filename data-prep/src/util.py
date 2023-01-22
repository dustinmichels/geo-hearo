import json
import random


def sample_from_dict(d, n=5):
    keys = random.sample(list(d), n)
    return {k: d[k] for k in keys}


def save_json(data: dict, fp: str):
    with open(fp, "w") as f:
        json.dump(data, f)


# ----------------------------
# saved stations
# ----------------------------


def filter_stations(data, size=4):
    return {k: data[k] for k in data if len(data[k]) >= size}


def flatten(data):
    flat = []
    for country, stations in data.items():
        for s in stations:
            new_s = {"country": country, **s}
            flat.append(new_s)
    return flat


def load_saved_data(fp="../data/out/saved_channels.json"):
    with open(fp) as f:
        data = json.load(f)
    return flatten(filter_stations(data))
