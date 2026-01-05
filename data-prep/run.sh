#!/bin/zsh

# run the go scraper, creating output.csv
cd crawl
go build .
./crawl

cd ..

# process data with python
# Create virtual environment if it doesn't exist
[ ! -d ".venv" ] && uv venv

# Run using uv (no activation needed)
uv run main.py