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

	"github.com/aliyun/alibaba-cloud-sdk-go/services/ecs"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Machine struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	Id          string `xorm:"varchar(100)" json:"id"`
	Provider    string `xorm:"varchar(100)" json:"provider"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	ExpireTime  string `xorm:"varchar(100)" json:"expireTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Region   string `xorm:"varchar(100)" json:"region"`
	Zone     string `xorm:"varchar(100)" json:"zone"`
	Category string `xorm:"varchar(100)" json:"category"`
	Type     string `xorm:"varchar(100)" json:"type"`
	Size     string `xorm:"varchar(100)" json:"size"`
	Tag      string `xorm:"varchar(100)" json:"tag"`
	State    string `xorm:"varchar(100)" json:"state"`

	Image     string `xorm:"varchar(100)" json:"image"`
	Os        string `xorm:"varchar(100)" json:"os"`
	PublicIp  string `xorm:"varchar(100)" json:"publicIp"`
	PrivateIp string `xorm:"varchar(100)" json:"privateIp"`
	CpuSize   string `xorm:"varchar(100)" json:"cpuSize"`
	MemSize   string `xorm:"varchar(100)" json:"memSize"`

	// DB info
	RemoteProtocol string `xorm:"varchar(100)" json:"remoteProtocol"`
	RemotePort     int    `json:"remotePort"`
	RemoteUsername string `xorm:"varchar(100)" json:"remoteUsername"`
	RemotePassword string `xorm:"varchar(100)" json:"remotePassword"`
}

func GetMachineCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Machine{})
}

func GetMachines(owner string) ([]*Machine, error) {
	machines := []*Machine{}
	err := adapter.engine.Desc("created_time").Find(&machines, &Machine{Owner: owner})
	if err != nil {
		return machines, err
	}
	return machines, nil
}

func GetPaginationMachines(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Machine, error) {
	machines := []*Machine{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&machines)
	if err != nil {
		return machines, err
	}

	return machines, nil
}

func getMachine(owner string, name string) (*Machine, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	machine := Machine{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&machine)
	if err != nil {
		return &machine, err
	}

	if existed {
		return &machine, nil
	} else {
		return nil, nil
	}
}

func GetMachine(id string) (*Machine, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getMachine(owner, name)
}

func GetMaskedMachine(machine *Machine, errs ...error) (*Machine, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if machine == nil {
		return nil, nil
	}

	if machine.RemotePassword != "" {
		machine.RemotePassword = "***"
	}

	return machine, nil
}

func GetMaskedMachines(machines []*Machine, errs ...error) ([]*Machine, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, machine := range machines {
		machine, err = GetMaskedMachine(machine)
		if err != nil {
			return nil, err
		}
	}

	return machines, nil
}

func UpdateMachine(id string, machine *Machine) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	oldMachine, err := getMachine(owner, name)
	if err != nil {
		return false, err
	} else if oldMachine == nil {
		return false, nil
	}

	if machine.RemotePassword == "***" {
		machine.RemotePassword = oldMachine.RemotePassword
	}

	_, err = updateMachineCloud(oldMachine, machine)
	if err != nil {
		return false, err
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(machine)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddMachine(machine *Machine) (bool, error) {
	if len(machine.DisplayName) > 0 {
		res, err := createMachineByImage(machine)
		if err != nil || res == false {
			return false, err
		}
	}

	affected, err := adapter.engine.Insert(machine)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func createMachineByImage(machine *Machine) (bool, error) {
	providers, err := getActiveCloudProviders(machine.Owner)
	if err != nil {
		return false, err
	}
	for _, provider := range providers {
		if provider.Type == "Aliyun" {
			client, err2 := ecs.NewClientWithAccessKey(
				provider.Region,
				provider.ClientId,
				provider.ClientSecret,
			)
			if err2 != nil {
				return false, err2
			}

			request0 := ecs.CreateDescribeAvailableResourceRequest()
			request0.RegionId = provider.Region
			request0.DestinationResource = "InstanceType"
			response0, err2 := client.DescribeAvailableResource(request0)
			if err2 != nil {
				return false, err2
			}
			supportedResource := response0.AvailableZones.AvailableZone[0].AvailableResources.AvailableResource[0].SupportedResources.SupportedResource

			var instanceType string
			for _, resource := range supportedResource {
				if resource.Status == "Available" {
					instanceType = resource.Value
					break
				}
			}

			request1 := ecs.CreateDescribeSecurityGroupsRequest()
			response1, err2 := client.DescribeSecurityGroups(request1)
			if err2 != nil {
				return false, err2
			}
			securityGroupId := response1.SecurityGroups.SecurityGroup[0].SecurityGroupId
			vpcId := response1.SecurityGroups.SecurityGroup[0].VpcId

			request2 := ecs.CreateDescribeVSwitchesRequest()
			request2.VpcId = vpcId
			request2.RegionId = provider.Region
			response2, err2 := client.DescribeVSwitches(request2)
			vSwitchId := response2.VSwitches.VSwitch[0].VSwitchId

			request3 := ecs.CreateDescribeAvailableResourceRequest()
			request3.RegionId = provider.Region
			request3.DestinationResource = "SystemDisk"
			request3.InstanceType = instanceType
			response3, err3 := client.DescribeAvailableResource(request3)
			if err3 != nil {
				return false, err3
			}
			systemDiskCategory := response3.AvailableZones.AvailableZone[0].AvailableResources.AvailableResource[0].SupportedResources.SupportedResource[0].Value

			request := ecs.CreateRunInstancesRequest()
			request.InstanceType = instanceType
			request.RegionId = provider.Region
			request.ImageId = machine.DisplayName
			request.SecurityGroupId = securityGroupId
			request.VSwitchId = vSwitchId
			request.SystemDiskCategory = systemDiskCategory
			_, err := client.RunInstances(request)
			if err != nil {
				return false, err
			}
			return true, nil
		}
	}
	return false, nil
}

func addMachines(machines []*Machine) (bool, error) {
	affected, err := adapter.engine.Insert(machines)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteMachine(machine *Machine) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{machine.Owner, machine.Name}).Delete(&Machine{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func deleteMachines(owner string) (bool, error) {
	affected, err := adapter.engine.Delete(&Machine{Owner: owner})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (machine *Machine) GetId() string {
	return fmt.Sprintf("%s/%s", machine.Owner, machine.Name)
}
