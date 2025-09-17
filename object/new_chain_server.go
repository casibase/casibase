package object

import (
	"encoding/json"
	"fmt"
	"github.com/casibase/casibase/chain"
)

// CallBlockchainContract 通用区块链合约调用
// providerId: "owner/name" 格式，funcName: 合约方法名，contractName: 合约名，data: 传入的 json 字符串
func CallBlockchainContract(providerId, funcName, contractName, data string) (block, txId, blockHash string, err error) {
	// 查询 provider
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
	block, txId, blockHash, err = client.CommitWithMethodAndContractName(dataStr, funcName, contractName)
	if err != nil {
		return "", "", "", fmt.Errorf("调用区块链失败: %w", err)
	}
	return block, txId, blockHash, nil
}
