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

package service

import (
	"fmt"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/ecs"
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
}

type MachineAliyunClient struct {
	Client *ecs.Client
}

func newMachineAliyunClient(accessKeyId string, accessKeySecret string, region string) (MachineAliyunClient, error) {
	client, err := ecs.NewClientWithAccessKey(
		region,
		accessKeyId,
		accessKeySecret,
	)
	if err != nil {
		return MachineAliyunClient{}, err
	}

	return MachineAliyunClient{Client: client}, nil
}

func getMachineFromInstance(instance ecs.Instance) *Machine {
	machine := &Machine{
		Name:        instance.InstanceName,
		Id:          instance.InstanceId,
		CreatedTime: getLocalTimestamp(instance.CreationTime),
		UpdatedTime: getLocalTimestamp(instance.LastInvokedTime),
		ExpireTime:  getLocalTimestamp(instance.ExpiredTime),
		DisplayName: instance.InstanceName,
		Region:      instance.RegionId,
		Zone:        instance.ZoneId,
		Category:    instance.InstanceTypeFamily,
		Type:        instance.InstanceChargeType,
		Size:        instance.InstanceType,
		State:       instance.Status,
		Image:       instance.ImageId,
		Os:          instance.OSName,
		CpuSize:     fmt.Sprintf("%d", instance.Cpu),
		MemSize:     fmt.Sprintf("%d", instance.Memory),
	}

	for _, tag := range instance.Tags.Tag {
		machine.Tag += fmt.Sprintf("%s=%s,", tag.Key, tag.Value)
	}

	if instance.EipAddress.IpAddress != "" {
		machine.PublicIp = instance.EipAddress.IpAddress
	} else if len(instance.PublicIpAddress.IpAddress) > 0 {
		machine.PublicIp = instance.PublicIpAddress.IpAddress[0]
	}

	if len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
		machine.PrivateIp = instance.VpcAttributes.PrivateIpAddress.IpAddress[0]
	}

	return machine
}

func (client MachineAliyunClient) GetMachines() ([]*Machine, error) {
	request := ecs.CreateDescribeInstancesRequest()
	request.PageSize = "100"

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	machines := []*Machine{}
	for _, instance := range response.Instances.Instance {
		machine := getMachineFromInstance(instance)
		machines = append(machines, machine)
	}

	return machines, nil
}

func (client MachineAliyunClient) GetMachine(name string) (*Machine, error) {
	request := ecs.CreateDescribeInstancesRequest()
	request.InstanceName = name

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	if len(response.Instances.Instance) == 0 {
		return nil, nil
	}

	instance := response.Instances.Instance[0]
	machine := getMachineFromInstance(instance)
	return machine, nil
}

func (client MachineAliyunClient) UpdateMachineState(name string, state string) (bool, string, error) {
	machine, err := client.GetMachine(name)
	if err != nil {
		return false, "", err
	}

	if machine == nil {
		return false, fmt.Sprintf("Instance: [%s] is not found", name), nil
	}

	instanceId := machine.Id

	switch state {
	case "Running":
		startRequest := ecs.CreateStartInstanceRequest()
		startRequest.InstanceId = instanceId
		_, err = client.Client.StartInstance(startRequest)
	case "Stopped":
		stopRequest := ecs.CreateStopInstanceRequest()
		stopRequest.InstanceId = instanceId
		_, err = client.Client.StopInstance(stopRequest)
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	if err != nil {
		return false, "", err
	}

	return true, fmt.Sprintf("Instance: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}
