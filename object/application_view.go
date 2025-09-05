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
	"net/url"
	"strings"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
)

type ApplicationView struct {
	Services    []ServiceDetail    `json:"services"`
	Credentials []EnvVariable      `json:"credentials"`
	Deployments []DeploymentDetail `json:"deployments"`
	Status      string             `json:"status"`
	CreatedTime string             `json:"createdTime"`
	Namespace   string             `json:"namespace"`
}

type ServiceDetail struct {
	Name         string        `json:"name"`
	Type         string        `json:"type"`
	ClusterIP    string        `json:"clusterIP"`
	ExternalIP   string        `json:"externalIP"`
	Ports        []ServicePort `json:"ports"`
	InternalHost string        `json:"internalHost"`
	ExternalHost string        `json:"externalHost"`
	CreatedTime  string        `json:"createdTime"`
}

type ServicePort struct {
	Name     string `json:"name"`
	Port     int32  `json:"port"`
	NodePort int32  `json:"nodePort,omitempty"`
	Protocol string `json:"protocol"`
	URL      string `json:"url,omitempty"`
}

type DeploymentDetail struct {
	Name          string            `json:"name"`
	Replicas      int32             `json:"replicas"`
	ReadyReplicas int32             `json:"readyReplicas"`
	Containers    []ContainerDetail `json:"containers"`
	CreatedTime   string            `json:"createdTime"`
	Status        string            `json:"status"`
}

type ContainerDetail struct {
	Name      string           `json:"name"`
	Image     string           `json:"image"`
	Resources ResourceRequests `json:"resources"`
}

type ResourceRequests struct {
	CPU    string `json:"cpu"`
	Memory string `json:"memory"`
}

type EnvVariable struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// getExternalHost attempts to get k8s server IP first, then falls back to provided host
func getExternalHost(fallbackHost string) string {
	if cachedK8sHost != "" {
		return cachedK8sHost
	}

	return fallbackHost
}

// parseK8sHost extracts server host from kubeconfig content
func parseK8sHost(configText string) (string, error) {
	if strings.TrimSpace(configText) == "" {
		return "", fmt.Errorf("kubeconfig content is empty")
	}

	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(configText))
	if err != nil {
		return "", fmt.Errorf("failed to parse kubeconfig: %v", err)
	}

	if config.Host == "" {
		return "", fmt.Errorf("server address not found")
	}

	serverURL, err := url.Parse(config.Host)
	if err != nil {
		return "", fmt.Errorf("failed to parse server URL: %v", err)
	}

	host := serverURL.Hostname()
	if host == "" {
		return "", fmt.Errorf("unable to extract host")
	}

	return host, nil
}

// GetApplicationView retrieves application view from cache with fallback
func GetApplicationView(namespace string) (*ApplicationView, error) {
	if err := ensureK8sClient(); err != nil {
		return nil, fmt.Errorf("failed to initialize k8s client: %v", err)
	}

	if !k8sClient.connected {
		return nil, fmt.Errorf("k8s client not connected")
	}

	// Try to get namespace from cache first
	var ns *v1.Namespace
	var nsFound bool

	if cacheManager != nil && cacheManager.started {
		ns = cacheManager.getNamespace(namespace)
		nsFound = (ns != nil)
	}

	// Fallback to API call with timeout if not in cache
	if !nsFound {
		ctx, cancel := context.WithTimeout(context.TODO(), 5*time.Second)
		defer cancel()

		apiNs, err := k8sClient.clientSet.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
		if err != nil {
			if errors.IsNotFound(err) {
				return &ApplicationView{
					Services:    []ServiceDetail{},
					Credentials: []EnvVariable{},
					Deployments: []DeploymentDetail{},
					Status:      StatusNotDeployed,
					Namespace:   namespace,
				}, nil
			}
			return nil, fmt.Errorf("failed to get namespace: %v", err)
		}
		ns = apiNs
	}

	details := &ApplicationView{
		Services:    []ServiceDetail{},
		Credentials: []EnvVariable{},
		Deployments: []DeploymentDetail{},
		Status:      StatusRunning,
		CreatedTime: ns.CreationTimestamp.Format("2006-01-02 15:04:05"),
		Namespace:   namespace,
	}

	// Get data from cache with fallback to API
	nodeIPs := getNodeIPsFromCache()

	details.Services = getServicesFromCache(namespace, nodeIPs)
	details.Deployments = getDeploymentsFromCache(namespace)
	details.Credentials = getCredentialsFromCache(namespace)

	return details, nil
}

// getNodeIPsFromCache retrieves node IPs from cache or fallback to API
func getNodeIPsFromCache() []string {
	var nodes []*v1.Node

	// Try cache first
	if cacheManager != nil && cacheManager.started {
		nodes = cacheManager.getNodes()
	}

	var nodeIPs []string
	for _, node := range nodes {
		// Try external IP first
		for _, addr := range node.Status.Addresses {
			if addr.Type == v1.NodeExternalIP && addr.Address != "" {
				nodeIPs = append(nodeIPs, addr.Address)
				break
			}
		}
		// Fallback to internal IP if no external IP found
		if len(nodeIPs) == 0 {
			for _, addr := range node.Status.Addresses {
				if addr.Type == v1.NodeInternalIP && addr.Address != "" {
					nodeIPs = append(nodeIPs, addr.Address)
					break
				}
			}
		}
	}

	return nodeIPs
}

