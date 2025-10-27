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

type ScanProvider interface {
	Scan(target string) (string, error)
}

func GetScanProvider(typ string, clientId string, lang string) (ScanProvider, error) {
	var p ScanProvider
	var err error

	if typ == "Nmap" {
		p, err = NewNmapScanProvider(clientId)
	} else {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return p, nil
}
