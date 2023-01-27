#!/bin/zsh

# run the go scraper, creating output.csv
cd crawl
go build .
./crawl

cd ..

# process data with python
source ~/opt/anaconda3/etc/profile.d/conda.sh
conda activate geohearo
python process.py
