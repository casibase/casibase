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
	"context"
	"fmt"
	"sync"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	metricsclientset "k8s.io/metrics/pkg/client/clientset/versioned"

	"github.com/casibase/casibase/i18n"
	networkingv1 "k8s.io/api/networking/v1"
)

func AddDetails(apps []*Application, lang string) {
	if len(apps) == 0 {
		return
	}

	if ensureK8sClient(lang) != nil {
		return
	}

	var wg sync.WaitGroup

	for _, app := range apps {
		wg.Add(1)
		go func(app *Application) {
			defer wg.Done()
			if details, err := GetApplicationView(app.Namespace, lang); err == nil {
				app.Status = details.Status
				app.Details = details

				if app.URL == "" {
					if url, err := GetURL(app.Namespace, lang); err == nil && url != "" {
						app.URL = url
					}
				}
			}
		}(app)
	}

	wg.Wait()
}

// GetURL retrieves the access URL for an application
func GetURL(namespace string, lang string) (string, error) {
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

	return "", fmt.Errorf(i18n.Translate(lang, "object:no accessible URL found for application"))
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

// formatCPUUsage formats CPU usage quantity to human-readable format
func formatCPUUsage(quantity resource.Quantity) string {
	milliValue := quantity.MilliValue()

	if milliValue >= 1000 {
		cores := float64(milliValue) / 1000
		if cores == float64(int(cores)) {
			return fmt.Sprintf("%d", int(cores))
		}
		return fmt.Sprintf("%.2f", cores)
	}

	// Display as milli-cores for < 1 core
	return fmt.Sprintf("%dm", milliValue)
}

// formatMemoryUsage formats memory usage quantity to human-readable format
func formatMemoryUsage(quantity resource.Quantity) string {
	bytes := quantity.Value()

	switch {
	case bytes >= 1<<30: // >= 1 GiB
		gb := float64(bytes) / (1 << 30)
		if gb >= 10 {
			return fmt.Sprintf("%.0fGi", gb)
		}
		return fmt.Sprintf("%.1fGi", gb)
	case bytes >= 1<<20: // >= 1 MiB
		mb := float64(bytes) / (1 << 20)
		if mb >= 10 {
			return fmt.Sprintf("%.0fMi", mb)
		}
		return fmt.Sprintf("%.1fMi", mb)
	case bytes >= 1<<10: // >= 1 KiB
		return fmt.Sprintf("%.0fKi", float64(bytes)/(1<<10))
	default:
		return fmt.Sprintf("%d", bytes)
	}
}

func calculateNamespaceMetrics(ctx context.Context, metricsClient *metricsclientset.Clientset, namespace string, deployCache map[string]map[string]*appsv1.Deployment, mu *sync.RWMutex, lang string) (*CachedMetrics, error) {
	if metricsClient == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:metrics client not available"))
	}

	podMetricsList, err := metricsClient.MetricsV1beta1().PodMetricses(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	totalCPU := resource.NewQuantity(0, resource.DecimalSI)
	totalMemory := resource.NewQuantity(0, resource.BinarySI)

	// Aggregate resource usage from all pods
	for _, podMetrics := range podMetricsList.Items {
		for _, container := range podMetrics.Containers {
			if cpuUsage, ok := container.Usage[v1.ResourceCPU]; ok {
				totalCPU.Add(cpuUsage)
			}
			if memUsage, ok := container.Usage[v1.ResourceMemory]; ok {
				totalMemory.Add(memUsage)
			}
		}
	}

	var cpuPercentage, memPercentage float64

	// Calculate percentages if deployment cache and mutex are provided
	if deployCache != nil && mu != nil {
		mu.RLock()
		if deploys, exists := deployCache[namespace]; exists {
			totalCPULimits := resource.NewQuantity(0, resource.DecimalSI)
			totalMemoryLimits := resource.NewQuantity(0, resource.BinarySI)

			for _, deploy := range deploys {
				replicas := int32(1)
				if deploy.Spec.Replicas != nil {
					replicas = *deploy.Spec.Replicas
				}

				for _, container := range deploy.Spec.Template.Spec.Containers {
					if container.Resources.Limits != nil {
						if cpuLimit, ok := container.Resources.Limits[v1.ResourceCPU]; ok {
							for i := int32(0); i < replicas; i++ {
								totalCPULimits.Add(cpuLimit)
							}
						}
						if memLimit, ok := container.Resources.Limits[v1.ResourceMemory]; ok {
							for i := int32(0); i < replicas; i++ {
								totalMemoryLimits.Add(memLimit)
							}
						}
					}
				}
			}

			if totalCPULimits.MilliValue() > 0 {
				cpuPercentage = float64(totalCPU.MilliValue()) / float64(totalCPULimits.MilliValue()) * 100
			}
			if totalMemoryLimits.Value() > 0 {
				memPercentage = float64(totalMemory.Value()) / float64(totalMemoryLimits.Value()) * 100
			}
		}
		mu.RUnlock()
	}

	return &CachedMetrics{
		TotalCPU:         *totalCPU,
		TotalMemory:      *totalMemory,
		PodCount:         len(podMetricsList.Items),
		CPUPercentage:    cpuPercentage,
		MemoryPercentage: memPercentage,
		LastUpdated:      time.Now(),
	}, nil
}
