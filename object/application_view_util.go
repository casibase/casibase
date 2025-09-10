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
	networkingv1 "k8s.io/api/networking/v1"
	"sync"
)

func AddDetails(apps []*Application) {
	if len(apps) == 0 {
		return
	}

	if ensureK8sClient() != nil {
		return
	}

	var wg sync.WaitGroup

	for _, app := range apps {
		wg.Add(1)
		go func(app *Application) {
			defer wg.Done()
			if details, err := GetApplicationView(app.Namespace); err == nil {
				app.Status = details.Status
				app.Details = details

				if app.URL == "" {
					if url, err := GetURL(app.Namespace); err == nil && url != "" {
						app.URL = url
					}
				}
			}
		}(app)
	}

	wg.Wait()
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

// findIngressURL finds the external access URL for a service in Ingress rules.
func findIngressURL(serviceName string, servicePort int32, ingresses []*networkingv1.Ingress) string {
	for _, ingress := range ingresses {
		// Iterate through Ingress rules
		for _, rule := range ingress.Spec.Rules {
			if rule.HTTP == nil {
				continue
			}

			// Build the hostname
			host := rule.Host
			if host == "" && len(ingress.Status.LoadBalancer.Ingress) > 0 {
				// If the host is not specified in the rule, try to get it from the LoadBalancer status
				lbIngress := ingress.Status.LoadBalancer.Ingress[0]
				if lbIngress.Hostname != "" {
					host = lbIngress.Hostname
				} else if lbIngress.IP != "" {
					host = lbIngress.IP
				}
			}

			// Iterate through each path
			for _, path := range rule.HTTP.Paths {
				backend := path.Backend

				if backend.Service != nil &&
					backend.Service.Name == serviceName &&
					backend.Service.Port.Number == servicePort {

					scheme := "http"
					if hasTLSForHost(ingress, host) {
						scheme = "https"
					}

					pathStr := path.Path
					if pathStr == "" {
						pathStr = "/"
					}

					return scheme + "://" + host + pathStr
				}
			}
		}
	}

	return ""
}

// hasTLSForHost examine if the ingress has TLS configured for the given host
func hasTLSForHost(ingress *networkingv1.Ingress, host string) bool {
	for _, tls := range ingress.Spec.TLS {
		for _, tlsHost := range tls.Hosts {
			if tlsHost == host {
				return true
			}
		}
	}
	return false
}
