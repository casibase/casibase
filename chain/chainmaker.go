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

	"chainmaker.org/chainmaker/pb-go/v2/common"
	cmnpb "chainmaker.org/chainmaker/pb-go/v2/common"
	chainmaker "chainmaker.org/chainmaker/sdk-go/v2"
)

type ChainChainmakerClient struct {
	ChainClient  *chainmaker.ChainClient
	ContractName string
}

func newChainChainmakerClient(contractName, authType, userKey, userCrt, userSignKey, userSignCrt, orgId, nodeAddr, caCert, TLSHostName, chainId string, useTLS bool) (*ChainChainmakerClient, error) {
	node := chainmaker.NewNodeConfig(
		chainmaker.WithNodeAddr(nodeAddr),
		chainmaker.WithNodeConnCnt(10),
		chainmaker.WithNodeUseTLS(useTLS),
		chainmaker.WithNodeCACerts([]string{caCert}),
		chainmaker.WithNodeTLSHostName(TLSHostName),
	)

	chainClient, err := chainmaker.NewChainClient(
		chainmaker.WithChainClientOrgId(orgId),
		chainmaker.WithChainClientChainId(chainId),
		chainmaker.WithUserKeyBytes([]byte(userKey)),
		chainmaker.WithUserCrtBytes([]byte(userCrt)),
		chainmaker.WithUserSignKeyBytes([]byte(userSignKey)),
		chainmaker.WithUserSignCrtBytes([]byte(userSignCrt)),
		chainmaker.AddChainClientNodeConfig(node),
		chainmaker.WithPkcs11Config(&chainmaker.Pkcs11Config{
			Enabled: false,
		}),
		chainmaker.WithAuthType(authType),
	)
	if err != nil {
		return nil, err
	}
	err = chainClient.EnableCertHash()
	if err != nil {
		return nil, err
	}

	return &ChainChainmakerClient{
		ChainClient:  chainClient,
		ContractName: contractName,
	}, nil
}

func (client *ChainChainmakerClient) Commit(data string) (string, string, error) {
	kvPairs := []*common.KeyValuePair{
		{
			Key:   "data",
			Value: []byte(data),
		},
	}

	resp, err := client.ChainClient.InvokeContract(client.ContractName, "save", "", kvPairs, -1, true)
	if err != nil {
		return "", "", err
	}

	if resp.Code != cmnpb.TxStatusCode_SUCCESS {
		return "", "", fmt.Errorf("invoke contract failed, [code:%d]/[msg:%s]", resp.Code, resp.Message)
	}

	txId := resp.TxId
	result := string(resp.ContractResult.Result)

	return txId, result, nil
}

func (client *ChainChainmakerClient) Query(blockId string, data string) (string, error) {
	return "", nil
}
