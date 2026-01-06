#!/bin/zsh

# clear files in data/out except .gitkeep
rm -f data/out/*.{json,geojson}

# Create virtual environment if it doesn't exist
[ ! -d ".venv" ] && uv venv

uv run 01_prepare_geodata.py
uv run 02_process_radio.py
uv run 03_filter_stations.py