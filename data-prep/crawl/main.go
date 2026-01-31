package main

import (
	"io"
	"log"
	"os"

	"github.com/gocarina/gocsv"
)

func main() {
	createDirIfNotExist("./out")
	backupOldOutput()

	log.Println("**** Starting crawl ****")
	output := Crawl(20)

	saveToCsv(output)
}

func backupOldOutput() {
	src := "out/output.csv"
	dst := "out/output_previous.csv"

	if _, err := os.Stat(src); os.IsNotExist(err) {
		return
	}

	log.Println("**** Backing up output.csv to output_previous.csv ****")

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
