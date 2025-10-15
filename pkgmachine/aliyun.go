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

package pkgmachine

import (
	"fmt"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/casibase/casibase/i18n"
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
	Client *ecs20140526.Client
}

func newMachineAliyunClient(accessKeyId string, accessKeySecret string, region string) (MachineAliyunClient, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKeyId),
		AccessKeySecret: tea.String(accessKeySecret),
		RegionId:        tea.String(region),
		Endpoint:        tea.String("ecs." + region + ".aliyuncs.com"),
	}
	client, err := ecs20140526.NewClient(config)
	if err != nil {
		return MachineAliyunClient{}, err
	}

	return MachineAliyunClient{Client: client}, nil
}

func getMachineFromInstance(instance *ecs20140526.DescribeInstancesResponseBodyInstancesInstance) *Machine {
	machine := &Machine{
		Name:        tea.StringValue(instance.InstanceName),
		Id:          tea.StringValue(instance.InstanceId),
		CreatedTime: getLocalTimestamp(tea.StringValue(instance.CreationTime)),
		UpdatedTime: getLocalTimestamp(tea.StringValue(instance.StartTime)),
		ExpireTime:  getLocalTimestamp(tea.StringValue(instance.ExpiredTime)),
		DisplayName: tea.StringValue(instance.InstanceName),
		Region:      tea.StringValue(instance.RegionId),
		Zone:        tea.StringValue(instance.ZoneId),
		Category:    tea.StringValue(instance.InstanceTypeFamily),
		Type:        tea.StringValue(instance.InstanceChargeType),
		Size:        tea.StringValue(instance.InstanceType),
		State:       tea.StringValue(instance.Status),
		Image:       tea.StringValue(instance.ImageId),
		Os:          tea.StringValue(instance.OSName),
		CpuSize:     fmt.Sprintf("%d", tea.Int32Value(instance.Cpu)),
		MemSize:     fmt.Sprintf("%d", tea.Int32Value(instance.Memory)),
	}

	if instance.Tags != nil && instance.Tags.Tag != nil {
		for _, tag := range instance.Tags.Tag {
			machine.Tag += fmt.Sprintf("%s=%s,", tea.StringValue(tag.TagKey), tea.StringValue(tag.TagValue))
		}
	}

	if instance.EipAddress != nil && tea.StringValue(instance.EipAddress.IpAddress) != "" {
		machine.PublicIp = tea.StringValue(instance.EipAddress.IpAddress)
	} else if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
		machine.PublicIp = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
	}

	if instance.VpcAttributes != nil && instance.VpcAttributes.PrivateIpAddress != nil && len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
		machine.PrivateIp = tea.StringValue(instance.VpcAttributes.PrivateIpAddress.IpAddress[0])
	}

	return machine
}

func (client MachineAliyunClient) GetMachines(lang string) ([]*Machine, error) {
	request := &ecs20140526.DescribeInstancesRequest{
		PageSize: tea.Int32(100),
	}

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	machines := []*Machine{}
	if response.Body.Instances != nil && response.Body.Instances.Instance != nil {
		for _, instance := range response.Body.Instances.Instance {
			machine := getMachineFromInstance(instance)
			machines = append(machines, machine)
		}
	}

	return machines, nil
}

func (client MachineAliyunClient) GetMachine(name string, lang string) (*Machine, error) {
	request := &ecs20140526.DescribeInstancesRequest{
		InstanceName: tea.String(name),
	}

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	if response.Body.Instances == nil || response.Body.Instances.Instance == nil || len(response.Body.Instances.Instance) == 0 {
		return nil, nil
	}

	instance := response.Body.Instances.Instance[0]
	machine := getMachineFromInstance(instance)
	return machine, nil
}

func (client MachineAliyunClient) UpdateMachineState(name string, state string, lang string) (bool, string, error) {
	machine, err := client.GetMachine(name, lang)
	if err != nil {
		return false, "", err
	}

	if machine == nil {
		return false, fmt.Sprintf(i18n.Translate(lang, "pkgmachine:Instance: [%s] is not found"), name), nil
	}

	instanceId := machine.Id

	switch state {
	case "Running":
		startRequest := &ecs20140526.StartInstanceRequest{
			InstanceId: tea.String(instanceId),
		}
		_, err = client.Client.StartInstance(startRequest)
	case "Stopped":
		stopRequest := &ecs20140526.StopInstanceRequest{
			InstanceId: tea.String(instanceId),
		}
		_, err = client.Client.StopInstance(stopRequest)
	default:
		return false, fmt.Sprintf(i18n.Translate(lang, "pkgmachine:Unsupported state: %s"), state), nil
	}

	if err != nil {
		return false, "", err
	}

	return true, fmt.Sprintf(i18n.Translate(lang, "pkgmachine:Instance: [%s]'s state has been successfully updated to: [%s]"), name, state), nil
}
