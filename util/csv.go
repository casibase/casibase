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
