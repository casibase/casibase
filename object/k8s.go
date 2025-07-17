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
	"os"
	"path/filepath"
	"strings"

	"github.com/casibase/casibase/conf"
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

type DeploymentStatus struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type K8sClient struct {
	clientset     *kubernetes.Clientset
	dynamicClient dynamic.Interface
	restMapper    meta.RESTMapper
	config        *rest.Config
	connected     bool
	k8sConfig     *conf.K8sConfig
}

var k8sClient *K8sClient

func init() {
	k8sConfig := conf.GetK8sConfig()
	k8sClient, _ = initK8sClient(k8sConfig)
}

func initK8sClient(k8sConfig *conf.K8sConfig) (*K8sClient, error) {
	var config *rest.Config
	var err error

	if k8sConfig.InCluster {
		config, err = rest.InClusterConfig()
		if err != nil {
			return nil, fmt.Errorf("failed to load in-cluster config: %v", err)
		}
	} else {
		kubeconfigPath := k8sConfig.KubeConfigPath
		if kubeconfigPath == "" {
			kubeconfigPath = os.Getenv("KUBECONFIG")
			if kubeconfigPath == "" {
				home, err := os.UserHomeDir()
				if err != nil {
					return nil, fmt.Errorf("failed to get home directory: %v", err)
				}
				kubeconfigPath = filepath.Join(home, ".kube", "config")
			}
		}

		if _, err := os.Stat(kubeconfigPath); os.IsNotExist(err) {
			return nil, fmt.Errorf("kubeconfig file not found at %s", kubeconfigPath)
		}

		config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
		if err != nil {
			return nil, fmt.Errorf("failed to load kubeconfig from %s: %v", kubeconfigPath, err)
		}
	}

	return createK8sClient(config, k8sConfig)
}

func createK8sClient(config *rest.Config, k8sConfig *conf.K8sConfig) (*K8sClient, error) {
	config.Timeout = k8sConfig.ConnectionTimeout

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes clientset: %v", err)
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
		clientset:     clientset,
		dynamicClient: dynamicClient,
		restMapper:    restMapper,
		config:        config,
		connected:     false,
		k8sConfig:     k8sConfig,
	}

	if err := client.testConnection(); err != nil {
		return nil, fmt.Errorf("failed to connect to kubernetes cluster: %v", err)
	}

	client.connected = true
	return client, nil
}

func (k *K8sClient) testConnection() error {
	ctx, cancel := context.WithTimeout(context.Background(), k.k8sConfig.ConnectionTimeout)
	defer cancel()

	_, err := k.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
	return err
}

func IsK8sConnected() bool {
	return k8sClient != nil && k8sClient.connected
}

func DeployApplicationTemplate(owner, name, manifests string) error {
	if k8sClient == nil {
		return fmt.Errorf("k8s client not initialized")
	}

	if !k8sClient.connected {
		return fmt.Errorf("k8s client not connected to cluster")
	}

	// Split manifests by "---" separator
	docs := strings.Split(manifests, "---")

	namespace := fmt.Sprintf("%s-%s-%s", k8sClient.k8sConfig.NamespacePrefix, owner, name)

	// Create namespace if it doesn't exist
	err := k8sClient.createNamespaceIfNotExists(namespace)
	if err != nil {
		return fmt.Errorf("failed to create namespace: %v", err)
	}

	for _, doc := range docs {
		doc = strings.TrimSpace(doc)
		if doc == "" {
			continue
		}

		err := k8sClient.deployResource(doc, namespace)
		if err != nil {
			return fmt.Errorf("failed to deploy resource: %v", err)
		}
	}

	return nil
}

func DeleteDeployment(owner, name string) error {
	if k8sClient == nil {
		return fmt.Errorf("k8s client not initialized")
	}

	if !k8sClient.connected {
		return fmt.Errorf("k8s client not connected to cluster")
	}

	namespace := fmt.Sprintf("%s-%s-%s", k8sClient.k8sConfig.NamespacePrefix, owner, name)

	// Delete the entire namespace
	err := k8sClient.clientset.CoreV1().Namespaces().Delete(
		context.TODO(),
		namespace,
		metav1.DeleteOptions{},
	)

	if err != nil && !errors.IsNotFound(err) {
		return fmt.Errorf("failed to delete namespace: %v", err)
	}

	return nil
}

func GetDeploymentStatus(owner, name string) (*DeploymentStatus, error) {
	if k8sClient == nil {
		return &DeploymentStatus{Status: "Unknown", Message: "k8s client not initialized"}, nil
	}

	if !k8sClient.connected {
		return &DeploymentStatus{Status: "Unknown", Message: "k8s client not connected to cluster"}, nil
	}

	namespace := fmt.Sprintf("%s-%s-%s", k8sClient.k8sConfig.NamespacePrefix, owner, name)

	// Check if namespace exists
	_, err := k8sClient.clientset.CoreV1().Namespaces().Get(
		context.TODO(),
		namespace,
		metav1.GetOptions{},
	)
	if err != nil {
		if errors.IsNotFound(err) {
			return &DeploymentStatus{Status: "Not Deployed", Message: "Namespace not found"}, nil
		}
		return &DeploymentStatus{Status: "Unknown", Message: err.Error()}, nil
	}

	// Check deployments in the namespace
	deployments, err := k8sClient.clientset.AppsV1().Deployments(namespace).List(
		context.TODO(),
		metav1.ListOptions{},
	)
	if err != nil {
		return &DeploymentStatus{Status: "Unknown", Message: err.Error()}, nil
	}

	if len(deployments.Items) == 0 {
		return &DeploymentStatus{Status: "Not Deployed", Message: "No deployments found in namespace"}, nil
	}

	// Check if all deployments are ready
	for _, deployment := range deployments.Items {
		if deployment.Status.ReadyReplicas < deployment.Status.Replicas {
			return &DeploymentStatus{
				Status: "Pending",
				Message: fmt.Sprintf("Deployment %s is not ready (%d/%d)",
					deployment.Name, deployment.Status.ReadyReplicas, deployment.Status.Replicas),
			}, nil
		}
	}

	return &DeploymentStatus{Status: "Running", Message: "All deployments are ready"}, nil
}

func TestK8sConnection() (*DeploymentStatus, error) {
	if k8sClient == nil {
		return &DeploymentStatus{Status: "Disconnected", Message: "k8s client not initialized"}, nil
	}

	err := k8sClient.testConnection()
	if err != nil {
		k8sClient.connected = false
		return &DeploymentStatus{Status: "Disconnected", Message: err.Error()}, nil
	}

	k8sClient.connected = true
	return &DeploymentStatus{Status: "Connected", Message: "Successfully connected to Kubernetes cluster"}, nil
}

func (k *K8sClient) createNamespaceIfNotExists(name string) error {
	_, err := k.clientset.CoreV1().Namespaces().Get(
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
