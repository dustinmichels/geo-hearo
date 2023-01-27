#!/bin/zsh

# run the go scraper, creating output.csv
cd crawl
go build .
./crawl

cd ..

# process with python
cd process
conda activate geohearo
python process
