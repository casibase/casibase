// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package util

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func parseJsonToFloats(s string) []float64 {
	s = strings.TrimLeft(s, "[")
	s = strings.TrimRight(s, "]")
	s = strings.ReplaceAll(s, "\n", "")

	tokens := strings.Split(s, " ")
	res := []float64{}
	for _, token := range tokens {
		if token == "" {
			continue
		}

		f := ParseFloat(token)
		res = append(res, f)
	}
	return res
}

func LoadFactorFileByCsv(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	rows := [][]string{}
	LoadCsvFile(path, &rows)

	for _, row := range rows {
		if row[0] == "" {
			continue
		}

		nameArray = append(nameArray, row[1])
		dataArray = append(dataArray, parseJsonToFloats(row[2]))
	}

	return nameArray, dataArray
}

func LoadFactorFileByCsv2(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	rows := [][]string{}
	LoadCsvFile(path, &rows)

	for _, row := range rows {
		nameArray = append(nameArray, row[0])
		dataArray = append(dataArray, StringsToFloats(row[1:]))
	}

	return nameArray, dataArray
}

func LoadFactorFileBySpace(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	const maxCapacity = 1024 * 1024 * 8
	buf := make([]byte, maxCapacity)
	scanner.Buffer(buf, maxCapacity)
	i := 0
	for scanner.Scan() {
		if i == 0 {
			i += 1
			continue
		}

		line := scanner.Text()

		line = strings.Trim(line, " ")
		tokens := strings.Split(line, " ")
		nameArray = append(nameArray, tokens[0])

		data := []float64{}
		for j := 1; j < len(tokens); j++ {
			data = append(data, ParseFloat(tokens[j]))
		}
		dataArray = append(dataArray, data)

		i += 1
	}

	if err = scanner.Err(); err != nil {
		panic(err)
	}

	return nameArray, dataArray
}

// downloadFile downloads a file from a URL to a local path with progress reporting
func downloadFile(url, filepath string) error {
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	totalSize := resp.ContentLength

	// Create a progress tracking reader
	counter := &progressCounter{
		total:     totalSize,
		filename:  filepath,
		lastPrint: time.Now(),
	}
	reader := io.TeeReader(resp.Body, counter)

	// Write the body to file
	_, err = io.Copy(out, reader)
	if err != nil {
		return err
	}

	return nil
}

// progressCounter is used to track download progress
type progressCounter struct {
	current   int64
	total     int64
	filename  string
	lastPrint time.Time
}

// Write implements the io.Writer interface
func (pc *progressCounter) Write(p []byte) (int, error) {
	n := len(p)
	pc.current += int64(n)

	// Print progress every 10 second
	if time.Since(pc.lastPrint) > 10*time.Second {
		if pc.total > 0 {
			progress := float64(pc.current) / float64(pc.total) * 100
			fmt.Printf("Downloading %s: %.2f%% (%d/%d bytes)\n",
				pc.filename, progress, pc.current, pc.total)
		} else {
			fmt.Printf("Downloading %s: %d bytes\n", pc.filename, pc.current)
		}
		pc.lastPrint = time.Now()
	}

	return n, nil
}

// downloadMaxmindFiles downloads MaxMind database files from GitHub
func downloadMaxmindFiles() {
	// GitHub repo for the data files
	repoURL := "https://github.com/casibase/data"

	// Ensure data directory exists
	if err := os.MkdirAll("data", os.ModePerm); err != nil {
		fmt.Printf("Error creating data directory: %v\n", err)
	}

	// Download City database
	fmt.Println("Downloading GeoLite2-City database...")
	cityErr := downloadFile(fmt.Sprintf("%s/raw/master/GeoLite2-City.mmdb", repoURL), "data/GeoLite2-City.mmdb")
	if cityErr != nil {
		fmt.Printf("Failed to download GeoLite2-City database: %v\n", cityErr)
	}

	// Download ASN database
	fmt.Println("Downloading GeoLite2-ASN database...")
	asnErr := downloadFile(fmt.Sprintf("%s/raw/master/GeoLite2-ASN.mmdb", repoURL), "data/GeoLite2-ASN.mmdb")
	if asnErr != nil {
		fmt.Printf("Failed to download GeoLite2-ASN database: %v\n", asnErr)
	}

	// Update status in util package
	MaxmindDownloadInProgress = false

	// Try to initialize the database if at least one download was successful
	if cityErr == nil || asnErr == nil {
		if err := InitMaxmindDb(); err != nil {
			fmt.Printf("Failed to initialize MaxMind databases after download: %v\n", err)
		}
	} else {
		fmt.Println("Failed to download any MaxMind database files, initialization skipped")
	}
}

// InitMaxmindFiles checks if MaxMind database files exist and downloads them if needed
func InitMaxmindFiles() {

	// Paths to check
	cityDbPath := "data/GeoLite2-City.mmdb"
	asnDbPath := "data/GeoLite2-ASN.mmdb"

	// Also check parent directory
	cityDbPathAlt := "../data/GeoLite2-City.mmdb"
	asnDbPathAlt := "../data/GeoLite2-ASN.mmdb"

	// Check if files exist in either location
	_, cityErr := os.Stat(cityDbPath)
	_, cityErrAlt := os.Stat(cityDbPathAlt)
	_, asnErr := os.Stat(asnDbPath)
	_, asnErrAlt := os.Stat(asnDbPathAlt)

	cityExists := cityErr == nil || cityErrAlt == nil
	asnExists := asnErr == nil || asnErrAlt == nil

	// If both files exist, we're done
	if cityExists && asnExists {
		return
	}

	// Set download in progress flag in util package
	MaxmindDownloadInProgress = true

	go downloadMaxmindFiles()
}
