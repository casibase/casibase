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
package pkgdocker

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type Container struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Provider    string `xorm:"varchar(100)" json:"provider"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Image       string `xorm:"varchar(100)" json:"image"`
	ImageId     string `xorm:"varchar(100)" json:"imageId"`
	Command     string `xorm:"varchar(100)" json:"command"`
	SizeRw      int64  `xorm:"varchar(100)"  json:"sizeRw,omitempty"`
	SizeRootFs  int64  `xorm:"varchar(100)"  json:"sizeRootFs,omitempty"`
	Labels      map[string]string
	State       string `xorm:"varchar(100)" json:"state"`
	Status      string `xorm:"varchar(100)" json:"status"`
	Ports       string `xorm:"varchar(100)" json:"ports"`

	HostConfig struct {
		NetworkMode string            `json:",omitempty"`
		Annotations map[string]string `json:",omitempty"`
	}
}

type ContainerClient struct {
	Client *client.Client
}

// Docker remote access service needs to be enabled and configured in advance.
func NewContainerClient(username string, hostname string, region string) (ContainerClient, error) {
	remoteAddr := "tcp://" + hostname + ":2375"
	containerClient, err := client.NewClientWithOpts(client.WithHost(remoteAddr), client.WithAPIVersionNegotiation())
	if err != nil {
		return ContainerClient{}, err
	}

	return ContainerClient{Client: containerClient}, nil
}

func getContainerFromSummary(summary container.Summary) *Container {
	var ports string
	for _, port := range summary.Ports {
		ports += port.IP + ":" + strconv.Itoa(int(port.PublicPort)) + ":" + strconv.Itoa(int(port.PrivatePort)) + " "
	}
	myContainer := &Container{
		Name:        summary.ID,
		DisplayName: summary.Names[0],
		CreatedTime: time.Unix(summary.Created, 0).Format(time.RFC3339),
		Image:       summary.Image,
		ImageId:     summary.ImageID,
		Command:     summary.Command,
		SizeRw:      summary.SizeRw,
		SizeRootFs:  summary.SizeRootFs,
		Labels:      summary.Labels,
		State:       summary.State,
		Status:      summary.Status,
		Ports:       ports,
		HostConfig:  summary.HostConfig,
	}
	return myContainer
}

func (client ContainerClient) GetContainers() ([]*Container, error) {
	containers := []*Container{}
	sum, err := client.Client.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}
	for _, summary := range sum {
		containers = append(containers, getContainerFromSummary(summary))
	}
	return containers, nil
}

func (client ContainerClient) GetContainer(name string) (*Container, error) {
	sum, err := client.Client.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}
	for _, summary := range sum {
		if summary.ID == name {
			return getContainerFromSummary(summary), nil
		}
	}
	return nil, fmt.Errorf("Container %s not found", name)
}

func (client ContainerClient) UpdateContainerState(name string, state string) (bool, string, error) {
	myContainer, err := client.GetContainer(name)
	if err != nil {
		return false, "", err
	}
	id := myContainer.Name
	switch state {
	case "Running":
		err = client.Client.ContainerStart(context.Background(), id, container.StartOptions{})
	case "Stopped":
		err = client.Client.ContainerStop(context.Background(), id, container.StopOptions{})
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	if err != nil {
		return false, "", err
	}

	return true, fmt.Sprintf("Container: [%s]'s state has been successfully updated to: [%s]", id, state), nil
}
