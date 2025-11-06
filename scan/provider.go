// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package scan

import (
	"fmt"
	"os"
)

var cachedHostnamePrefix string

// getHostnamePrefix returns a hostname prefix for logging, or [unknown-host] on error
func getHostnamePrefix() string {
	if cachedHostnamePrefix == "" {
		hostname, err := os.Hostname()
		if err != nil {
			cachedHostnamePrefix = "[unknown-host]"
		} else {
			cachedHostnamePrefix = fmt.Sprintf("[%s]", hostname)
		}
	}
	return cachedHostnamePrefix
}

type ScanProvider interface {
	Scan(target string, command string) (string, error)
	ParseResult(rawResult string) (string, error)
	GetResultSummary(result string) string
}

func GetScanProvider(typ string, clientId string, lang string) (ScanProvider, error) {
	var p ScanProvider
	var err error

	if typ == "Nmap" {
		p, err = NewNmapScanProvider(clientId)
	} else if typ == "OS Patch" {
		p, err = NewOsPatchScanProvider(clientId)
	} else if typ == "Nuclei" {
		p, err = NewNucleiScanProvider(clientId)
	} else {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return p, nil
}
