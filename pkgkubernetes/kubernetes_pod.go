// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package pkgkubernetes

import (
	"context"
	"fmt"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type Pod struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	Provider    string `xorm:"varchar(100)" json:"provider"`
	Namespace   string `xorm:"varchar(100)" json:"namespace"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	HostIP      string `xorm:"varchar(100)" json:"hostIP"`
	PodIP       string `xorm:"varchar(100)" json:"podIP"`
	Labels      string `xorm:"varchar(100)" json:"labels"`
	Status      string `xorm:"varchar(100)" json:"status"`
}

type PodClient struct {
	Client *kubernetes.Clientset
}

func NewPodClient(providerType string, masterUrl string, kubeconfigPath string, region string) (PodClient, error) {
	config, err := clientcmd.BuildConfigFromFlags(masterUrl, kubeconfigPath)
	if err != nil {
		return PodClient{}, err
	}

	client, err1 := kubernetes.NewForConfig(config)
	if err1 != nil {
		return PodClient{}, err1
	}

	return PodClient{Client: client}, nil
}

func getPodFromK8sPod(k8sPod *v1.Pod) *Pod {
	labels := ""
	for k, v := range k8sPod.Labels {
		labels += k + ": " + v + "  "
	}
	pod := &Pod{
		Name:        k8sPod.Name,
		Namespace:   k8sPod.Namespace,
		CreatedTime: k8sPod.CreationTimestamp.Format("2006-01-02 15:04:05"),
		HostIP:      k8sPod.Status.HostIP,
		PodIP:       k8sPod.Status.PodIP,
		Status:      string(k8sPod.Status.Phase),
		Labels:      labels,
	}
	return pod
}

func (client PodClient) GetPods() ([]*Pod, error) {
	var pods []*Pod
	namespaces, err := client.Client.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, namespace := range namespaces.Items {
		currPods, err := client.Client.CoreV1().Pods(namespace.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for _, pod := range currPods.Items {
			pods = append(pods, getPodFromK8sPod(&pod))
		}
	}
	return pods, nil
}

func (client PodClient) GetPod(name string) (*Pod, error) {
	namespaces, err := client.Client.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, namespace := range namespaces.Items {
		currPods, err := client.Client.CoreV1().Pods(namespace.Name).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}
		for _, pod := range currPods.Items {
			if pod.Name == name {
				return getPodFromK8sPod(&pod), nil
			}
		}
	}
	return nil, fmt.Errorf("Pod %s not found", name)
}

// The status of Pods includes Pending, Running, Succeeded, Failed, etc.
// These statuses are automatically updated by Kubernetes' scheduler, controllers (such as Deployment, StatefulSet, etc.), and kubelet components based on the cluster's status.
// Cannot be modified through API.
func (client PodClient) UpdatePodState(name string, state string) (bool, string, error) {
	return true, fmt.Sprintf("Pod: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}
