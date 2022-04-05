package util

import (
	"bufio"
	"encoding/csv"
	"io"
	"os"
)

func LoadCsvFile(path string, rows *[][]string) {
	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	reader := csv.NewReader(bufio.NewReader(file))
	reader.LazyQuotes = true

	i := 0
	for {
		line, err := reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			// log.Fatal(error)
			panic(err)
		}

		*rows = append(*rows, line)

		i += 1
	}
}

func WriteCsvFile(path string, rows *[][]string) {
	file, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	writer := csv.NewWriter(file)
	defer writer.Flush()

	i := 0
	for _, row := range *rows {
		err = writer.Write(row)
		if err != nil {
			panic(err)
		}

		i += 1
	}
}
