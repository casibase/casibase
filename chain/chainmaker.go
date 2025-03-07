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

import (
	"fmt"

	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	tbaas "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/tbaas/v20180416"
)

type ChainTencentChainmakerClient struct {
	ClientId     string
	ClientSecret string
	Region       string
	NetworkId    string
	ChainId      string
	Client       *tbaas.Client
}

func newChainTencentChainmakerClient(clientId, clientSecret, region, networkId, chainId string) (*ChainTencentChainmakerClient, error) {
	credential := common.NewCredential(clientId, clientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.Endpoint = "tbaas.tencentcloudapi.com"

	client, err := tbaas.NewClient(credential, region, cpf)
	if err != nil {
		return nil, fmt.Errorf("newChainTencentChainmakerClient() error: %v", err)
	}

	return &ChainTencentChainmakerClient{
		ClientId:     clientId,
		ClientSecret: clientSecret,
		Region:       region,
		NetworkId:    networkId,
		ChainId:      chainId,
		Client:       client,
	}, nil
}

func (client *ChainTencentChainmakerClient) Commit(data string) (string, string, error) {
	request := tbaas.NewInvokeRequest()
	request.Module = common.StringPtr("transaction")
	request.Operation = common.StringPtr("invoke")
	request.ClusterId = common.StringPtr(client.NetworkId)
	request.ChaincodeName = common.StringPtr("ChainMakerDemo")
	request.ChannelName = common.StringPtr(client.ChainId)
	request.Peers = []*tbaas.PeerSet{
		{OrgName: common.StringPtr("orgbeijing.chainmaker-demo"), PeerName: common.StringPtr("consensus1-orgbeijing.chainmaker-demo")},
	}
	request.FuncName = common.StringPtr("save")
	request.GroupName = common.StringPtr("orgbeijing.chainmaker-demo")
	// request.Args = []*string{common.StringPtr(data["arg1"]), common.StringPtr(data["arg2"])}
	request.Args = []*string{common.StringPtr(data)}

	response, err := client.Client.Invoke(request)
	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return "", "", fmt.Errorf("TencentCloudSDKError: %v", sdkErr)
		}

		return "", "", fmt.Errorf("ChainTencentChainmakerClient.Client.Invoke() error: %v", err)
	}

	return response.ToJsonString(), "", nil
}

func (client ChainTencentChainmakerClient) Query(blockId string, data string) (string, error) {
	return "", nil
	//// simulate the situation that error occurs
	//if strings.HasSuffix(data["id"], "0") {
	//	return "", fmt.Errorf("some error occurred in the ChainTencentChainmakerClient::Commit operation")
	//}
	//
	//// Query the data from the blockchain
	//// Write some code... (if error occurred, handle it as above)
	//
	//// assume the chain data are retrieved from the blockchain, here we just generate it statically
	//chainData := map[string]string{"organization": "casbin"}
	//
	//// Check if the data are matched with the chain data
	//res := "Matched"
	//if chainData["organization"] != data["organization"] {
	//	res = "Mismatched"
	//}
	//
	//// simulate the situation that mismatch occurs
	//if strings.HasSuffix(blockId, "2") || strings.HasSuffix(blockId, "4") || strings.HasSuffix(blockId, "6") || strings.HasSuffix(blockId, "8") || strings.HasSuffix(blockId, "0") {
	//	res = "Mismatched"
	//}
	//
	//return fmt.Sprintf("The query result for block [%s] is: %s", blockId, res), nil
}
