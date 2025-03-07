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

package object

import (
	"fmt"

	"github.com/casibase/casibase/chain"
	"github.com/casibase/casibase/util"
)

type Param struct {
	Key   string `json:"key"`
	Field string `json:"field"`
	Value string `json:"value"`
}

func (record *Record) getRecordProvider() (*Provider, error) {
	if record.Provider != "" {
		provider, err := getProvider("admin", record.Provider)
		if err != nil {
			return nil, err
		}

		if provider != nil {
			return provider, nil
		}
	}

	provider, err := getActiveBlockchainProvider("admin")
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (record *Record) getRecordChainClient() (chain.ChainClientInterface, error) {
	provider, err := record.getRecordProvider()
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf("there is no active blockchain provider")
	}

	client, err2 := chain.NewChainClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region, provider.Network, provider.Chain)
	if err2 != nil {
		return nil, err2
	}

	return client, nil
}

func (record *Record) toMap() map[string]string {
	result := map[string]string{}

	result["id"] = fmt.Sprintf("%d", record.Id)
	result["owner"] = record.Owner
	result["name"] = record.Name
	result["createdTime"] = record.CreatedTime

	result["organization"] = record.Organization
	result["clientIp"] = record.ClientIp
	result["user"] = record.User
	result["method"] = record.Method
	result["requestUri"] = record.RequestUri
	result["action"] = record.Action
	result["language"] = record.Language

	result["object"] = record.Object
	result["response"] = record.Response

	result["provider"] = record.Provider
	result["block"] = record.Block
	result["isTriggered"] = fmt.Sprintf("%t", record.IsTriggered)

	return result
}

func (record *Record) toParam() string {
	record2 := *record
	record2.Block = ""
	record2.Transaction = ""

	res := Param{
		Key:   record2.getId(),
		Field: "Record",
		Value: util.StructToJson(record2),
	}
	return util.StructToJson(res)
}

func CommitRecord(record *Record) (bool, error) {
	if record.Block != "" {
		return false, fmt.Errorf("the record: %s has already been committed, blockId = %s", record.getId(), record.Block)
	}

	client, err := record.getRecordChainClient()
	if err != nil {
		return false, err
	}

	blockId, transactionId, err := client.Commit(record.toParam())
	if err != nil {
		return false, err
	}

	record.Block = blockId
	record.Transaction = transactionId
	return UpdateRecord(record.getId(), record)
}

func QueryRecord(id string) (string, error) {
	record, err := GetRecord(id)
	if err != nil {
		return "", err
	}
	if record == nil {
		return "", fmt.Errorf("the record: %s does not exist", id)
	}

	if record.Block == "" {
		return "", fmt.Errorf("the record: %s's block ID should not be empty", record.getId())
	}

	client, err := record.getRecordChainClient()
	if err != nil {
		return "", err
	}

	res, err := client.Query(record.Transaction, record.toParam())
	if err != nil {
		return "", err
	}

	return res, nil
}
