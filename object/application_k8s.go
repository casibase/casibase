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

	"github.com/casibase/casibase/util"
	"gopkg.in/yaml.v3"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/kustomize/api/krusty"
	"sigs.k8s.io/kustomize/api/types"
	"sigs.k8s.io/kustomize/kyaml/filesys"
)

const (
	StatusNotDeployed = "Not Deployed"
	StatusPending     = string(v1.PodPending) // "Pending"
	StatusRunning     = string(v1.PodRunning) // "Running"
	StatusUnknown     = string(v1.PodUnknown) // "Unknown"
	StatusFailed      = string(v1.PodFailed)
	StatusTerminating = "Terminating"
	NamespaceFormat   = "casibase-%s"
)

func UpdateApplicationStatus(owner string, name string, status string) error {
	application, err := getApplication(owner, name)
	if err != nil {
		return err
	}
	if application == nil {
		return err
	}

	application.Status = status
	application.UpdatedTime = util.GetCurrentTime()

	_, err = UpdateApplication(fmt.Sprintf("%s/%s", owner, name), application)
	if err != nil {
		return err
	}

	return nil
}

func generateManifestWithKustomize(baseManifest, parameters string) (string, error) {
	// If no parameters provided, return base manifest directly
	if parameters == "" {
		return baseManifest, nil
	}

	// Create in-memory filesystem
	fs := filesys.MakeFsInMemory()

	// Create root directory first
	if err := fs.Mkdir("."); err != nil {
		return "", fmt.Errorf("failed to create root directory: %v", err)
	}

	// Split and write base resource files
	resourceFiles := []string{}
	baseFiles := strings.Split(baseManifest, "---")

	for i, fileContent := range baseFiles {
		trimmedContent := strings.TrimSpace(fileContent)
		if trimmedContent == "" {
			continue
		}

		fileName := fmt.Sprintf("resource-%d.yaml", i)
		if err := fs.WriteFile(fileName, []byte(trimmedContent)); err != nil {
			return "", fmt.Errorf("failed to write resource file: %v", err)
		}
		resourceFiles = append(resourceFiles, fileName)
	}

	// Write patch file
	patchFileName := "patch.yaml"
	if err := fs.WriteFile(patchFileName, []byte(parameters)); err != nil {
		return "", fmt.Errorf("failed to write patch file: %v", err)
	}

	// Create kustomization.yaml
	kustomization := types.Kustomization{
		TypeMeta: types.TypeMeta{
			APIVersion: types.KustomizationVersion,
			Kind:       types.KustomizationKind,
		},
		Resources: resourceFiles,
		Patches: []types.Patch{
			{Path: patchFileName},
		},
	}

	kustomizationYaml, err := yaml.Marshal(kustomization)
	if err != nil {
		return "", fmt.Errorf("failed to marshal kustomization: %v", err)
	}

	err = fs.WriteFile("kustomization.yaml", kustomizationYaml)
	if err != nil {
		return "", fmt.Errorf("failed to write kustomization.yaml: %v", err)
	}

	// Run Kustomize with correct path
	k := krusty.MakeKustomizer(krusty.MakeDefaultOptions())
	resMap, err := k.Run(fs, ".")
	if err != nil {
		return "", fmt.Errorf("kustomize run failed: %v", err)
	}

	// Convert to final YAML
	finalManifestBytes, err := resMap.AsYaml()
	if err != nil {
		return "", fmt.Errorf("failed to convert result to yaml: %v", err)
	}

	return string(finalManifestBytes), nil
}

func DeployApplication(application *Application) (bool, error) {
	if err := ensureK8sClient(); err != nil {
		return false, fmt.Errorf("failed to initialize k8s client: %v", err)
	}

	if !k8sClient.connected {
		return false, fmt.Errorf("k8s client not connected to cluster")
	}

	// Get the template
	template, err := getTemplate(application.Owner, application.Template)
	if err != nil {
		return false, fmt.Errorf("failed to get template: %v", err)
	}
	if template == nil {
		return false, fmt.Errorf("template not found: %s", application.Template)
	}

	// Generate final manifest using simple template replacement
	finalManifest, err := generateManifestWithKustomize(template.Manifest, application.Parameters)
	if err != nil {
		return false, fmt.Errorf("failed to generate manifest: %v", err)
	}

	// Create namespace if it doesn't exist
	err = k8sClient.createNamespaceIfNotExists(application.Namespace)
	if err != nil {
		return false, fmt.Errorf("failed to create namespace: %v", err)
	}

	// Deploy the manifest
	err = deployManifest(finalManifest, application.Namespace)
	if err != nil {
		return false, fmt.Errorf("failed to deploy manifest: %v", err)
	}

	err = UpdateApplicationStatus(application.Owner, application.Name, StatusPending)
	if err != nil {
		return false, err
	}

	return true, nil
}

