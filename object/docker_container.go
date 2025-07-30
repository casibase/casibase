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

	"github.com/casibase/casibase/pkgdocker"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
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
	// Labels      map[string]string
	State  string `xorm:"varchar(100)" json:"state"`
	Status string `xorm:"varchar(100)" json:"status"`
	Ports  string `xorm:"varchar(100)" json:"ports"`

	// HostConfig struct {
	//	 NetworkMode string            `json:",omitempty"`
	//	 Annotations map[string]string `json:",omitempty"`
	// }
}

func GetContainerCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Container{})
}

func GetContainers(owner string) ([]*Container, error) {
	containers := []*Container{}
	err := adapter.engine.Desc("created_time").Find(&containers, &Container{Owner: owner})
	if err != nil {
		return containers, err
	}
	return containers, nil
}

func GetPaginationContainers(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Container, error) {
	containers := []*Container{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&containers)
	if err != nil {
		return containers, err
	}

	return containers, nil
}

func getContainer(owner string, name string) (*Container, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	container := Container{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&container)
	if err != nil {
		return &container, err
	}

	if existed {
		return &container, nil
	} else {
		return nil, nil
	}
}

func GetContainer(id string) (*Container, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getContainer(owner, name)
}

func GetMaskedContainer(container *Container, errs ...error) (*Container, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if container == nil {
		return nil, nil
	}

	return container, nil
}

func GetMaskedContainers(containers []*Container, errs ...error) ([]*Container, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, container := range containers {
		container, err = GetMaskedContainer(container)
		if err != nil {
			return nil, err
		}
	}

	return containers, nil
}

func UpdateContainer(id string, container *Container) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	oldContainer, err := getContainer(owner, name)
	if err != nil {
		return false, err
	} else if oldContainer == nil {
		return false, nil
	}

	_, err = updateContainer(oldContainer, container)
	if err != nil {
		return false, err
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(container)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddContainer(container *Container) (bool, error) {
	affected, err := adapter.engine.Insert(container)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func addContainers(containers []*Container) (bool, error) {
	affected, err := adapter.engine.Insert(containers)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteContainer(container *Container) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{container.Owner, container.Name}).Delete(&Container{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func deleteContainers(owner string) (bool, error) {
	affected, err := adapter.engine.Delete(&Container{Owner: owner})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (container *Container) GetId() string {
	return fmt.Sprintf("%s/%s", container.Owner, container.Name)
}

func SyncDockerContainers(owner string) (bool, error) {
	containers, err := getContainers(owner)
	if err != nil {
		return false, err
	}

	dbContainers, err := GetContainers(owner)
	if err != nil {
		return false, err
	}

	dbContainerMap := map[string]*Container{}
	for _, dbContainer := range dbContainers {
		dbContainerMap[dbContainer.GetId()] = dbContainer
	}

	_, err = deleteContainers(owner)
	if err != nil {
		return false, err
	}

	if len(containers) == 0 {
		return false, nil
	}

	affected, err := addContainers(containers)
	return affected, err
}

func updateContainer(oldContainer *Container, container *Container) (bool, error) {
	provider, err := getProvider("admin", oldContainer.Provider)
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, fmt.Errorf("The provider: %s does not exist", container.Provider)
	}

	client, err := pkgdocker.NewContainerClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return false, err
	}

	if oldContainer.State != container.State {
		affected, _, err := client.UpdateContainerState(oldContainer.Name, container.State)
		if err != nil {
			return false, err
		}

		return affected, nil
	}

	return false, nil
}

func getContainers(owner string) ([]*Container, error) {
	containers := []*Container{}
	providers, err := GetProviders("admin")
	if err != nil {
		return nil, err
	}

	for _, provider := range providers {
		if provider.Category == "Docker" {
			client, err2 := pkgdocker.NewContainerClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
			if err2 != nil {
				return nil, err2
			}

			clientContainers, err2 := client.GetContainers()

			for _, clientContainer := range clientContainers {
				container := getContainerFromService(owner, provider.Name, clientContainer)
				containers = append(containers, container)
			}
		}
	}

	return containers, nil
}

func getContainerFromService(owner string, provider string, clientContainer *pkgdocker.Container) *Container {
	return &Container{
		Owner:       owner,
		Name:        clientContainer.Name,
		DisplayName: clientContainer.DisplayName,
		Provider:    provider,
		CreatedTime: clientContainer.CreatedTime,
		Image:       clientContainer.Image,
		ImageId:     clientContainer.ImageId,
		Command:     clientContainer.Command,
		SizeRw:      clientContainer.SizeRw,
		SizeRootFs:  clientContainer.SizeRootFs,
		// Labels:      clientContainer.Labels,
		State:  clientContainer.State,
		Status: clientContainer.Status,
		Ports:  clientContainer.Ports,
		// HostConfig:  clientContainer.HostConfig,
	}
}
