#!/bin/zsh

# clear files in data/out except .gitkeep
rm -f data

# Create virtual environment if it doesn't exist
[ ! -d ".venv" ] && uv venv

uv run scripts/01_load_data.py
uv run scripts/02_centroids.py
uv run scripts/03_filter_radio.py
uv run scripts/04_match_radio.py
uv run scripts/05_organize.py

