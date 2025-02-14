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

	"cloud.google.com/go/compute/apiv1/computepb"
	"google.golang.org/grpc"
)

type MachineGcpClient struct {
	Client    *computepb.InstancesClient
	ProjectID string
	Zone      string
}

// hostname is the IP address of the target host and the configured port format is {IP}:{port}
func newMachineGcpClient(hostname string, projectID string, zone string) (MachineGcpClient, error) {
	conn, err := grpc.Dial(
		hostname,
	)
	if err != nil {
		return MachineGcpClient{}, err
	}

	client := computepb.NewInstancesClient(conn)
	return MachineGcpClient{Client: &client, ProjectID: projectID, Zone: zone}, nil
}

func getMachineFromComputepbInstance(instance *computepb.Instance) *Machine {
	machine := &Machine{
		Name:        instance.GetName(),
		Id:          fmt.Sprintf("%d", instance.GetId()),
		CreatedTime: getLocalTimestamp(instance.GetCreationTimestamp()),
		UpdatedTime: getLocalTimestamp(instance.GetLastStartTimestamp()),
		DisplayName: instance.GetName(),
		Zone:        instance.GetZone(),
		Type:        instance.GetMachineType(),
		State:       instance.GetStatus(),
		Image:       instance.GetSourceMachineImage(),
		Os:          instance.GetDisks()[0].GetGuestOsFeatures()[0].GetType(),
		CpuSize:     instance.GetCpuPlatform(),
	}

	for key, value := range instance.GetLabels() {
		machine.Tag += fmt.Sprintf("%s=%s,", key, value)
	}

	if len(instance.GetNetworkInterfaces()) > 0 {
		if len(instance.GetNetworkInterfaces()[0].GetAccessConfigs()) > 0 {
			machine.PublicIp = instance.GetNetworkInterfaces()[0].GetAccessConfigs()[0].GetNatIP()
		}
		machine.PrivateIp = instance.GetNetworkInterfaces()[0].GetNetworkIP()
	}

	return machine
}

func (client MachineGcpClient) GetMachines() ([]*Machine, error) {
	ctx := context.Background()
	var maxResults *uint32
	value := uint32(100)
	maxResults = &value
	req := &computepb.ListInstancesRequest{
		Project:    client.ProjectID,
		Zone:       client.Zone,
		MaxResults: maxResults,
	}

	resp, err := computepb.InstancesClient.List(*client.Client, ctx, req)
	if err != nil {
		return nil, err
	}

	machines := []*Machine{}
	for _, instance := range resp.GetItems() {
		machine := getMachineFromComputepbInstance(instance)
		machines = append(machines, machine)
	}

	return machines, nil
}

func (client MachineGcpClient) GetMachine(name string) (*Machine, error) {
	ctx := context.Background()
	req := &computepb.GetInstanceRequest{
		Project:  client.ProjectID,
		Zone:     client.Zone,
		Instance: name,
	}

	instance, err := computepb.InstancesClient.Get(*client.Client, ctx, req)
	if err != nil {
		return nil, err
	}

	machine := getMachineFromComputepbInstance(instance)
	return machine, nil
}

func (client MachineGcpClient) UpdateMachineState(name string, state string) (bool, string, error) {
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
		startReq := &computepb.StartInstanceRequest{
			Project:  client.ProjectID,
			Zone:     client.Zone,
			Instance: instanceId,
		}
		_, err = computepb.InstancesClient.Start(*client.Client, context.Background(), startReq)
	case "Stopped":
		stopReq := &computepb.StopInstanceRequest{
			Project:  client.ProjectID,
			Zone:     client.Zone,
			Instance: instanceId,
		}
		_, err = computepb.InstancesClient.Stop(*client.Client, context.Background(), stopReq)
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	if err != nil {
		return false, "", err
	}

	return true, fmt.Sprintf("Instance: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}
