package main

import (
	"log"
	"os"

	"github.com/gocarina/gocsv"
)

func main() {
	createDirIfNotExist("./out")

	log.Println("**** Starting crawl ****")
	output := Crawl(1)

	saveToCsv(output)
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

func saveToCsv(output []*OutputRow) {
	log.Println("**** Deleting './out/output.csv' ****")
	os.Remove("./out/output.csv")

	log.Println("**** Saving './out/output.csv' ****")
	outCSV, err := os.OpenFile("out/output.csv", os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		panic(err)
	}
	defer outCSV.Close()

	gocsv.MarshalFile(output, outCSV)
}
