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

	"sigs.k8s.io/kustomize/api/krusty"
	"sigs.k8s.io/kustomize/api/types"
	"sigs.k8s.io/kustomize/kyaml/filesys"

	"github.com/casibase/casibase/util"
	"gopkg.in/yaml.v3"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"xorm.io/core"
)

type Application struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"varchar(255)" json:"description"`
	Template    string `xorm:"varchar(100)" json:"template"` // Reference to Template.Name
	Parameters  string `xorm:"mediumtext" json:"parameters"`
	Status      string `xorm:"varchar(50)" json:"status"`     // Running, Pending, Failed, Not Deployed
	Namespace   string `xorm:"varchar(100)" json:"namespace"` // Kubernetes namespace (auto-generated)
}

const (
	StatusNotDeployed = "Not Deployed"
	StatusPending     = string(v1.PodPending) // "Pending"
	StatusRunning     = string(v1.PodRunning) // "Running"
	StatusUnknown     = string(v1.PodUnknown) // "Unknown"
	StatusFailed      = string(v1.PodFailed)
	StatusTerminating = "Terminating"
	NamespaceFormat   = "casibase-%s"
)

func GetApplications(owner string) ([]*Application, error) {
	applications := []*Application{}
	err := adapter.engine.Desc("created_time").Find(&applications, &Application{Owner: owner})
	if err != nil {
		return applications, err
	}
	return applications, nil
}

func GetApplicationCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Application{})
}

func GetPaginationApplications(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Application, error) {
	applications := []*Application{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&applications)
	if err != nil {
		return applications, err
	}

	return applications, nil
}

func getApplication(owner, name string) (*Application, error) {
	application := Application{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&application)
	if err != nil {
		return &application, err
	}

	if existed {
		return &application, nil
	} else {
		return nil, nil
	}
}

func GetApplication(id string) (*Application, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getApplication(owner, name)
}

func UpdateApplication(id string, application *Application) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)

	if application.Owner == "" {
		application.Owner = owner
	}
	if application.Name == "" {
		application.Name = name
	}
	application.UpdatedTime = util.GetCurrentTime()

	affected, err := adapter.engine.ID(core.PK{owner, name}).Update(application)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func UpdateApplicationStatus(owner, name, status string) {
	application, err := getApplication(owner, name)
	if err != nil || application == nil {
		return
	}

	application.Status = status
	application.UpdatedTime = util.GetCurrentTime()

	_, err = UpdateApplication(fmt.Sprintf("%s/%s", owner, name), application)
	if err != nil {
		return
	}
}

func AddApplication(application *Application) (bool, error) {
	if application.CreatedTime == "" {
		application.CreatedTime = util.GetCurrentTime()
	}
	if application.UpdatedTime == "" {
		application.UpdatedTime = util.GetCurrentTime()
	}

	// Generate namespace name based on application owner and name
	application.Namespace = fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(application.Name, "_", "-"))

	// Set initial status
	if application.Status == "" {
		application.Status = StatusNotDeployed
	}

	affected, err := adapter.engine.Insert(application)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteApplication(application *Application) (bool, error) {
	owner, name := application.Owner, application.Name
	// First, delete the deployment if it exists
	go func() {
		_, err := UndeployApplication(owner, name)
		if err != nil {
			return
		}
	}()

	// Then delete the application record
	affected, err := adapter.engine.ID(core.PK{owner, name}).Delete(&Application{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
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

	if err := fs.WriteFile("kustomization.yaml", kustomizationYaml); err != nil {
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
	template, err := GetTemplate(application.Owner, application.Template)
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

	UpdateApplicationStatus(application.Owner, application.Name, StatusPending)
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

	UpdateApplicationStatus(owner, name, StatusTerminating)
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			UpdateApplicationStatus(application.Owner, application.Name, "Failed")
			return false, fmt.Errorf("deployment timeout: application did not become ready within 10 minutes")
		case <-ticker.C:
			status, err := GetApplicationStatus(application.Owner, application.Name)
			if err != nil {
				continue
			}

			switch status {
			case StatusRunning:
				return true, nil
			case StatusNotDeployed:
				return false, fmt.Errorf("deployment failed: application not deployed")
			case StatusFailed:
				return false, fmt.Errorf("deployment failed")
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
			UpdateApplicationStatus(owner, name, StatusNotDeployed)
			return StatusNotDeployed, nil
		}
		return StatusUnknown, err
	}

	if ns.Status.Phase == v1.NamespaceTerminating {
		pods, _ := k8sClient.clientSet.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
		services, _ := k8sClient.clientSet.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
		deployments, _ := k8sClient.clientSet.AppsV1().Deployments(namespace).List(context.TODO(), metav1.ListOptions{})

		if len(pods.Items) == 0 && len(services.Items) == 0 && len(deployments.Items) == 0 {
			UpdateApplicationStatus(owner, name, StatusNotDeployed)
			return StatusNotDeployed, nil
		}

		UpdateApplicationStatus(owner, name, StatusTerminating)
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
		UpdateApplicationStatus(owner, name, StatusNotDeployed)
		return StatusNotDeployed, nil
	}

	// Check if all deployments are ready
	for _, deployment := range deployments.Items {
		if deployment.Status.ReadyReplicas < deployment.Status.Replicas {
			UpdateApplicationStatus(owner, name, StatusPending)
			return StatusPending, nil
		}
	}

	UpdateApplicationStatus(owner, name, StatusRunning)
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
