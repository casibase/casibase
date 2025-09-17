package controllers

import (
	"github.com/casibase/casibase/object"
	"encoding/json"
)

// SendChainCommit
// @Title SendChainCommit
// @Tag Chain API
// params
// - data
// - funcName
// - contractName
// - provider
// @Description send chain commit request
// @router /send-chain-commit [post]
func (c *ApiController) SendBlockchainCommit() {
	var chainConfig object.ChainConfig
	err := c.UnmarshalJson(&chainConfig)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	
	data := chainConfig.Data
	funcName := chainConfig.FuncName
	contractName := chainConfig.ContractName
	provider := chainConfig.Provider

	
	// 调用区块链合约
	block, txId, blockHash, err := object.CallBlockchainContract(provider, funcName, contractName, data)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	result := map[string]string{
		"block":     block,
		"txId":      txId,
		"blockHash": blockHash,
	}
	
	c.ResponseOk(result)
}
