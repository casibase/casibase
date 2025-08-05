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

package chain

import (
	"fmt"
)

type ChainConfig struct {
	ChainId            string `json:"chain_id"`
	OrgId              string `json:"org_id"`
	AuthType           string `json:"auth_type"`
	UserKey            string `json:"user_key"`
	UserCert           string `json:"user_cert"`
	SignKey            string `json:"sign_key"`
	SignCert           string `json:"sign_cert"`
	NodeAddr           string `json:"node_addr"`
	ChainmakerEndpoint string `json:"chainmaker_endpoint"`
}

type ChainChainmakerClient struct {
	ChainConfig    *ChainConfig `json:"chain_config"`
	ContractName   string       `json:"contract_name"`
	ContractMethod string       `json:"contract_method"`
	Data           string       `json:"data"`
	TxId           string       `json:"txId"`
}

func newChainChainmakerClient(nodeAddr, authType, orgId, chainId, chainmakerEndpoint, UserKey, UserCert, SignKey, SignCert, ContractName, ContractMethod string) (*ChainChainmakerClient, error) {
	chainConfig := &ChainConfig{
		ChainId:            chainId,
		OrgId:              orgId,
		AuthType:           authType,
		UserKey:            UserKey,
		UserCert:           UserCert,
		SignKey:            SignKey,
		SignCert:           SignCert,
		NodeAddr:           nodeAddr,
		ChainmakerEndpoint: chainmakerEndpoint,
	}

	return &ChainChainmakerClient{
		ChainConfig:    chainConfig,
		ContractName:   ContractName,
		ContractMethod: ContractMethod,
	}, nil
}

func (client *ChainChainmakerClient) Commit(data string) (string, string, string, error) {
	client.Data = data
	response, err := SendChainmakerRequest(client, "invoke-contract")
	if err != nil {
		return "", "", "", err
	}

	return response.Block, response.TxId, response.BlockHash, nil
}

func (client *ChainChainmakerClient) Query(txId string, data string) (string, error) {
	client.TxId = txId
	queryResult, err := SendChainmakerRequest(client, "query-contract")
	if err != nil {
		return "", err
	}

	blockId := queryResult.Block
	chainData := queryResult.Result

	data, err = normalizeChainData(data)
	if err != nil {
		return "", err
	}

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
