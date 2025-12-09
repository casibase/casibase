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

package object

import (
	"fmt"
)

func ScanAssetsFromProvider(owner string, providerName string) (bool, error) {
	provider, err := getProvider(owner, providerName)
	if err != nil {
		return false, err
	}

	if provider == nil {
		return false, fmt.Errorf("provider not found: %s", providerName)
	}

	// Delete existing assets for this provider
	_, err = adapter.engine.Where("owner = ? AND provider = ?", owner, providerName).Delete(&Asset{})
	if err != nil {
		return false, err
	}

	// Create cloud parser based on provider type
	parser, err := NewCloudParser(provider.Type)
	if err != nil {
		return false, err
	}

	// Scan assets using the cloud parser
	assets, err := parser.ScanAssets(owner, provider)
	if err != nil {
		return false, err
	}

	if len(assets) > 0 {
		_, err = addAssets(assets)
		if err != nil {
			return false, err
		}
	}

	return true, nil
}