func UndeployApplication(owner, name string) (bool, error) {
	if err := ensureK8sClient(); err != nil {
		return false, fmt.Errorf("failed to initialize k8s client: %v", err)
	}

	if !k8sClient.connected {
		return false, fmt.Errorf("k8s client not connected to cluster")
	}

	namespace := fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(name, "_", "-"))

	// Delete the entire namespace
	err := k8sClient.clientSet.CoreV1().Namespaces().Delete(
		context.TODO(),
		namespace,
		metav1.DeleteOptions{},
	)

	if err != nil && !errors.IsNotFound(err) {
		return false, fmt.Errorf("failed to delete namespace: %v", err)
	}

	err = UpdateApplicationStatus(owner, name, StatusTerminating)
	if err != nil {
		return false, err
	}

	return true, nil
}

func DeployApplicationSync(application *Application) (bool, error) {
	// First deploy the application
	success, err := DeployApplication(application)
	if err != nil {
		return false, err
	}
	if !success {
		return false, fmt.Errorf("failed to deploy application")
	}

	// Wait for deployment to be ready (with timeout)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			err = UpdateApplicationStatus(application.Owner, application.Name, StatusFailed)
			if err != nil {
				return false, err
			}

			reason, err := GetApplicationFailureReason(application.Namespace)
			if err != nil {
				return false, fmt.Errorf("deployment failed, and could not retrieve failure details: %v", err)
			}
			return false, fmt.Errorf("deployment failed: %s", reason)
		case <-ticker.C:
			status, err := GetApplicationStatus(application.Owner, application.Name)
			if err != nil {
				continue
			}

			switch status {
			case StatusRunning:
				return true, nil
			case StatusNotDeployed:
				return false, fmt.Errorf("namespace %s is terminating and all resources have been cleaned up", application.Namespace)
			default:
				continue
			}
		}
	}
}

// UndeployApplicationSync undeploys application and waits for it to be completely removed
func UndeployApplicationSync(owner, name string) (bool, error) {
	// First undeploy the application
	success, err := UndeployApplication(owner, name)
	if err != nil {
		return false, err
	}
	if !success {
		return false, fmt.Errorf("failed to start undeployment")
	}

	// Wait for undeployment to complete (with timeout)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return false, fmt.Errorf("undeployment timeout: application did not undeploy within 10 minutes")
		case <-ticker.C:
			status, err := GetApplicationStatus(owner, name)
			if err != nil {
				continue
			}

			switch status {
			case StatusNotDeployed:
				return true, nil
			case StatusTerminating:
				continue
			default:
				continue
			}
		}
	}
}

// GetApplicationFailureReason returns the failure reason for an application deployment
func GetApplicationFailureReason(namespace string) (string, error) {
	if namespace == "" {
		return "", fmt.Errorf("namespace cannot be empty")
	}

	if err := ensureK8sClient(); err != nil {
		return "", err
	}
	if !k8sClient.connected {
		return "", fmt.Errorf("k8s client is not connected to the cluster")
	}

	pods, err := k8sClient.clientSet.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return "namespace or pods not found", nil
		}
		return "", fmt.Errorf("failed to list pods in namespace %s: %w", namespace, err)
	}

	if len(pods.Items) == 0 {
		return "no pods were found in the application namespace to inspect", nil
	}

	reasons := analyzePodFailures(pods.Items)
	if len(reasons) > 0 {
		return strings.Join(reasons, "; "), nil
	}

	return "deployment failed for an unknown reason. Check pod logs and events in the namespace for more details.", nil
}

