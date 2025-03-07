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
	"strconv"

	"github.com/casibase/casibase/util"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	tbaas "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/tbaas/v20180416"
)

type ChainTencentChainmakerDemoClient struct {
	ClientId     string
	ClientSecret string
	Region       string
	NetworkId    string
	ChainId      string
	Client       *tbaas.Client
}

func newChainTencentChainmakerDemoClient(clientId, clientSecret, region, networkId, chainId string) (*ChainTencentChainmakerDemoClient, error) {
	credential := common.NewCredential(clientId, clientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.Endpoint = "tbaas.tencentcloudapi.com"

	client, err := tbaas.NewClient(credential, region, cpf)
	if err != nil {
		return nil, fmt.Errorf("newChainTencentChainmakerClient() error: %v", err)
	}

	return &ChainTencentChainmakerDemoClient{
		ClientId:     clientId,
		ClientSecret: clientSecret,
		Region:       region,
		NetworkId:    networkId,
		ChainId:      chainId,
		Client:       client,
	}, nil
}

func (client ChainTencentChainmakerDemoClient) getQueryResult(txId string) (*tbaas.ChainMakerTransactionResult, error) {
	request := tbaas.NewQueryChainMakerDemoTransactionRequest()
	request.ClusterId = common.StringPtr(client.NetworkId)
	request.ChainId = common.StringPtr(client.ChainId)
	request.TxID = common.StringPtr(txId)

	response, err := client.Client.QueryChainMakerDemoTransaction(request)
	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return nil, fmt.Errorf("TencentCloudSDKError: %v", sdkErr)
		}

		return nil, fmt.Errorf("ChainTencentChainmakerDemoClient.Client.InvokeChainMakerDemoContract() error: %v", err)
	}
	if *(response.Response.Result.Code) != 0 {
		return nil, fmt.Errorf("TencentCloudSDKError, code = %d, message = %s", *(response.Response.Result.Code), *(response.Response.Result.Message))
	}

	return response.Response.Result, nil
}

func (client *ChainTencentChainmakerDemoClient) Commit(data string) (string, string, error) {
	request := tbaas.NewInvokeChainMakerDemoContractRequest()
	request.ClusterId = common.StringPtr(client.NetworkId)
	request.ChainId = common.StringPtr(client.ChainId)
	request.ContractName = common.StringPtr("ChainMakerDemo")
	request.FuncName = common.StringPtr("save")
	request.FuncParam = common.StringPtr(data)

	response, err := client.Client.InvokeChainMakerDemoContract(request)
	if err != nil {
		if sdkErr, ok := err.(*errors.TencentCloudSDKError); ok {
			return "", "", fmt.Errorf("TencentCloudSDKError: %v", sdkErr)
		}

		return "", "", fmt.Errorf("ChainTencentChainmakerDemoClient.Client.InvokeChainMakerDemoContract() error: %v", err)
	}
	if *(response.Response.Result.Code) != 0 {
		return "", "", fmt.Errorf("TencentCloudSDKError, code = %d, message = %s", *(response.Response.Result.Code), *(response.Response.Result.Message))
	}

	txId := *(response.Response.Result.TxId)

	queryResult, err := client.getQueryResult(txId)
	if err != nil {
		return "", "", err
	}

	blockId := strconv.FormatInt(*(queryResult.BlockHeight), 10)
	return blockId, txId, nil
}

func (client ChainTencentChainmakerDemoClient) Query(txId string, data string) (string, error) {
	queryResult, err := client.getQueryResult(txId)
	if err != nil {
		return "", err
	}

	blockId := strconv.FormatInt(*(queryResult.BlockHeight), 10)

	type ContractEvent struct {
		ContractName    string   `json:"contract_name"`
		ContractVersion string   `json:"contract_version"`
		EventData       []string `json:"event_data"`
		Topic           string   `json:"topic"`
		TxId            string   `json:"tx_id"`
	}

	contractEvents := []ContractEvent{}
	err = util.JsonToStruct(*(queryResult.ContractEvent), &contractEvents)
	if err != nil {
		return "", err
	}

	type Param struct {
		Key   string `json:"key"`
		Field string `json:"field"`
		Value string `json:"value"`
	}

	key := contractEvents[0].EventData[0]
	field := contractEvents[0].EventData[1]
	value := contractEvents[0].EventData[2]
	param := Param{Key: key, Field: field, Value: value}
	chainData := util.StructToJson(param)

	res := "Mismatched"
	if chainData == data {
		res = fmt.Sprintf(`Matched
******************************************************
Data:

%s`, chainData)
	} else {
		res = fmt.Sprintf(`Mismatched
******************************************************
Chain data:

%s
******************************************************
Local data:

%s`, chainData, data)
	}

	return fmt.Sprintf("The query result for block [%s] is: %s", blockId, res), nil
}
