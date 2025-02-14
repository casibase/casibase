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

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

type MachineAwsClient struct {
	Client *ec2.Client
	region string
}

func newMachineAwsClient(accessKeyId string, accessKeySecret string, region string) (MachineAwsClient, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     accessKeyId,
				SecretAccessKey: accessKeySecret,
			}, nil
		})),
	)
	if err != nil {
		return MachineAwsClient{}, err
	}

	client := ec2.NewFromConfig(cfg)
	return MachineAwsClient{Client: client, region: region}, nil
}

func getMachineFromAwsInstance(instance ec2Types.Instance) *Machine {
	machine := &Machine{
		Name:        *instance.InstanceId,
		Id:          *instance.InstanceId,
		Region:      *instance.Placement.AvailabilityZone,
		DisplayName: *instance.InstanceId,
	}

	if instance.InstanceType != "" {
		machine.Size = string(instance.InstanceType)
	}

	if len(instance.Tags) > 0 {
		for _, tag := range instance.Tags {
			machine.Tag += fmt.Sprintf("%s=%s,", *tag.Key, *tag.Value)
		}
	}

	machine.State = string(instance.State.Name)

	return machine
}

func (client MachineAwsClient) GetMachines() ([]*Machine, error) {
	input := &ec2.DescribeInstancesInput{}
	output, err := client.Client.DescribeInstances(context.TODO(), input)
	if err != nil {
		return nil, err
	}

	machines := []*Machine{}
	for _, reservation := range output.Reservations {
		for _, instance := range reservation.Instances {
			machine := getMachineFromAwsInstance(instance)
			machines = append(machines, machine)
		}
	}

	return machines, nil
}

func (client MachineAwsClient) GetMachine(name string) (*Machine, error) {
	input := &ec2.DescribeInstancesInput{
		InstanceIds: []string{name},
	}

	output, err := client.Client.DescribeInstances(context.TODO(), input)
	if err != nil {
		return nil, err
	}

	if len(output.Reservations) == 0 || len(output.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("Instance not found: %s", name)
	}

	instance := output.Reservations[0].Instances[0]
	return getMachineFromAwsInstance(instance), nil
}

func (client MachineAwsClient) UpdateMachineState(name string, state string) (bool, string, error) {
	switch state {
	case "Running":
		input := &ec2.StartInstancesInput{
			InstanceIds: []string{name},
		}
		_, err := client.Client.StartInstances(context.TODO(), input)
		if err != nil {
			return false, "", err
		}
	case "Stopped":
		input := &ec2.StopInstancesInput{
			InstanceIds: []string{name},
		}
		_, err := client.Client.StopInstances(context.TODO(), input)
		if err != nil {
			return false, "", err
		}
	default:
		return false, fmt.Sprintf("Unsupported state: %s", state), nil
	}

	return true, fmt.Sprintf("Instance: [%s]'s state has been successfully updated to: [%s]", name, state), nil
}
