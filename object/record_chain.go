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
	"sync"
	"time"

	"github.com/casibase/casibase/chain"
	"github.com/casibase/casibase/util"
)

type Param struct {
	Key   string `json:"key"`
	Field string `json:"field"`
	Value string `json:"value"`
}

// Global variables for commit task
var (
	eventTaskChan  chan []string
	commitTaskOnce sync.Once
)

func (record *Record) getRecordProvider(chainProvider string) (*Provider, error) {
	if chainProvider != "" {
		provider, err := getProvider("admin", chainProvider)
		if err != nil {
			return nil, err
		}

		if provider == nil {
			return nil, fmt.Errorf("the blockchain provider: %s is not found", chainProvider)
		}

		return provider, nil
	}

	provider, err := GetActiveBlockchainProvider("admin")
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (record *Record) getRecordChainClient(chainProvider string) (chain.ChainClientInterface, *Provider, error) {
	provider, err := record.getRecordProvider(chainProvider)
	if err != nil {
		return nil, nil, err
	}
	if provider == nil {
		return nil, nil, fmt.Errorf("there is no active blockchain provider")
	}

	client, err := chain.NewChainClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region, provider.Network, provider.Chain, provider.ProviderUrl, provider.Text, provider.UserKey, provider.UserCert, provider.SignKey, provider.SignCert, provider.ContractName, provider.ContractMethod)
	if err != nil {
		return nil, nil, err
	}

	return client, provider, nil
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
	record2.Provider = ""
	record2.Block = ""
	record2.Transaction = ""
	record2.BlockHash = ""
	record2.Provider2 = ""
	record2.Block2 = ""
	record2.Transaction2 = ""
	record2.BlockHash2 = ""

	res := Param{
		Key:   record2.getId(),
		Field: "Record",
		Value: util.StructToJson(record2),
	}
	return util.StructToJson(res)
}

func CommitRecord(record *Record) (bool, map[string]interface{}, error) {
	if record.Block != "" {
		return false, nil, fmt.Errorf("the record: %s has already been committed, blockId = %s", record.getId(), record.Block)
	}

	client, provider, err := record.getRecordChainClient(record.Provider)
	if err != nil {
		return false, nil, err
	}
	record.Provider = provider.Name

	blockId, transactionId, blockHash, err := client.Commit(record.toParam())
	if err != nil {
		return false, nil, err
	}

	data := map[string]interface{}{
		"provider":    record.Provider,
		"block":       blockId,
		"transaction": transactionId,
		"block_hash":  blockHash,
	}

	// Update the record fields to avoid concurrent update race conditions
	affected, err := UpdateRecordFields(record.getId(), data)
	return affected, data, err
}

func CommitRecordSecond(record *Record) (bool, error) {
	if record.Block2 != "" {
		return false, fmt.Errorf("the record: %s has already been committed, blockId = %s", record.getId(), record.Block2)
	}

	client, provider, err := record.getRecordChainClient(record.Provider2)
	if err != nil {
		return false, err
	}
	record.Provider2 = provider.Name

	blockId, transactionId, blockHash, err := client.Commit(record.toParam())
	if err != nil {
		return false, err
	}

	// Update the record fields to avoid concurrent update race conditions
	return UpdateRecordFields(record.getId(), map[string]interface{}{
		"provider2":    record.Provider2,
		"block2":       blockId,
		"transaction2": transactionId,
		"block_hash2":  blockHash,
	})
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

	client, _, err := record.getRecordChainClient(record.Provider)
	if err != nil {
		return "", err
	}

	res, err := client.Query(record.Transaction, record.toParam())
	if err != nil {
		return "", err
	}

	return res, nil
}

func QueryRecordSecond(id string) (string, error) {
	record, err := GetRecord(id)
	if err != nil {
		return "", err
	}
	if record == nil {
		return "", fmt.Errorf("the record: %s does not exist", id)
	}

	if record.Block2 == "" {
		return "", fmt.Errorf("the record: %s's block ID should not be empty", record.getId())
	}

	client, _, err := record.getRecordChainClient(record.Provider2)
	if err != nil {
		return "", err
	}

	res, err := client.Query(record.Transaction2, record.toParam())
	if err != nil {
		return "", err
	}

	return res, nil
}

// BatchCommitRecords commits multiple records in a batch.
func BatchCommitRecords(recordIds []string) (bool, error) {
	if len(recordIds) == 0 {
		return false, nil
	}

	var errors []string

	for _, recordId := range recordIds {
		// Get the record by ID
		record, err := getRecord(util.GetOwnerAndNameFromId(recordId))
		if err != nil {
			errors = append(errors, fmt.Sprintf("failed to get record %s: %v", recordId, err))
			continue
		}
		if record == nil {
			errors = append(errors, fmt.Sprintf("failed to get record %s: not exist", recordId))
			continue
		}

		// Commit the record
		if _, _, err := CommitRecord(record); err != nil {
			errors = append(errors, err.Error())
			continue
		}
	}

	if len(errors) > 0 {
		return false, fmt.Errorf("failed to commit %d/%d records: %v", len(errors), len(recordIds), errors)
	}

	return true, nil
}

// ScanNeedCommitRecords scans the database table for records that
// need to be committed but have not yet been committed.
func ScanNeedCommitRecords() (bool, error) {
	records := []*Record{}
	err := adapter.engine.Where("need_commit = ? AND block = ?", true, "").Asc("id").Find(&records)
	if err != nil {
		return false, fmt.Errorf("failed to scan records that need to be committed: %v", err)
	}

	if len(records) == 0 {
		return true, nil
	}

	var errors []string

	for _, record := range records {
		if _, _, err := CommitRecord(record); err != nil {
			errors = append(errors, err.Error())
		}
	}

	if len(errors) > 0 {
		return false, fmt.Errorf("failed to commit %d/%d records: %v", len(errors), len(records), errors)
	}

	return true, nil
}

func InitCommitRecordsTask() {
	commitTaskOnce.Do(func() {
		// Initialize channels
		eventTaskChan = make(chan []string, 100)

		go func() {
			// Create timer for first execution
			timer := time.NewTimer(5 * time.Minute)
			defer timer.Stop()

			for {
				select {
				case <-timer.C:
					// Execute the periodic task to scan and commit records
					if _, err := ScanNeedCommitRecords(); err != nil {
						fmt.Printf("Error scanning records: %v\n", err)
					}

					// Reset timer for next execution
					timer.Reset(5 * time.Minute)

				case recordIds := <-eventTaskChan:
					// Execute the event task to commit records
					if _, err := BatchCommitRecords(recordIds); err != nil {
						fmt.Printf("Error in event task: %v\n", err)
					}
				}
			}
		}()
	})
}
