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

	"github.com/casibase/casibase/i18n"
)

type MachineClientInterface interface {
	GetMachines(lang string) ([]*Machine, error)
	GetMachine(name string, lang string) (*Machine, error)
	UpdateMachineState(name string, state string, lang string) (bool, string, error)
}

func NewMachineClient(providerType string, accessKeyId string, accessKeySecret string, region string, lang string) (MachineClientInterface, error) {
	var res MachineClientInterface
	var err error
	switch providerType {
	case "Aliyun":
		res, err = newMachineAliyunClient(accessKeyId, accessKeySecret, region)
	case "Azure":
		res, err = newMachineAzureClient(accessKeyId, accessKeySecret)
	case "VMware":
		res, err = newMachineVmwareClient(accessKeyId, accessKeySecret)
	case "KVM":
		res, err = newMachineKvmClient(accessKeyId, accessKeySecret)
	case "Google Cloud":
		res, err = newMachineGcpClient(accessKeyId, accessKeySecret, region)
	case "AWS":
		res, err = newMachineAwsClient(accessKeyId, accessKeySecret, region)
	case "Tencent Cloud":
		res, err = newMachineTencentClient(accessKeyId, accessKeySecret, region)
	default:
		return nil, fmt.Errorf(i18n.Translate(lang, "pkgimage:unsupported provider type: %s"), providerType)
	}

	if err != nil {
		return nil, err
	}
	return res, nil
}
