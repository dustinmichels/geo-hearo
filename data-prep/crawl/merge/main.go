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

	if err := merge(strings.Split(*inputFlag, ","), *outputFlag); err != nil {
		log.Fatal(err)
	}
}

func merge(inputFiles []string, outputPath string) error {
	var all []*crawldata.Station
	for _, path := range inputFiles {
		path = strings.TrimSpace(path)
		stations, err := crawldata.ReadCSV(path)
		if err != nil {
			log.Printf("WARN: skipping %s: %v\n", path, err)
			continue
		}
		log.Printf("Loaded %d stations from %s\n", len(stations), path)
		all = append(all, stations...)
	}
	log.Printf("Total before dedup: %d\n", len(all))

	pass1 := crawldata.DeduplicateByURL(all)
	log.Printf("After URL dedup:       %d (removed %d)\n", len(pass1), len(all)-len(pass1))

	pass2 := crawldata.DeduplicateByNameCity(pass1)
	log.Printf("After name+city dedup: %d (removed %d)\n", len(pass2), len(pass1)-len(pass2))

	if err := crawldata.WriteCSV(pass2, outputPath); err != nil {
		return err
	}
	log.Printf("Written to %s\n", outputPath)
	return nil
}
