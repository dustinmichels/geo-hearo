"""
06_split_chunks.py

Splits fixed-width stations.jsonl into chunks each under TARGET_MB,
never splitting a country across two files. Outputs updated index.json
with 'file' (chunk index) and local 'start' byte offset per country.

Usage: uv run scripts/06_split_chunks.py
"""

import json
import os

DATA_INPUT = "data/out/stations.jsonl"
INDEX_INPUT = "data/out/index.json"
OUTPUT_DIR = "data/out"
CHUNK_PREFIX = "stations"
INDEX_OUTPUT = "data/out/index.json"
TARGET_BYTES = 45 * 1024 * 1024  # 45MB


def main():
    with open(INDEX_INPUT) as f:
        idx = json.load(f)

    line_length = idx["config"]["line_length"]

    sample = next(iter(idx["countries"].values()))
    if "file" in sample:
        # Index was already chunked — reconstruct global offsets from (file, local_start) order
        by_file_order = sorted(idx["countries"].items(), key=lambda kv: (kv[1]["file"], kv[1]["start"]))
        cumulative = 0
        ordered = []
        for name, data in by_file_order:
            ordered.append((name, {**data, "start": cumulative}))
            cumulative += data["count"] * line_length
    else:
        ordered = sorted(idx["countries"].items(), key=lambda kv: kv[1]["start"])

    # Pass 1: plan chunk assignments
    plan = []  # (name, global_start, count, chunk_id, local_start)
    chunk_id = 0
    chunk_bytes = 0
    chunk_base_global = 0

    for name, data in ordered:
        country_bytes = data["count"] * line_length
        if chunk_bytes + country_bytes > TARGET_BYTES and chunk_bytes > 0:
            chunk_id += 1
            chunk_base_global += chunk_bytes
            chunk_bytes = 0

        local_start = data["start"] - chunk_base_global
        assert local_start == chunk_bytes, (
            f"Offset mismatch for {name}: expected {chunk_bytes}, got {local_start}"
        )
        plan.append((name, data["start"], data["count"], chunk_id, local_start))
        chunk_bytes += country_bytes

    num_chunks = chunk_id + 1
    print(f"Creating {num_chunks} chunk files...")

    # Pass 2: write chunk files
    out_paths = [
        os.path.join(OUTPUT_DIR, f"{CHUNK_PREFIX}_{i}.jsonl") for i in range(num_chunks)
    ]
    out_handles = [open(p, "wb") for p in out_paths]
    try:
        with open(DATA_INPUT, "rb") as f_in:
            for name, global_start, count, cid, _ in plan:
                country_bytes = count * line_length
                f_in.seek(global_start)
                data_bytes = f_in.read(country_bytes)
                if len(data_bytes) != country_bytes:
                    raise RuntimeError(
                        f"Short read for {name}: got {len(data_bytes)}, expected {country_bytes}"
                    )
                out_handles[cid].write(data_bytes)
    finally:
        for fh in out_handles:
            fh.close()

    # Write updated index.json
    new_countries = {
        name: {"file": cid, "start": local_start, "count": count}
        for name, _, count, cid, local_start in plan
    }
    with open(INDEX_OUTPUT, "w") as f:
        json.dump({"config": {"line_length": line_length}, "countries": new_countries}, f)

    # Print summary
    for i, path in enumerate(out_paths):
        size_mb = os.path.getsize(path) / (1024 * 1024)
        country_ct = sum(1 for *_, cid, _ in plan if cid == i)
        print(f"  {os.path.basename(path)}: {size_mb:.1f} MB, {country_ct} countries")
    print("Done. index.json updated.")


if __name__ == "__main__":
    main()
