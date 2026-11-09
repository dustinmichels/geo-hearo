#!/bin/zsh
set -e

cd "${0:A:h}"

# run the go scraper, creating crawl/out/output.csv
(cd crawl && go build -o crawl . && ./crawl)

# process data with python
./run_py.sh
