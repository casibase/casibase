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
	"strings"

	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	cvm "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cvm/v20170312"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type MachineTencentClient struct {
	Client *cvm.Client
}

func newMachineTencentClient(accessKeyId string, accessKeySecret string, region string) (MachineTencentClient, error) {
	credential := common.NewCredential(accessKeyId, accessKeySecret)

	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "cvm.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"
	cpf.Debug = false

	client, err := cvm.NewClient(credential, region, cpf)
	if err != nil {
		return MachineTencentClient{}, err
	}

	return MachineTencentClient{Client: client}, nil
}

func getMachineFromTencentInstance(instance *cvm.Instance) *Machine {
	machine := &Machine{
		Name:        getString(instance.InstanceName),
		Id:          getString(instance.InstanceId),
		CreatedTime: getString(instance.CreatedTime),
		ExpireTime:  getString(instance.ExpiredTime),
		DisplayName: getString(instance.InstanceName),
		UpdatedTime: "",
		Zone:        getString(instance.Placement.Zone),

		Category: "",
		Type:     getString(instance.InstanceChargeType),
		Size:     getString(instance.InstanceType),
		State:    cases.Title(language.English).String(strings.ToLower(getString(instance.InstanceState))),

		Image: getString(instance.ImageId),
		Os:    getString(instance.OsName),

		CpuSize: fmt.Sprintf("%d", getInt64(instance.CPU)),
		MemSize: fmt.Sprintf("%d", getInt64(instance.Memory)),
	}

	for _, tag := range instance.Tags {
		machine.Tag += fmt.Sprintf("%s=%s,", getString(tag.Key), getString(tag.Value))
	}

	if len(instance.PublicIpAddresses) > 0 && instance.PublicIpAddresses[0] != nil {
		machine.PublicIp = *instance.PublicIpAddresses[0]
	}

	if len(instance.PrivateIpAddresses) > 0 && instance.PrivateIpAddresses[0] != nil {
		machine.PrivateIp = *instance.PrivateIpAddresses[0]
	}

	return machine
}

func (client MachineTencentClient) GetMachines() ([]*Machine, error) {
	request := cvm.NewDescribeInstancesRequest()

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		if _, ok := err.(*errors.TencentCloudSDKError); ok {
			return nil, fmt.Errorf("Tencent Cloud API error: %s", err)
		}
		return nil, err
	}

	fmt.Printf("DescribeInstances response: %s\n", response.ToJsonString())

	machines := []*Machine{}
	for _, reservation := range response.Response.InstanceSet {
		m := getMachineFromTencentInstance(reservation)
		machines = append(machines, m)
	}

	return machines, nil
}

func (client MachineTencentClient) GetMachine(name string) (*Machine, error) {
	request := cvm.NewDescribeInstancesRequest()

	request.Filters = []*cvm.Filter{
		{
			Name:   common.StringPtr("instance-name"),
			Values: []*string{&name},
		},
	}

	response, err := client.Client.DescribeInstances(request)
	if err != nil {
		if _, ok := err.(*errors.TencentCloudSDKError); ok {
			return nil, fmt.Errorf("Tencent Cloud API error: %s", err)
		}
		return nil, err
	}

	if len(response.Response.InstanceSet) == 0 {
		return nil, nil
	}

	instance := response.Response.InstanceSet[0]
	machine := getMachineFromTencentInstance(instance)
	return machine, nil
}

func (client MachineTencentClient) UpdateMachineState(name string, state string) (bool, string, error) {
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
		startReq := cvm.NewStartInstancesRequest()
		startReq.InstanceIds = []*string{&instanceId}

		_, err = client.Client.StartInstances(startReq)
		if err != nil {
			fmt.Printf("Error starting instance: %v\n", err)
			return false, "", err
		}

	case "Stopped":
		stopReq := cvm.NewStopInstancesRequest()
		stopReq.InstanceIds = []*string{&instanceId}

		_, err = client.Client.StopInstances(stopReq)
		if err != nil {
			fmt.Printf("Error stopping instance: %v\n", err)
			return false, "", err
		}
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	return true, fmt.Sprintf("Instance: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}

func getString(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}

func getInt64(ptr *int64) int64 {
	if ptr == nil {
		return 0
	}
	return *ptr
}
