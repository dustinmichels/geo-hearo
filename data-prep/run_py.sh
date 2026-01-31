#!/bin/zsh

# clear files in data/out except .gitkeep
rm -f data/out/*.{json,geojson}

# Create virtual environment if it doesn't exist
[ ! -d ".venv" ] && uv venv

uv run 01_load_data.py
uv run 02_centroids.py
uv run 03_filter_radio.py
uv run 04_match_radio.py
uv run 05_organize.py

