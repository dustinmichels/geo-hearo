package main

import (
	"flag"
	"log"
	"strings"

	"github.com/dustinmichels/geo-hearo/crawl/crawldata"
)

func main() {
	inputFlag := flag.String("inputs", "out/output_radiogarden.csv,out/output_radiobrowser.csv", "comma-separated list of input CSV files")
	outputFlag := flag.String("output", "out/output.csv", "merged output CSV file")
	flag.Parse()

	if err := crawldata.Merge(strings.Split(*inputFlag, ","), *outputFlag); err != nil {
		log.Fatal(err)
	}
}
