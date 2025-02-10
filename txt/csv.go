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

package txt

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"os"
	"strconv"
	"strings"
)

func getTextFromCsv(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	r := csv.NewReader(file)
	r.LazyQuotes = true
	headers, err := r.Read()
	if err != nil {
		return "", err
	}

	result := []string{}
	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}

		m := make(map[string]interface{})
		for i, header := range headers {
			header = strings.TrimSpace(header)
			value := strings.TrimSpace(record[i])

			if intValue, convErr := strconv.Atoi(value); convErr == nil {
				m[header] = intValue
			} else {
				m[header] = value
			}
		}

		jsonData, err := json.Marshal(m)
		if err != nil {
			return "", err
		}
		result = append(result, string(jsonData))
	}

	return strings.Join(result, "\n"), nil
}
