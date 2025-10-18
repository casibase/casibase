package object

import (
	"encoding/json"
	"fmt"
	"github.com/casibase/casibase/chain"
)

// 定义chainConfig结构体
/**
{
    "provider": "casbin/tencent",
    "contractName": "111",
    "funcName": "11",
    "data": "2222"
}
*/
type ChainConfig struct {
	Provider     string `json:"provider"`
	ContractName string `json:"contractName"`
	FuncName     string `json:"funcName"`
	Data         string `json:"data"`
}

// CallBlockchainContract 通用区块链合约调用
// providerId: "owner/name" 格式，funcName: 合约方法名，contractName: 合约名，data: 传入的 json 字符串
func CallBlockchainContract(providerId, funcName, contractName, data, lang string) (block, txId, blockHash string, err error) {
	// 查询 provider
	// 打印
	fmt.Println("providerId:", providerId)
	provider, err := GetProvider(providerId)
	if err != nil {
		return "", "", "", fmt.Errorf("GetProvider failed: %w", err)
	}
	if provider == nil {
		return "", "", "", fmt.Errorf("provider not found: %s", providerId)
	}
	// 检查provider的

	// 创建链客户端
	client, err := chain.NewChainClient(
		provider.Type,
		provider.ClientId,
		provider.ClientSecret,
		provider.Region,
		provider.Network,
		provider.Chain,
		provider.ProviderUrl,
		provider.Text,
		provider.UserKey,
		provider.UserCert,
		provider.SignKey,
		provider.SignCert,
		contractName,
		funcName,
		lang,
	)
	if err != nil {
		return "", "", "", fmt.Errorf("初始化链信息错误: %w", err)
	}

	// data 必须为 json 字符串，部分链要求参数为 json
	var dataStr string
	if json.Valid([]byte(data)) {
		dataStr = data
	} else {
		// 尝试序列化为 json
		b, err := json.Marshal(data)
		if err != nil {
			return "", "", "", fmt.Errorf("上链数据非JSON格式，请检查: %w", err)
		}
		dataStr = string(b)
	}

	// 调用区块链合约
	block, txId, blockHash, err = client.CommitWithMethodAndContractName(dataStr, funcName, contractName, lang)
	if err != nil {
		return "", "", "", fmt.Errorf("调用区块链失败: %w", err)
	}
	return block, txId, blockHash, nil
}


func QueryBlockchainContract(providerId, funcName, contractName, data, lang string) (res, msg string, err error) {
	// 查询 provider
	// 打印
	fmt.Println("providerId:", providerId)
	provider, err := GetProvider(providerId)
	if err != nil {
		return "","", fmt.Errorf("GetProvider failed: %w", err)
	}
	if provider == nil {
		return "", "", fmt.Errorf("provider not found: %s", providerId)
	}
	// 检查provider的

	// 创建链客户端
	client, err := chain.NewChainClient(
		provider.Type,
		provider.ClientId,
		provider.ClientSecret,
		provider.Region,
		provider.Network,
		provider.Chain,
		provider.ProviderUrl,
		provider.Text,
		provider.UserKey,
		provider.UserCert,
		provider.SignKey,
		provider.SignCert,
		contractName,
		funcName,
		lang,
	)
	if err != nil {
		return "", "", fmt.Errorf("初始化链信息错误: %w", err)
	}

	// data 必须为 json 字符串，部分链要求参数为 json
	var dataStr string
	if json.Valid([]byte(data)) {
		dataStr = data
	} else {
		// 尝试序列化为 json
		b, err := json.Marshal(data)
		if err != nil {
			return res, msg, fmt.Errorf("查询数据非JSON格式，请检查: %w", err)
		}
		dataStr = string(b)
	}

	// 调用区块链合约
	res, msg, err = client.QueryWithMethodAndContractName(dataStr, funcName, contractName,lang)
	if err != nil {
		return res, msg,  fmt.Errorf("调用查询区块链失败: %w", err)
	}
	return res, msg, nil
}

