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

import "fmt"

// CloudParser defines the interface for cloud resource scanning
type CloudParser interface {
	// ScanAssets scans all resources from the cloud provider and returns them as Asset objects
	ScanAssets(owner string, provider *Provider) ([]*Asset, error)
}

// NewCloudParser creates a new CloudParser instance based on the provider type
func NewCloudParser(providerType string) (CloudParser, error) {
	switch providerType {
	case "Aliyun":
		return &AlibabaCloudParser{}, nil
	case "Azure":
		return &AzureCloudParser{}, nil
	default:
		return nil, fmt.Errorf("unsupported provider type: %s", providerType)
	}
}
