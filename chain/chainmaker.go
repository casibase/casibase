// Copyright 2024 The Casibase Authors.. All Rights Reserved.
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

import (
	"fmt"
	"strings"

	"github.com/casibase/casibase/util"
)

type ChainTencentChainmakerClient struct {
	ClientId     string
	ClientSecret string
	Region       string
	NetworkId    string
	ChainId      string
}

func newChainTencentChainmakerClient(clientId string, clientSecret string, region string, networkId string, chainId string) (ChainTencentChainmakerClient, error) {
	return ChainTencentChainmakerClient{
		ClientId:     clientId,
		ClientSecret: clientSecret,
		Region:       region,
		NetworkId:    networkId,
		ChainId:      chainId,
	}, nil
}

func (client ChainTencentChainmakerClient) Commit(data map[string]string) (string, error) {
	// simulate the situation that error occurs
	if strings.HasSuffix(data["id"], "0") {
		return "", fmt.Errorf("some error occurred in the ChainTencentChainmakerClient::Commit operation")
	}

	// Commit the data to the blockchain
	// Write some code... (if error occurred, handle it as above)

	// assume the block ID is returned by the blockchain, here we generate it from the record ID just as an example
	recordId := util.ParseInt(data["id"])
	blockId := fmt.Sprintf("%d", 130000+recordId)

	// if no error, return the block ID
	return blockId, nil
}

func (client ChainTencentChainmakerClient) Query(blockId string, data map[string]string) (string, error) {
	// simulate the situation that error occurs
	if strings.HasSuffix(data["id"], "0") {
		return "", fmt.Errorf("some error occurred in the ChainTencentChainmakerClient::Commit operation")
	}

	// Query the data from the blockchain
	// Write some code... (if error occurred, handle it as above)

	// assume the chain data are retrieved from the blockchain, here we just generate it statically
	chainData := map[string]string{"organization": "casbin"}

	// Check if the data are matched with the chain data
	res := "Matched"
	if chainData["organization"] != data["organization"] {
		res = "Mismatched"
	}

	// simulate the situation that mismatch occurs
	if strings.HasSuffix(blockId, "2") || strings.HasSuffix(blockId, "4") || strings.HasSuffix(blockId, "6") || strings.HasSuffix(blockId, "8") || strings.HasSuffix(blockId, "0") {
		res = "Mismatched"
	}

	return fmt.Sprintf("The query result for block [%s] is: %s", blockId, res), nil
}
