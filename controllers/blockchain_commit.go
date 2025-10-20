package controllers

import (
	"github.com/casibase/casibase/object"
	"encoding/json"
	"encoding/base64"
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
// @router /send-blockchain-commit [post]
func (c *ApiController) SendBlockchainCommit() {
	var chainConfig object.ChainConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chainConfig)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	
	data := chainConfig.Data
	funcName := chainConfig.FuncName
	contractName := chainConfig.ContractName
	provider := chainConfig.Provider

	// 获取语言
	lang := c.GetAcceptLanguage()
	if lang == "" {
		lang = "zh"
	}		

	
	// 调用区块链合约
	block, txId, blockHash, err := object.CallBlockchainContract(provider, funcName, contractName, data, lang)
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

// QueryBlockchainCommit
// @Title QueryBlockchainCommit
// @Tag Chain API
// params
// - data
// - funcName
// - contractName
// - provider
// @Description query chain commit request
// @router /query-blockchain-commit [post]
func (c *ApiController) QueryBlockchainCommit() {
	var chainConfig object.ChainConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chainConfig)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	
	data := chainConfig.Data
	funcName := chainConfig.FuncName
	contractName := chainConfig.ContractName
	provider := chainConfig.Provider

	// 获取语言
	lang := c.GetAcceptLanguage()
	if lang == "" {
		lang = "zh-CN"
	}
	
	// 调用区块链合约
	res, msg,err := object.QueryBlockchainContract(provider, funcName, contractName, data, lang)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

       resultDecoded, _ := base64.StdEncoding.DecodeString(res)

       result := map[string]string{
	       "result": res,
	       "msg":    msg,
	       "resultDecoded": string(resultDecoded),
       }
       
       c.ResponseOk(result)
}
