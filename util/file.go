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
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/proxy"
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

func DownloadFile(url string) (*bytes.Buffer, error) {
	httpClient := proxy.GetHttpClient(url)

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	fileBuffer := bytes.NewBuffer(nil)
	_, err = io.Copy(fileBuffer, resp.Body)
	if err != nil {
		return nil, err
	}

	return fileBuffer, nil
}

// downloadMaxmindFiles downloads MaxMind database files from GitHub
func downloadMaxmindFiles(cityExists, asnExists bool) {
	frontendBaseDir := conf.GetConfigString("frontendBaseDir")

	// GitHub repo for the data files
	repoURL := "https://github.com/casibase/data"

	// Helper function to download and save a file
	downloadAndSave := func(filename string) error {
		filePath := fmt.Sprintf(frontendBaseDir+"/data/%s.mmdb", filename)
		fileUrl := fmt.Sprintf("%s/raw/master/%s.mmdb", repoURL, filename)

		EnsureFileFolderExists(filePath)

		fmt.Printf("Downloading %s database...\n", filename)
		buffer, err := DownloadFile(fileUrl)
		if err != nil {
			return err
		}

		// Write buffer to file
		file, err := os.Create(filePath)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(file, buffer)
		if err != nil {
			return err
		}

		return nil
	}

	if !cityExists {
		cityErr := downloadAndSave("GeoLite2-City")
		if cityErr != nil {
			fmt.Println("Failed to download GeoLite2-City database")
		}
	}

	if !asnExists {
		asnErr := downloadAndSave("GeoLite2-ASN")
		if asnErr != nil {
			fmt.Println("Failed to download GeoLite2-ASN database")
		}
	}
	// Update status in util package
	MaxmindDownloadInProgress = false

	if err := InitMaxmindDb(); err != nil {
		panic("Failed to initialize MaxMind database")
	}
}

// InitMaxmindFiles checks if MaxMind database files exist and downloads them if needed
func InitMaxmindFiles() {
	frontendBaseDir := conf.GetConfigString("frontendBaseDir")

	cityDbPath := frontendBaseDir + "/data/GeoLite2-City.mmdb"
	asnDbPath := frontendBaseDir + "/data/GeoLite2-ASN.mmdb"

	cityDbPathAlt := frontendBaseDir + "/../data/GeoLite2-City.mmdb"
	asnDbPathAlt := frontendBaseDir + "/../data/GeoLite2-ASN.mmdb"

	// Check if files exist in either location
	cityExists := FileExist(cityDbPath) || FileExist(cityDbPathAlt)
	asnExists := FileExist(asnDbPath) || FileExist(asnDbPathAlt)

	// If both files exist, we're done
	if cityExists && asnExists {
		return
	}

	MaxmindDownloadInProgress = true

	go downloadMaxmindFiles(cityExists, asnExists)
}
