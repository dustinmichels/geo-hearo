package main

import "context"

// Scraper is implemented by each radio data source.
type Scraper interface {
	Name() string
	Scrape(ctx context.Context, threads int) ([]*Station, error)
}
