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

package conf

import "time"

// K8sConfig represents Kubernetes configuration
type K8sConfig struct {
	Enabled           bool          `json:"enabled"`
	InCluster         bool          `json:"inCluster"`
	KubeConfigPath    string        `json:"kubeConfigPath"`
	NamespacePrefix   string        `json:"namespacePrefix"`
	DefaultNamespace  string        `json:"defaultNamespace"`
	ConnectionTimeout time.Duration `json:"connectionTimeout"`
	DeploymentTimeout time.Duration `json:"deploymentTimeout"`
}

// GetK8sConfig returns Kubernetes configuration with hardcoded values
func GetK8sConfig() *K8sConfig {
	return &K8sConfig{
		Enabled:           true,
		InCluster:         false,
		KubeConfigPath:    "",
		NamespacePrefix:   "casibase",
		DefaultNamespace:  "default",
		ConnectionTimeout: 30 * time.Second,
		DeploymentTimeout: 300 * time.Second,
	}
}
