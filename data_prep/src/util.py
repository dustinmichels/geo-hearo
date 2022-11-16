import json
import random


def sample_from_dict(d, n=5):
    keys = random.sample(list(d), n)
    return {k: d[k] for k in keys}


def save_json(data: dict, fp: str):
    with open(fp, "w") as f:
        json.dump(data, f)
