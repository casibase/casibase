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
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

type EthereumClient struct {
	Client      *ethclient.Client
	PrivateKey  *ecdsa.PrivateKey
	FromAddress common.Address
}

func newEthereumClient(rpcURL, privateKeyHex string) (*EthereumClient, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, err
	}
	fromAddr := crypto.PubkeyToAddress(privateKey.PublicKey)
	return &EthereumClient{
		Client:      client,
		PrivateKey:  privateKey,
		FromAddress: fromAddr,
	}, nil
}

func (client *EthereumClient) Commit(data string) (string, string, string, error) {
	nonce, err := client.Client.PendingNonceAt(context.Background(), client.FromAddress)
	if err != nil {
		return "", "", "", err
	}
	gasPrice, err := client.Client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", "", "", err
	}
	value := big.NewInt(0)
	dataBytes := []byte(data)

	msg := ethereum.CallMsg{
		From:     client.FromAddress,
		To:       &client.FromAddress,
		GasPrice: gasPrice,
		Value:    value,
		Data:     dataBytes,
	}

	gasLimit, err := client.Client.EstimateGas(context.Background(), msg)
	if err != nil {
		return "", "", "", err
	}
	toAddress := client.FromAddress

	tx := types.NewTransaction(nonce, toAddress, value, gasLimit, gasPrice, dataBytes)
	chainID, err := client.Client.ChainID(context.Background())
	if err != nil {
		return "", "", "", err
	}
	signedTx, err := types.SignTx(tx, types.LatestSignerForChainID(chainID), client.PrivateKey)
	if err != nil {
		return "", "", "", err
	}
	err = client.Client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", "", "", err
	}

	txHash := signedTx.Hash()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	receipt, err := bind.WaitMined(ctx, client.Client, signedTx)
	if err != nil {
		return "", "", "", fmt.Errorf("transaction failed to be mined: %v", err)
	}

	blockHash := receipt.BlockHash.Hex()
	blockNumber := receipt.BlockNumber.String()

	return blockNumber, txHash.Hex(), blockHash, nil
}

func (client *EthereumClient) Query(txHash string, data string) (string, error) {
	hash := common.HexToHash(txHash)

	receipt, err := client.Client.TransactionReceipt(context.Background(), hash)
	if err != nil {
		return "", err
	}
	blockId := receipt.BlockNumber.String()

	tx, _, err := client.Client.TransactionByHash(context.Background(), hash)
	if err != nil {
		return "", err
	}
	chainData := string(tx.Data())

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
