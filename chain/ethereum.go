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
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/casibase/casibase/util"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

type EthereumClient struct {
	Client          *ethclient.Client
	PrivateKey      *ecdsa.PrivateKey
	FromAddress     common.Address
	ContractAddress common.Address
	ContractMethod  string
}

func removeHexPrefix(hexStr string) string {
	hexStr = strings.TrimSpace(hexStr)
	if len(hexStr) >= 2 && hexStr[:2] == "0x" {
		return hexStr[2:]
	}
	return hexStr
}

type ethereumUploadData struct {
	Key   string `json:"key"`
	Field string `json:"field"`
	Value string `json:"value"`
}

// newEthereumClient creates a new Ethereum client with the given parameters
// It connects to the Ethereum RPC, sets up the private key and contract address,
// and prepares the client for sending transactions and querying data.
func newEthereumClient(rpcURL, privateKeyHex, contractAddressHex, contractMethod string) (*EthereumClient, error) {
	privateKeyHex = removeHexPrefix(privateKeyHex)
	contractAddressHex = removeHexPrefix(contractAddressHex)

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum RPC: %v", err)
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %v", err)
	}
	fromAddr := crypto.PubkeyToAddress(privateKey.PublicKey)
	return &EthereumClient{
		Client:          client,
		PrivateKey:      privateKey,
		FromAddress:     fromAddr,
		ContractAddress: common.HexToAddress(contractAddressHex),
		ContractMethod:  contractMethod,
	}, nil
}

// Commit sends a transaction to the Ethereum network to invoke a contract method with the provided data.
func (client *EthereumClient) Commit(data string) (string, string, string, error) {
	nonce, err := client.Client.PendingNonceAt(context.Background(), client.FromAddress)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to get pending nonce: %v", err)
	}
	gasPrice, err := client.Client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", "", "", fmt.Errorf("failed to suggest gas price: %v", err)
	}
	value := big.NewInt(0)

	dataBytes, err := packFunctionData(client.ContractMethod, data)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to pack function data: %v", err)
	}

	msg := ethereum.CallMsg{
		From:     client.FromAddress,
		To:       &client.ContractAddress,
		GasPrice: gasPrice,
		Value:    value,
		Data:     dataBytes,
	}
	gasLimit, err := client.Client.EstimateGas(context.Background(), msg)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to estimate gas: %v", err)
	}

	tx := types.NewTransaction(nonce, client.ContractAddress, value, gasLimit, gasPrice, dataBytes)
	chainID, err := client.Client.ChainID(context.Background())
	if err != nil {
		return "", "", "", fmt.Errorf("failed to get chain ID: %v", err)
	}
	signedTx, err := types.SignTx(tx, types.LatestSignerForChainID(chainID), client.PrivateKey)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to sign transaction: %v", err)
	}
	err = client.Client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to send transaction: %v", err)
	}

	txHash := signedTx.Hash()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	receipt, err := bind.WaitMined(ctx, client.Client, signedTx)
	if err != nil {
		return "", "", "", fmt.Errorf("transaction failed to be mined: %v", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		result, err := client.Client.CallContract(context.Background(), msg, receipt.BlockNumber)
		revertReason := ""
		if err == nil && len(result) > 0 {
			if len(result) >= 4 {
				reason, err := abi.UnpackRevert(result)
				if err == nil {
					revertReason = reason
				} else {
					revertReason = fmt.Sprintf("revert reason ABI decode failed: %v", err)
				}
			} else {
				revertReason = fmt.Sprintf("raw revert data: %x", result)
			}
		} else if err != nil {
			revertReason = fmt.Sprintf("eth_call error: %v", err)
		}
		return "", "", "", fmt.Errorf("transaction failed with status: %d, reason: %s", receipt.Status, revertReason)
	}

	blockHash := receipt.BlockHash.Hex()
	blockNumber := receipt.BlockNumber.String()

	return blockNumber, txHash.Hex(), blockHash, nil
}

// Query retrieves the transaction receipt and decodes the event logs to get the data.
func (client *EthereumClient) Query(txHash string, data string) (string, error) {
	hash := common.HexToHash(txHash)

	receipt, err := client.Client.TransactionReceipt(context.Background(), hash)
	if err != nil {
		return "", fmt.Errorf("failed to get transaction receipt: %v", err)
	}
	blockId := receipt.BlockNumber.String()

	stringType, err := abi.NewType("string", "", nil)
	if err != nil {
		return "", fmt.Errorf("failed to create string type: %v", err)
	}
	arguments := abi.Arguments{
		{Type: stringType},
		{Type: stringType},
		{Type: stringType},
	}

	var events []string
	for _, log := range receipt.Logs {
		if len(log.Data) > 0 {
			eventData, err := arguments.Unpack(log.Data)
			if err != nil {
				return "", fmt.Errorf("failed to unpack event log: %v", err)
			}
			for _, v := range eventData {
				if str, ok := v.(string); ok {
					events = append(events, str)
				} else {
					return "", fmt.Errorf("event log value is not string: %v", v)
				}
			}
		}
	}

	if len(events) < 3 {
		return "", fmt.Errorf("not enough string events found in transaction logs, expected at least 3, got %d", len(events))
	}

	savedData := ethereumUploadData{
		Key:   events[0],
		Field: events[1],
		Value: events[2],
	}

	chainData := util.StructToJson(savedData)

	res := "Mismatched"
	if string(chainData) == data {
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

// packFunctionData encodes the call data for an Ethereum contract function that accepts a tuple of three strings.
// The 'method' parameter is the function name, and 'data' is a JSON string containing "key", "field", and "value".
// Steps:
//  1. Computes the function selector (first 4 bytes of Keccak256 hash of "method((string,string,string))").
//  2. Defines the tuple type with three string fields.
//  3. Packs the tuple using ABI encoding.
//  4. Concatenates the selector and encoded arguments to produce the final call data.
func packFunctionData(method, data string) ([]byte, error) {
	var uploadData ethereumUploadData
	if err := json.Unmarshal([]byte(data), &uploadData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	// 1. Get function selector first 4 bytes
	functionSelector := crypto.Keccak256([]byte(fmt.Sprintf("%s((string,string,string))", method)))[:4]

	// 2. Create Tuple type
	tupleType, err := abi.NewType("tuple", "", []abi.ArgumentMarshaling{
		{Name: "key", Type: "string"},
		{Name: "field", Type: "string"},
		{Name: "value", Type: "string"},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create tuple type: %v", err)
	}

	arguments := abi.Arguments{
		{Type: tupleType},
	}

	// 3. Encode parameters
	encodedArgs, err := arguments.Pack(uploadData)
	if err != nil {
		return nil, fmt.Errorf("failed to pack arguments: %v", err)
	}

	// 4. Combine function selector and encoded parameters
	callData := append(functionSelector, encodedArgs...)

	return callData, nil
}