// analyzePodFailures analyzes pod failures and returns a list of failure reasons
func analyzePodFailures(pods []v1.Pod) []string {
	var reasons []string

	for _, pod := range pods {
		// Check if pod itself has failed
		if pod.Status.Phase == v1.PodFailed {
			reason := fmt.Sprintf("pod [%s] has failed", pod.Name)
			if pod.Status.Reason != "" {
				reason += fmt.Sprintf(" with reason: '%s'", pod.Status.Reason)
			}
			if pod.Status.Message != "" {
				reason += fmt.Sprintf(" and message: '%s'", pod.Status.Message)
			}
			reasons = append(reasons, reason)
			continue
		}

		// Check init containers
		for _, status := range pod.Status.InitContainerStatuses {
			if containerReason := analyzeContainerStatus(pod.Name, status.Name, "init container", status.State); containerReason != "" {
				reasons = append(reasons, containerReason)
			}
		}

		// Check main containers
		for _, status := range pod.Status.ContainerStatuses {
			if containerReason := analyzeContainerStatus(pod.Name, status.Name, "container", status.State); containerReason != "" {
				reasons = append(reasons, containerReason)
			}
		}
	}

	return reasons
}

// analyzeContainerStatus analyzes a single container's status and returns failure reason if any
func analyzeContainerStatus(podName, containerName, containerType string, state v1.ContainerState) string {
	if state.Waiting != nil && state.Waiting.Reason != "" {
		return fmt.Sprintf("pod [%s] %s [%s] is waiting: %s (%s)",
			podName, containerType, containerName, state.Waiting.Reason, state.Waiting.Message)
	}

	if state.Terminated != nil && state.Terminated.Reason != "" && state.Terminated.Reason != "Completed" {
		return fmt.Sprintf("pod [%s] %s [%s] terminated with exit code %d: %s (%s)",
			podName, containerType, containerName, state.Terminated.ExitCode,
			state.Terminated.Reason, state.Terminated.Message)
	}

	return ""
}

// GetApplicationStatus returns application status as string
func GetApplicationStatus(owner, name string) (string, error) {
	if err := ensureK8sClient(); err != nil {
		return StatusUnknown, err
	}

	if !k8sClient.connected {
		return StatusUnknown, nil
	}

	namespace := fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(name, "_", "-"))

	ns, err := k8sClient.clientSet.CoreV1().Namespaces().Get(
		context.TODO(),
		namespace,
		metav1.GetOptions{},
	)
	if err != nil {
		if errors.IsNotFound(err) {
			err = UpdateApplicationStatus(owner, name, StatusNotDeployed)
			if err != nil {
				return "", err
			}

			return StatusNotDeployed, nil
		}
		return StatusUnknown, err
	}

	if ns.Status.Phase == v1.NamespaceTerminating {
		pods, _ := k8sClient.clientSet.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
		services, _ := k8sClient.clientSet.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
		deployments, _ := k8sClient.clientSet.AppsV1().Deployments(namespace).List(context.TODO(), metav1.ListOptions{})

		if len(pods.Items) == 0 && len(services.Items) == 0 && len(deployments.Items) == 0 {
			err = UpdateApplicationStatus(owner, name, StatusNotDeployed)
			if err != nil {
				return "", err
			}

			return StatusNotDeployed, nil
		}

		err = UpdateApplicationStatus(owner, name, StatusTerminating)
		if err != nil {
			return "", err
		}

		return StatusTerminating, nil
	}

	deployments, err := k8sClient.clientSet.AppsV1().Deployments(namespace).List(
		context.TODO(),
		metav1.ListOptions{},
	)
	if err != nil {
		return StatusUnknown, err
	}

	if len(deployments.Items) == 0 {
		err = UpdateApplicationStatus(owner, name, StatusNotDeployed)
		if err != nil {
			return "", err
		}

		return StatusNotDeployed, nil
	}

	// Check if all deployments are ready
	for _, deployment := range deployments.Items {
		if deployment.Status.ReadyReplicas < deployment.Status.Replicas {
			err = UpdateApplicationStatus(owner, name, StatusPending)
			if err != nil {
				return "", err
			}

			return StatusPending, nil
		}
	}

	err = UpdateApplicationStatus(owner, name, StatusRunning)
	if err != nil {
		return "", err
	}

	return StatusRunning, nil
}

// Helper function to deploy manifest (refactored from existing code)
func deployManifest(manifest, namespace string) error {
	// Split manifest by "---" separator
	docs := strings.Split(manifest, "---")

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
