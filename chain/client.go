// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

package chain

import "fmt"

type ChainClientInterface interface {
	Commit(data string) (string, string, error)
	Query(txId string, data string) (string, error)
}

func NewChainClient(providerType string, clientId string, clientSecret string, region string, networkId string, chainId string) (ChainClientInterface, error) {
	var res ChainClientInterface
	var err error
	if providerType == "ChainMaker" || providerType == "Tencent ChainMaker" {
		res, err = newChainTencentChainmakerClient(clientId, clientSecret, region, networkId, chainId)
	} else if providerType == "Tencent ChainMaker (Demo Network)" {
		res, err = newChainTencentChainmakerDemoClient(clientId, clientSecret, region, networkId, chainId)
	} else {
		return nil, fmt.Errorf("unsupported provider type: %s", providerType)
	}

	if err != nil {
		return nil, err
	}

	return res, nil
}
