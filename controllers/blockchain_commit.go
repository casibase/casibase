package controllers

import (
	"github.com/casibase/casibase/object"
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
	data := c.GetString("data")
	funcName := c.GetString("funcName")
	contractName := c.GetString("contractName")
	provider := c.GetString("provider")

	
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