// getServicesFromCache retrieves services from cache or fallback to API
func getServicesFromCache(namespace string, nodeIPs []string) []ServiceDetail {
	var services []*v1.Service

	// Try cache first
	if cacheManager != nil && cacheManager.started {
		services = cacheManager.getServices(namespace)
	}

	var serviceDetails []ServiceDetail
	for _, svc := range services {
		detail := ServiceDetail{
			Name:         svc.Name,
			Type:         string(svc.Spec.Type),
			ClusterIP:    svc.Spec.ClusterIP,
			Ports:        []ServicePort{},
			CreatedTime:  svc.CreationTimestamp.Format("2006-01-02 15:04:05"),
			InternalHost: fmt.Sprintf("%s.%s.svc.cluster.local", svc.Name, namespace),
		}

		// Determine external access based on service type
		var host string
		switch svc.Spec.Type {
		case v1.ServiceTypeLoadBalancer:
			if len(svc.Status.LoadBalancer.Ingress) > 0 {
				ingress := svc.Status.LoadBalancer.Ingress[0]
				if ingress.IP != "" {
					detail.ExternalIP = ingress.IP
					host = ingress.IP
				} else if ingress.Hostname != "" {
					host = ingress.Hostname
				}
			}
		case v1.ServiceTypeNodePort:
			if len(nodeIPs) > 0 {
				host = nodeIPs[0]
			}
		}

		detail.ExternalHost = getExternalHost(host)

		for _, port := range svc.Spec.Ports {
			servicePort := ServicePort{
				Name:     port.Name,
				Port:     port.Port,
				Protocol: string(port.Protocol),
			}

			if port.NodePort != 0 {
				servicePort.NodePort = port.NodePort
				if detail.ExternalHost != "" {
					servicePort.URL = fmt.Sprintf("%s:%d", detail.ExternalHost, port.NodePort)
				}
			}

			detail.Ports = append(detail.Ports, servicePort)
		}

		serviceDetails = append(serviceDetails, detail)
	}

	return serviceDetails
}

// getDeploymentsFromCache retrieves deployments from cache or fallback to API
func getDeploymentsFromCache(namespace string) []DeploymentDetail {
	var deployments []*appsv1.Deployment

	// Try cache first
	if cacheManager != nil && cacheManager.started {
		deployments = cacheManager.getDeployments(namespace)
	}

	var deploymentDetails []DeploymentDetail
	for _, deployment := range deployments {
		detail := DeploymentDetail{
			Name:          deployment.Name,
			Replicas:      *deployment.Spec.Replicas,
			ReadyReplicas: deployment.Status.ReadyReplicas,
			Containers:    []ContainerDetail{},
			CreatedTime:   deployment.CreationTimestamp.Format("2006-01-02 15:04:05"),
		}

		// Determine deployment status
		if detail.ReadyReplicas == detail.Replicas {
			detail.Status = "Running"
		} else if detail.ReadyReplicas > 0 {
			detail.Status = "Partially Ready"
		} else {
			detail.Status = "Not Ready"
		}

		for _, container := range deployment.Spec.Template.Spec.Containers {
			containerDetail := ContainerDetail{
				Name:  container.Name,
				Image: container.Image,
			}

			if container.Resources.Requests != nil {
				if cpuRequest := container.Resources.Requests[v1.ResourceCPU]; !cpuRequest.IsZero() {
					containerDetail.Resources.CPU = cpuRequest.String()
				}
				if memoryRequest := container.Resources.Requests[v1.ResourceMemory]; !memoryRequest.IsZero() {
					containerDetail.Resources.Memory = memoryRequest.String()
				}
			}

			detail.Containers = append(detail.Containers, containerDetail)
		}

		deploymentDetails = append(deploymentDetails, detail)
	}

	return deploymentDetails
}

// getCredentialsFromCache extracts environment variables containing sensitive information
func getCredentialsFromCache(namespace string) []EnvVariable {
	var deployments []*appsv1.Deployment

	// Try cache first
	if cacheManager != nil && cacheManager.started {
		deployments = cacheManager.getDeployments(namespace)
	}

	credentialKeywords := []string{
		"PASSWORD", "PASS", "SECRET", "KEY", "TOKEN", "AUTH",
		"USER", "USERNAME", "LOGIN", "CREDENTIAL", "DATABASE_URL",
		"DB_PASSWORD", "DB_USER", "ADMIN_PASSWORD", "ROOT_PASSWORD",
	}

	var credentials []EnvVariable
	for _, deployment := range deployments {
		for _, container := range deployment.Spec.Template.Spec.Containers {
			for _, env := range container.Env {
				envNameUpper := strings.ToUpper(env.Name)
				isCredential := false

				for _, keyword := range credentialKeywords {
					if strings.Contains(envNameUpper, keyword) {
						isCredential = true
						break
					}
				}

				if isCredential {
					value := env.Value
					if env.ValueFrom != nil {
						if env.ValueFrom.SecretKeyRef != nil {
							value = fmt.Sprintf("Secret: %s.%s", env.ValueFrom.SecretKeyRef.Name, env.ValueFrom.SecretKeyRef.Key)
						} else if env.ValueFrom.ConfigMapKeyRef != nil {
							value = fmt.Sprintf("ConfigMap: %s.%s", env.ValueFrom.ConfigMapKeyRef.Name, env.ValueFrom.ConfigMapKeyRef.Key)
						}
					}

					credentials = append(credentials, EnvVariable{
						Name:  env.Name,
						Value: value,
					})
				}
			}
		}
	}

	return credentials
}
