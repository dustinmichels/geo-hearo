#!/bin/zsh

# delete then recreate public/data
rm -rf frontend/public/data
mkdir -p frontend/public/data

# centers
# No longer used
# cp data-prep/data/out/centers.geojson frontend/public/data/centers.geojson

# countries
cp data-prep/data/ne/ne_110m_admin_only.geojson frontend/public/data/ne_countries.geojson

# radio
cp data-prep/data/out/stations.jsonl frontend/public/data/stations.jsonl
cp data-prep/data/out/index.json frontend/public/data/index.json
