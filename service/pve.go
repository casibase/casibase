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
	"strconv"
	"strings"

	"github.com/luthermonson/go-proxmox"
	"github.com/pkg/errors"
	"golang.org/x/net/context"
)

type MachinePveClient struct {
	client *proxmox.Client
}

// hostname is the IP address of the target host and the configured port format is {IP}:{port}
// credential is the credential for go-proxmox service, in the form of {username}:{password}
// credentials := proxmox.Credentials{Username: "root@pam", Password: "12345",}
func newMachinePveClient(hostname string, credential string) (MachinePveClient, error) {
	credentials := proxmox.Credentials{
		Username: strings.Split(credential, ":")[0],
		Password: strings.Split(credential, ":")[1],
	}
	pclient := proxmox.NewClient("https://"+hostname+"/api2/json",
		proxmox.WithCredentials(&credentials),
	)
	return MachinePveClient{pclient}, nil
}

func getMachineFromVirtualMachine(virtualMachine *proxmox.VirtualMachine) *Machine {
	machine := &Machine{
		Name:        strconv.FormatUint(uint64(virtualMachine.VMID), 10),
		Id:          virtualMachine.Node,
		UpdatedTime: getLocalTimestamp(fmt.Sprintf("%d", virtualMachine.Uptime)),
		State:       virtualMachine.Status,
		Os:          virtualMachine.RunningMachine,
		CpuSize:     fmt.Sprintf("%d", virtualMachine.CPUs),
		MemSize:     fmt.Sprintf("%d", virtualMachine.MaxMem),
		Tag:         virtualMachine.Tags,
	}

	return machine
}

func (client MachinePveClient) GetMachines() ([]*Machine, error) {
	nodeStatuses, err := client.client.Nodes(context.Background())
	if err != nil {
		return nil, err
	}

	machines := []*Machine{}
	for _, nodeStatuse := range nodeStatuses {
		node, err := client.client.Node(context.Background(), nodeStatuse.Node)
		if err != nil {
			return nil, err
		}
		virtualMachines, err := node.VirtualMachines(context.Background())
		if err != nil {
			return nil, err
		}
		for _, virtualMachine := range virtualMachines {
			machine := getMachineFromVirtualMachine(virtualMachine)
			machines = append(machines, machine)
		}
	}

	return machines, nil
}

func (client MachinePveClient) GetMachine(name string) (*Machine, error) {
	nodeStatuses, err := client.client.Nodes(context.Background())
	if err != nil {
		return nil, err
	}

	vmid, err := strconv.Atoi(name)
	if err != nil {
		return nil, err
	}

	for _, nodeStatuse := range nodeStatuses {
		node, err := client.client.Node(context.Background(), nodeStatuse.Node)
		if err != nil {
			return nil, err
		}
		virtualMachine, err := node.VirtualMachine(context.Background(), vmid)
		if err != nil && virtualMachine != nil {
			return nil, err
		} else if err == nil && virtualMachine != nil {
			machine := getMachineFromVirtualMachine(virtualMachine)
			return machine, nil
		}
	}

	return nil, errors.New(fmt.Sprintf("VirtualMachine: [%s] is not found", name))
}

func (client MachinePveClient) UpdateMachineState(name string, state string) (bool, string, error) {
	machine, err := client.GetMachine(name)
	if err != nil {
		return false, "", err
	}

	if machine == nil {
		return false, fmt.Sprintf("VirtualMachine: [%s] is not found", name), nil
	}

	node, err := client.client.Node(context.Background(), machine.Id)
	vmid, err := strconv.Atoi(machine.Name)
	virtualMachine, err := node.VirtualMachine(context.Background(), vmid)

	switch state {
	case "Running":
		_, err = virtualMachine.Start(context.Background())
	case "Stopped":
		_, err = virtualMachine.Stop(context.Background())
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	if err != nil {
		return false, "", err
	}

	return true, fmt.Sprintf("VirtualMachine: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}
