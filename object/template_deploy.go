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
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
)

type K8sClient struct {
	clientSet     *kubernetes.Clientset
	dynamicClient dynamic.Interface
	restMapper    meta.RESTMapper
	config        *rest.Config
	connected     bool
	configText    string
}

var k8sClient *K8sClient

func init() {
	k8sClient = nil
}

// Create K8s client from provider's ConfigText
func createK8sClientFromProvider(provider *Provider) (*K8sClient, error) {
	if provider.ConfigText == "" {
		return nil, fmt.Errorf("provider kubeconfig content is empty")
	}

	// Parse kubeconfig from provider.ConfigText
	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(provider.ConfigText))
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig from provider: %v", err)
	}

	return createK8sClient(config, provider.ConfigText)
}

func createK8sClient(config *rest.Config, configText string) (*K8sClient, error) {
	config.Timeout = 30 * time.Second // Default timeout

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientSet: %v", err)
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %v", err)
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create discovery client: %v", err)
	}

	groupResources, err := restmapper.GetAPIGroupResources(discoveryClient)
	if err != nil {
		return nil, fmt.Errorf("failed to get API group resources: %v", err)
	}

	restMapper := restmapper.NewDiscoveryRESTMapper(groupResources)

	client := &K8sClient{
		clientSet:     clientset,
		dynamicClient: dynamicClient,
		restMapper:    restMapper,
		config:        config,
		connected:     false,
		configText:    configText,
	}

	if err := client.testConnection(); err != nil {
		return nil, fmt.Errorf("failed to connect to kubernetes cluster: %v", err)
	}

	client.connected = true
	return client, nil
}

func (k *K8sClient) testConnection() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err := k.clientSet.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
	return err
}

// Ensure k8s client is initialized, try to initialize if not
func ensureK8sClient() error {
	// Get current Kubernetes provider
	provider, err := GetDefaultKubernetesProvider()
	if err != nil {
		return fmt.Errorf("failed to get default Kubernetes provider: %v", err)
	}

	// Check if client needs to be created or updated
	if k8sClient == nil || k8sClient.configText != provider.ConfigText {
		client, err := createK8sClientFromProvider(provider)
		if err != nil {
			return err
		}
		k8sClient = client
	}

	return nil
}

func GetK8sStatus() (string, error) {
	if err := ensureK8sClient(); err != nil {
		return "Disconnected", err
	}

	err := k8sClient.testConnection()
	if err != nil {
		k8sClient.connected = false
		return "Disconnected", err
	}

	k8sClient.connected = true
	return "Connected", nil
}

func (k *K8sClient) createNamespaceIfNotExists(name string) error {
	_, err := k.clientSet.CoreV1().Namespaces().Get(
		context.TODO(),
		name,
		metav1.GetOptions{},
	)
	if err != nil {
		if errors.IsNotFound(err) {
			// Create namespace
			namespace := &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "v1",
					"kind":       "Namespace",
					"metadata": map[string]interface{}{
						"name": name,
						"labels": map[string]interface{}{
							"managed-by": "casibase",
						},
					},
				},
			}

			gvr := schema.GroupVersionResource{
				Group:    "",
				Version:  "v1",
				Resource: "namespaces",
			}

			_, err = k.dynamicClient.Resource(gvr).Create(
				context.TODO(),
				namespace,
				metav1.CreateOptions{},
			)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	return nil
}

func (k *K8sClient) deployResource(yamlContent, namespace string) error {
	// Parse YAML to unstructured object
	decoder := yaml.NewYAMLToJSONDecoder(strings.NewReader(yamlContent))

	var obj unstructured.Unstructured
	err := decoder.Decode(&obj)
	if err != nil {
		return fmt.Errorf("failed to decode YAML: %v", err)
	}

	// Skip empty objects
	if obj.GetKind() == "" {
		return nil
	}

	// Set namespace if not specified and resource is namespaced
	if obj.GetNamespace() == "" && obj.GetKind() != "Namespace" {
		obj.SetNamespace(namespace)
	}

	// Add labels for management
	labels := obj.GetLabels()
	if labels == nil {
		labels = make(map[string]string)
	}
	labels["managed-by"] = "casibase"
	obj.SetLabels(labels)

	// Get GVR for the resource
	gvk := obj.GetObjectKind().GroupVersionKind()
	mapping, err := k.restMapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return fmt.Errorf("failed to get REST mapping for %s: %v", gvk, err)
	}

	var dr dynamic.ResourceInterface
	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		dr = k.dynamicClient.Resource(mapping.Resource).Namespace(obj.GetNamespace())
	} else {
		dr = k.dynamicClient.Resource(mapping.Resource)
	}

	// Try to get existing resource
	existing, err := dr.Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// Create new resource
			_, err = dr.Create(context.TODO(), &obj, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create resource %s/%s: %v", obj.GetKind(), obj.GetName(), err)
			}
		} else {
			return fmt.Errorf("failed to get existing resource %s/%s: %v", obj.GetKind(), obj.GetName(), err)
		}
	} else {
		// Update existing resource
		obj.SetResourceVersion(existing.GetResourceVersion())
		_, err = dr.Update(context.TODO(), &obj, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("failed to update resource %s/%s: %v", obj.GetKind(), obj.GetName(), err)
		}
	}

	return nil
}
