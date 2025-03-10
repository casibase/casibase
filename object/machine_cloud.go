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

	"github.com/casibase/casibase/service"
)

func getMachineFromService(owner string, provider string, clientMachine *service.Machine) *Machine {
	return &Machine{
		Owner:       owner,
		Name:        clientMachine.Name,
		Id:          clientMachine.Id,
		Provider:    provider,
		CreatedTime: clientMachine.CreatedTime,
		UpdatedTime: clientMachine.UpdatedTime,
		ExpireTime:  clientMachine.ExpireTime,
		DisplayName: clientMachine.DisplayName,
		Region:      clientMachine.Region,
		Zone:        clientMachine.Zone,
		Category:    clientMachine.Category,
		Type:        clientMachine.Type,
		Size:        clientMachine.Size,
		Tag:         clientMachine.Tag,
		State:       clientMachine.State,
		Image:       clientMachine.Image,
		Os:          clientMachine.Os,
		PublicIp:    clientMachine.PublicIp,
		PrivateIp:   clientMachine.PrivateIp,
		CpuSize:     clientMachine.CpuSize,
		MemSize:     clientMachine.MemSize,
	}
}

func getMachinesCloud(owner string) ([]*Machine, error) {
	machines := []*Machine{}
	providers, err := getActiveCloudProviders(owner)
	if err != nil {
		return nil, err
	}

	for _, provider := range providers {
		client, err2 := service.NewMachineClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
		if err2 != nil {
			return nil, err2
		}

		clientMachines, err2 := client.GetMachines()
		if err2 != nil {
			if provider.Type != "VMware" {
				return nil, err2
			}
		}

		for _, clientMachine := range clientMachines {
			machine := getMachineFromService(owner, provider.Name, clientMachine)
			machines = append(machines, machine)
		}
	}

	return machines, nil
}

func SyncMachinesCloud(owner string) (bool, error) {
	machines, err := getMachinesCloud(owner)
	if err != nil {
		return false, err
	}

	dbMachines, err := GetMachines(owner)
	if err != nil {
		return false, err
	}

	dbMachineMap := map[string]*Machine{}
	for _, dbMachine := range dbMachines {
		dbMachineMap[dbMachine.GetId()] = dbMachine
	}

	for _, machine := range machines {
		if dbMachine, ok := dbMachineMap[machine.GetId()]; ok {
			machine.RemoteProtocol = dbMachine.RemoteProtocol
			machine.RemotePort = dbMachine.RemotePort
			machine.RemoteUsername = dbMachine.RemoteUsername
			machine.RemotePassword = dbMachine.RemotePassword
		}
	}

	_, err = deleteMachines(owner)
	if err != nil {
		return false, err
	}

	if len(machines) == 0 {
		return false, nil
	}

	affected, err := addMachines(machines)
	return affected, err
}

func updateMachineCloud(oldMachine *Machine, machine *Machine) (bool, error) {
	provider, err := getProvider("admin", oldMachine.Provider)
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, fmt.Errorf("The provider: %s does not exist", machine.Provider)
	}

	client, err := service.NewMachineClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return false, err
	}

	if oldMachine.State != machine.State {
		affected, _, err := client.UpdateMachineState(oldMachine.Name, machine.State)
		if err != nil {
			return false, err
		}

		return affected, nil
	}

	return false, nil
}
