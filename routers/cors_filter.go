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

package routers

import (
	"fmt"
	"net/url"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/conf"
)

// GetAllowedOrigins retrieves the allowed origins from Casdoor application's RedirectUris
func GetAllowedOrigins() ([]string, error) {
	casdoorEndpoint := conf.GetConfigString("casdoorEndpoint")
	casdoorApplication := conf.GetConfigString("casdoorApplication")
	
	// If Casdoor is not configured, allow all origins (backwards compatibility)
	if casdoorEndpoint == "" || casdoorApplication == "" {
		return []string{"*"}, nil
	}

	application, err := casdoorsdk.GetApplication(casdoorApplication)
	if err != nil {
		return nil, fmt.Errorf("failed to get Casdoor application (ensure Casdoor SDK is initialized): %w", err)
	}
	if application == nil {
		return nil, fmt.Errorf("Casdoor application not found: %s", casdoorApplication)
	}

	// Extract origins from RedirectUris
	origins := make([]string, 0, len(application.RedirectUris))
	for _, redirectUri := range application.RedirectUris {
		parsedUrl, err := url.Parse(redirectUri)
		if err != nil {
			// Skip invalid URLs
			continue
		}
		origin := fmt.Sprintf("%s://%s", parsedUrl.Scheme, parsedUrl.Host)
		// Avoid duplicates
		if !containsString(origins, origin) {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		// If no valid origins found, return an error to ensure security
		return nil, fmt.Errorf("no valid origins found in Casdoor application RedirectUris")
	}

	return origins, nil
}

// containsString checks if a string slice contains a specific string
func containsString(slice []string, str string) bool {
	for _, item := range slice {
		if item == str {
			return true
		}
	}
	return false
}
