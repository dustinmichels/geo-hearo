package main

import (
	"context"
	"flag"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/dustinmichels/geo-hearo/crawl/crawldata"
	"github.com/dustinmichels/geo-hearo/crawl/radiobrowser"
	"github.com/dustinmichels/geo-hearo/crawl/radiogarden"
	"github.com/gocarina/gocsv"
)

// scraperAdapter wraps each package's Scraper so it satisfies the main.Scraper interface.
type radiogardenAdapter struct{ s *radiogarden.Scraper }

func (a *radiogardenAdapter) Name() string { return a.s.Name() }
func (a *radiogardenAdapter) Scrape(ctx context.Context, threads int) ([]*Station, error) {
	rows, err := a.s.Scrape(ctx, threads)
	if err != nil {
		return nil, err
	}
	out := make([]*Station, 0, len(rows))
	for _, r := range rows {
		out = append(out, &Station{
			Source:      "RG",
			ChannelID:   r.ChannelID,
			ChannelName: r.ChannelName,
			StreamURL:   r.StreamURL,
			Country:     r.Country,
			GeoLat:      r.GeoLat,
			GeoLon:      r.GeoLon,
			PlaceName:   r.PlaceName,
			Homepage:    r.Homepage,
		})
	}
	return out, nil
}

type radiobrowserAdapter struct{ s *radiobrowser.Scraper }

func (a *radiobrowserAdapter) Name() string { return a.s.Name() }
func (a *radiobrowserAdapter) Scrape(ctx context.Context, threads int) ([]*Station, error) {
	rows, err := a.s.Scrape(ctx, threads)
	if err != nil {
		return nil, err
	}
	out := make([]*Station, 0, len(rows))
	for _, r := range rows {
		out = append(out, &Station{
			Source:      "RB",
			ChannelID:   r.ChannelID,
			ChannelName: r.ChannelName,
			StreamURL:   r.StreamURL,
			Country:     r.Country,
			CountryCode: r.CountryCode,
			GeoLat:      r.GeoLat,
			GeoLon:      r.GeoLon,
			PlaceName:   r.PlaceName,
			Tags:        r.Tags,
			Homepage:    r.Homepage,
			Language:    r.Language,
		})
	}
	return out, nil
}

// registry maps names to available scrapers.
var registry = map[string]Scraper{
	"radiogarden":  &radiogardenAdapter{s: &radiogarden.Scraper{}},
	"radiobrowser": &radiobrowserAdapter{s: &radiobrowser.Scraper{}},
}

func main() {
	scraperNames := flag.String("scrapers", "", "comma-separated scrapers to run (default: all). When all scrapers run, results are automatically merged into out/output.csv")
	threads := flag.Int("threads", 20, "number of concurrent threads per scraper")
	flag.Parse()

	runAll := strings.TrimSpace(*scraperNames) == ""
	scrapers := selectScrapers(*scraperNames)

	createDirIfNotExist("./out")
	createDirIfNotExist("./out/backup")
	date := time.Now().Format("2006-01-02")
	for _, s := range scrapers {
		backupFile("out/output_"+s.Name()+".csv", "out/backup/output_"+s.Name()+"_"+date+".csv")
	}
	if runAll {
		backupFile("out/output.csv", "out/backup/output_"+date+".csv")
	}

	log.Println("**** Starting crawl ****")

	results, err := Run(context.Background(), scrapers, *threads)
	if err != nil {
		log.Printf("WARN: %v\n", err)
	}

	var writtenFiles []string
	for name, stations := range results {
		path := "out/output_" + name + ".csv"
		log.Printf("**** Saving %s (%d stations) ****\n", path, len(stations))
		saveToCsv(stations, path)
		writtenFiles = append(writtenFiles, path)
	}

	if runAll {
		log.Println("**** Merging and deduplicating ****")
		runMerge(writtenFiles, "out/output.csv")
	}
}

func runMerge(inputFiles []string, outputPath string) {
	var all []*Station
	for _, path := range inputFiles {
		stations, err := crawldata.ReadCSV(path)
		if err != nil {
			log.Printf("WARN: could not read %s for merge: %v\n", path, err)
			continue
		}
		all = append(all, stations...)
	}
	log.Printf("Total before dedup: %d\n", len(all))

	pass1 := crawldata.DeduplicateByURL(all)
	log.Printf("After URL dedup:       %d (removed %d)\n", len(pass1), len(all)-len(pass1))

	pass2 := crawldata.DeduplicateByNameCity(pass1)
	log.Printf("After name+city dedup: %d (removed %d)\n", len(pass2), len(pass1)-len(pass2))

	if err := crawldata.WriteCSV(pass2, outputPath); err != nil {
		log.Printf("ERROR: merge write failed: %v\n", err)
		return
	}
	log.Printf("**** Merged output written to %s ****\n", outputPath)
}

func selectScrapers(names string) []Scraper {
	if names == "" {
		all := make([]Scraper, 0, len(registry))
		for _, s := range registry {
			all = append(all, s)
		}
		return all
	}

	var selected []Scraper
	for _, name := range strings.Split(names, ",") {
		name = strings.TrimSpace(name)
		s, ok := registry[name]
		if !ok {
			log.Fatalf("unknown scraper %q (available: %v)", name, keys(registry))
		}
		selected = append(selected, s)
	}
	return selected
}

func keys(m map[string]Scraper) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

func backupFile(src, dst string) {
	if _, err := os.Stat(src); os.IsNotExist(err) {
		return
	}
	log.Printf("**** Backing up %s to %s ****\n", src, dst)
	sourceFile, err := os.Open(src)
	if err != nil {
		log.Printf("Error opening source file for backup: %v", err)
		return
	}
	defer sourceFile.Close()
	destFile, err := os.Create(dst)
	if err != nil {
		log.Printf("Error creating backup file: %v", err)
		return
	}
	defer destFile.Close()
	if _, err := io.Copy(destFile, sourceFile); err != nil {
		log.Printf("Error copying backup file: %v", err)
	}
}

func createDirIfNotExist(dir string) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		log.Println("***** Creating './out' dir ****")
		err = os.MkdirAll(dir, 0755)
		if err != nil {
			panic(err)
		}
	}
}

func saveToCsv(output []*Station, path string) {
	os.Remove(path)
	outCSV, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		panic(err)
	}
	defer outCSV.Close()
	gocsv.MarshalFile(output, outCSV)
}
