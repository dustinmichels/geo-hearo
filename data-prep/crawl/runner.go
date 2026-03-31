package main

import (
	"context"
	"fmt"
	"log"
	"sync"
)

// Run executes all scrapers concurrently and returns results keyed by scraper name.
func Run(ctx context.Context, scrapers []Scraper, threads int) (map[string][]*Station, error) {
	type result struct {
		stations []*Station
		err      error
		name     string
	}

	results := make(chan result, len(scrapers))
	var wg sync.WaitGroup

	for _, s := range scrapers {
		wg.Add(1)
		go func(s Scraper) {
			defer wg.Done()
			log.Printf("[%s] starting\n", s.Name())
			stations, err := s.Scrape(ctx, threads)
			results <- result{stations: stations, err: err, name: s.Name()}
		}(s)
	}

	wg.Wait()
	close(results)

	all := make(map[string][]*Station)
	var errs []error

	for r := range results {
		if r.err != nil {
			errs = append(errs, fmt.Errorf("[%s] %w", r.name, r.err))
			continue
		}
		log.Printf("[%s] collected %d stations\n", r.name, len(r.stations))
		all[r.name] = r.stations
	}

	if len(errs) > 0 {
		return all, fmt.Errorf("scraper errors: %v", errs)
	}
	return all, nil
}
