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
	"sync"
)

func AddDetails(apps []*Application) {
	if len(apps) == 0 {
		return
	}

	hasRunning := false
	for _, app := range apps {
		if isRunning(app.Status) {
			hasRunning = true
			break
		}
	}

	if !hasRunning {
		return
	}

	if ensureK8sClient() != nil {
		return
	}

	var wg sync.WaitGroup

	for _, app := range apps {
		if isRunning(app.Status) {
			wg.Add(1)
			go func(app *Application) {
				defer wg.Done()
				if details, err := GetApplicationView(app.Namespace); err == nil {
					app.Details = details
				}
			}(app)
		}
	}

	wg.Wait()
}

func isRunning(status string) bool {
	return status == "Running" || status == "running" || status == "Active" || status == "Started"
}

// GetURL retrieves the access URL for an application
func GetURL(namespace string) (string, error) {
	nodeIPs := getNodeIPsFromCache()
	services := getServicesFromCache(namespace, nodeIPs)

	// Find first available access URL from services
	for _, service := range services {
		for _, port := range service.Ports {
			if port.URL != "" {
				return port.URL, nil
			}
		}
	}

	return "", fmt.Errorf("no accessible URL found for application")
}
