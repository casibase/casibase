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
	"context"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"
)

type MachineAzureClient struct {
	Client        *armcompute.VirtualMachinesClient
	resourceGroup string
}

func newMachineAzureClient(accessKeyId string, accessKeySecret string) (MachineAzureClient, error) {
	cred, err := azidentity.NewClientSecretCredential("", accessKeyId, accessKeySecret, nil)
	if err != nil {
		return MachineAzureClient{}, err
	}

	client, err := armcompute.NewVirtualMachinesClient("", cred, nil)
	if err != nil {
		return MachineAzureClient{}, err
	}

	return MachineAzureClient{Client: client, resourceGroup: "us-machine_group"}, nil
}

func getMachineFromAzureInstance(vm armcompute.VirtualMachine) *Machine {
	machine := &Machine{
		Name:        *vm.Name,
		Id:          *vm.ID,
		Region:      *vm.Location,
		DisplayName: *vm.Name,
	}

	if vm.Properties != nil {
		if vm.Properties.HardwareProfile != nil {
			machine.Size = string(*vm.Properties.HardwareProfile.VMSize)
		}
		if vm.Properties.StorageProfile != nil && vm.Properties.StorageProfile.ImageReference != nil {
			machine.Image = *vm.Properties.StorageProfile.ImageReference.ID
		}
		if vm.Properties.OSProfile != nil {
			machine.Os = *vm.Properties.OSProfile.ComputerName
		}
		if vm.Properties.ProvisioningState != nil {
			machine.State = *vm.Properties.ProvisioningState
		}
	}

	if vm.Tags != nil {
		for key, value := range vm.Tags {
			machine.Tag += fmt.Sprintf("%s=%s,", key, *value)
		}
	}

	return machine
}

func (client MachineAzureClient) GetMachines() ([]*Machine, error) {
	pager := client.Client.NewListPager(client.resourceGroup, nil)
	machines := []*Machine{}

	for pager.More() {
		page, err := pager.NextPage(context.Background())
		if err != nil {
			return nil, err
		}

		for _, vm := range page.Value {
			machine := getMachineFromAzureInstance(*vm)
			machines = append(machines, machine)
		}
	}

	return machines, nil
}

func (client MachineAzureClient) GetMachine(name string) (*Machine, error) {
	vm, err := client.Client.Get(context.Background(), client.resourceGroup, name, nil)
	if err != nil {
		return nil, err
	}

	return getMachineFromAzureInstance(vm.VirtualMachine), nil
}

func (client MachineAzureClient) UpdateMachineState(name string, state string) (bool, string, error) {
	return false, "", fmt.Errorf("Not implemented")
}
