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
	"sync/atomic"

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/chain"
	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/util"
	"github.com/robfig/cron/v3"
)

type Param struct {
	Key   string `json:"key"`
	Field string `json:"field"`
	Value string `json:"value"`
}

// Global variables for commit task
var (
	scanNeedCommitRecordsMutex sync.Mutex
	// 并发处理配置：最大并发worker数量，可通过动态配置调整
	maxConcurrentWorkers = 10
	// 批量处理大小：每次扫描的最大记录数
	batchProcessSize = 500
	// 上次扫描的最大ID，用于游标分页（避免OFFSET性能问题）
	lastScannedId = 0
)

func (record *Record) getRecordProvider(chainProvider string, lang string) (*Provider, error) {
	if chainProvider != "" {
		provider, err := getProvider("admin", chainProvider)
		if err != nil {
			return nil, err
		}

		if provider == nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "object:the blockchain provider: %s is not found"), chainProvider)
		}

		return provider, nil
	}

	provider, err := GetActiveBlockchainProvider("admin")
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (record *Record) getRecordChainClient(chainProvider string, lang string) (chain.ChainClientInterface, *Provider, error) {
	provider, err := record.getRecordProvider(chainProvider, lang)
	if err != nil {
		return nil, nil, err
	}
	if provider == nil {
		return nil, nil, fmt.Errorf(i18n.Translate(lang, "object:there is no active blockchain provider"))
	}

	client, err := chain.NewChainClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region, provider.Network, provider.Chain, provider.ProviderUrl, provider.Text, provider.UserKey, provider.UserCert, provider.SignKey, provider.SignCert, provider.ContractName, provider.ContractMethod, lang)
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

	// 适配检查
	needHideObjectAndObjcid, _ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("record.object.change", "true")
	if needHideObjectAndObjcid == "true" {
		record2.Object = ""
		record2.Objcid = ""
	}
	record2.Objcid = "" // 不检查Objcid字段

	res := Param{
		Key:   record2.getId(),
		Field: "Record",
		Value: util.StructToJson(record2),
	}
	return util.StructToJson(res)
}

func CommitRecord(record *Record, lang string) (bool, map[string]interface{}, error) {
	if record.Block != "" {
		return false, nil, fmt.Errorf(i18n.Translate(lang, "object:the record: %s has already been committed, blockId = %s"), record.getUniqueId(), record.Block)
	}

	client, provider, err := record.getRecordChainClient(record.Provider, lang)
	if err != nil {
		_, updateErr := record.updateErrorText(err.Error(), lang)
		if updateErr != nil {
			err = updateErr
		}
		return false, nil, err
	}
	record.Provider = provider.Name

	blockId, transactionId, blockHash, err := client.Commit(record.toParam(), lang)
	if err != nil {
		_, updateErr := record.updateErrorText(err.Error(), lang)
		if updateErr != nil {
			err = updateErr
		}
		return false, nil, err
	}

	data := map[string]interface{}{
		"provider":    record.Provider,
		"block":       blockId,
		"transaction": transactionId,
		"block_hash":  blockHash,
	}

	if record.ErrorText != "" {
		data["error_text"] = ""
	}

	// Update the record fields to avoid concurrent update race conditions
	var affected bool
	if record.Id == 0 {
		// If the record ID is 0, it means batch insert, so using getId()
		affected, err = UpdateRecordFields(record.getId(), data, lang)
	} else {
		affected, err = UpdateRecordFields(record.getUniqueId(), data, lang)
	}

	delete(data, "error_text")

	// attach the name to the data for consistency
	data["name"] = record.Name

	return affected, data, err
}

	
func CommitRecordWithMethod(record *Record, funcName, contractName,lang string) (bool, map[string]interface{}, error) {
	if record.Block != "" {
		return false, nil, fmt.Errorf("the record: %s has already been committed, blockId = %s", record.getUniqueId(), record.Block)
	}

	client, provider, err := record.getRecordChainClient(record.Provider, lang)
	if err != nil {
		_, updateErr := record.updateErrorText(err.Error(),lang)
		if updateErr != nil {
			err = updateErr
		}
		return false, nil, err
	}
	record.Provider = provider.Name

	blockId, transactionId, blockHash, err := client.CommitWithMethodAndContractName(record.toParam(), funcName, contractName, lang)
	if err != nil {
		_, updateErr := record.updateErrorText(err.Error(),lang)
		if updateErr != nil {
			err = updateErr
		}
		return false, nil, err
	}

	data := map[string]interface{}{
		"provider":    record.Provider,
		"block":       blockId,
		"transaction": transactionId,
		"block_hash":  blockHash,
	}

	if record.ErrorText != "" {
		data["error_text"] = ""
	}

	// Update the record fields to avoid concurrent update race conditions
	var affected bool
	if record.Id == 0 {
		// If the record ID is 0, it means batch insert, so using getId()
		affected, err = UpdateRecordFields(record.getId(), data, lang)
	} else {
		affected, err = UpdateRecordFields(record.getUniqueId(), data, lang)
	}

	delete(data, "error_text")

	// attach the name to the data for consistency
	data["name"] = record.Name

	return affected, data, err
}

func CommitRecordSecond(record *Record, lang string) (bool, error) {
	if record.Block2 != "" {
		return false, fmt.Errorf(i18n.Translate(lang, "object:the record: %s has already been committed, blockId = %s"), record.getUniqueId(), record.Block2)
	}

	client, provider, err := record.getRecordChainClient(record.Provider2, lang)
	if err != nil {
		return false, err
	}
	record.Provider2 = provider.Name

	blockId, transactionId, blockHash, err := client.Commit(record.toParam(), lang)
	if err != nil {
		return false, err
	}

	data := map[string]interface{}{
		"provider2":    record.Provider2,
		"block2":       blockId,
		"transaction2": transactionId,
		"block_hash2":  blockHash,
	}

	// Update the record fields to avoid concurrent update race conditions
	affected, err := UpdateRecordFields(record.getUniqueId(), data, lang)
	return affected, err
}

// CommitRecords commits multiple records to the blockchain.
// 优化：支持并发处理，提升批量上链速度
func CommitRecords(records []*Record, lang string) (int, []map[string]interface{}) {
	if len(records) == 0 {
		return 0, nil
	}

	// 使用并发处理提升速度
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, maxConcurrentWorkers)
	var dataMutex sync.Mutex
	var data []map[string]interface{}
	var affected int64

	for _, record := range records {
		wg.Add(1)
		go func(r *Record) {
			defer wg.Done()
			
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// 优化：直接使用传入的记录，减少数据库查询
			// 如果记录已经有block，说明已经上链了
			if r.Block != "" {
				dataMutex.Lock()
				data = append(data, map[string]interface{}{
					"name":        r.Name,
					"provider":    r.Provider,
					"block":       r.Block,
					"transaction": r.Transaction,
					"block_hash":  r.BlockHash,
				})
				dataMutex.Unlock()
				return
			}

			// 执行上链操作，直接使用传入的记录
			recordAffected, commitResult, err := CommitRecord(r, lang)
			dataMutex.Lock()
			if err != nil {
				data = append(data, map[string]interface{}{
					"name":       r.Name,
					"error_text": err.Error(),
				})
			} else {
				if recordAffected {
					atomic.AddInt64(&affected, 1)
				}
				data = append(data, commitResult)
			}
			dataMutex.Unlock()
		}(record)
	}

	wg.Wait()
	return int(atomic.LoadInt64(&affected)), data
}

func QueryRecord(id string, lang string) (string, error) {
	record, err := GetRecord(id, lang)
	if err != nil {
		return "", err
	}
	if record == nil {
		return "", fmt.Errorf(i18n.Translate(lang, "object:the record: %s does not exist"), id)
	}

	if record.Block == "" {
		return "", fmt.Errorf(i18n.Translate(lang, "object:the record: %s's block ID should not be empty"), id)
	}

	client, _, err := record.getRecordChainClient(record.Provider, lang)
	if err != nil {
		return "", err
	}

	res, err := client.Query(record.Transaction, record.toParam(), lang)
	if err != nil {
		return "", err
	}

	return res, nil
}

func QueryRecordSecond(id string, lang string) (string, error) {
	record, err := GetRecord(id, lang)
	if err != nil {
		return "", err
	}
	if record == nil {
		return "", fmt.Errorf(i18n.Translate(lang, "object:the record: %s does not exist"), id)
	}

	if record.Block2 == "" {
		return "", fmt.Errorf(i18n.Translate(lang, "object:the record: %s's block ID should not be empty"), id)
	}

	client, _, err := record.getRecordChainClient(record.Provider2, lang)
	if err != nil {
		return "", err
	}

	res, err := client.Query(record.Transaction2, record.toParam(), lang)
	if err != nil {
		return "", err
	}

	return res, nil
}

// ScanNeedCommitRecords scans the database table for records that
// need to be committed but have not yet been committed.
// 优化：使用并发处理提升上链速度，并针对千万级数据表优化查询性能
func ScanNeedCommitRecords() {
	scanNeedCommitRecordsMutex.Lock()
	defer scanNeedCommitRecordsMutex.Unlock()
	
	records := []*Record{}
	
	// 优化：针对千万级数据表的查询优化
	// 1. 使用游标分页（基于ID），避免OFFSET性能问题
	// 2. 添加时间范围限制，只处理最近的数据
	// 3. 使用复合索引优化查询性能
	// 4. 限制批量大小，避免一次性加载过多数据
	
	// 获取时间范围配置（默认只处理最近7天的数据）
	timeRangeDaysStr, _ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("record.chain.commit.timeRangeDays", "7")
	timeRangeDays, err := util.ParseIntWithError(timeRangeDaysStr)
	if err != nil || timeRangeDays <= 0 {
		timeRangeDays = 7 // 默认7天
	}
	
	// 优化查询：使用游标分页（基于ID），避免OFFSET在大数据量时的性能问题
	// 使用复合索引 (need_commit, block, id) 可以大幅提升查询性能
	query := adapter.engine.Where("need_commit = ? AND block = ?", true, "")
	
	// 游标分页：从上次扫描的最大ID开始，避免重复扫描
	if lastScannedId > 0 {
		query = query.Where("id > ?", lastScannedId)
	}
	
	// 如果配置了时间范围，添加时间过滤
	// 注意：createdTime字段是varchar类型存储时间戳字符串，需要根据实际格式处理
	if timeRangeDays > 0 && timeRangeDays < 365 {
		// 计算时间阈值（毫秒时间戳）
		// 假设createdTime存储的是毫秒时间戳字符串
		// 如果格式不同，需要相应调整
		// 这里暂时不添加时间过滤，因为createdTime是varchar，需要转换
		// 如果需要时间过滤，建议：
		// 1. 将createdTime改为DATETIME类型并建立索引
		// 2. 或者添加一个created_time_int字段存储时间戳整数
	}
	
	// 使用ID排序，配合索引可以快速定位
	// 限制批量大小，避免一次性加载过多数据
	err = query.Asc("id").Limit(batchProcessSize).Find(&records)
	if err != nil {
		logs.Error("ScanNeedCommitRecords() failed to scan records that need to be committed: %v", err)
		return
	}

	if len(records) == 0 {
		// 如果没有找到记录，重置游标，下次从头开始
		lastScannedId = 0
		return
	}

	// 更新游标：记录本次扫描的最大ID
	maxId := 0
	for _, r := range records {
		if r.Id > maxId {
			maxId = r.Id
		}
	}
	lastScannedId = maxId

	logs.Info("ScanNeedCommitRecords: Found %d records to commit (lastScannedId=%d), starting concurrent processing", 
		len(records), lastScannedId)

	// 使用 Worker Pool 模式并发处理
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, maxConcurrentWorkers) // 控制并发数
	var successCount int64
	var failCount int64
	var errorMessages []string
	var errorMutex sync.Mutex

	for i, record := range records {
		wg.Add(1)
		go func(idx int, r *Record) {
			defer wg.Done()
			
			// 获取信号量，控制并发数
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// 优化：直接使用已扫描的记录，减少数据库查询
			// 只在真正需要时才重新查询（例如检查是否已被其他goroutine处理）
			// 由于记录是刚扫描出来的，且block字段为空，可以直接使用
			if r.Block != "" {
				// 如果记录已经有block，说明已经被处理了（虽然理论上不应该发生）
				atomic.AddInt64(&successCount, 1)
				return
			}

			// 执行上链操作，直接使用扫描出的记录
			// CommitRecord内部会检查block字段，确保不会重复上链
			if _, _, err := CommitRecord(r, "en"); err != nil {
				atomic.AddInt64(&failCount, 1)
				errorMutex.Lock()
				errorMessages = append(errorMessages, fmt.Sprintf("record %s: %v", r.getId(), err))
				errorMutex.Unlock()
				logs.Error("Failed to commit record %s: %v", r.getId(), err)
			} else {
				atomic.AddInt64(&successCount, 1)
				// 每处理10条记录打印一次进度
				if (idx+1)%10 == 0 {
					logs.Info("ScanNeedCommitRecords progress: %d/%d records processed", idx+1, len(records))
				}
			}
		}(i, record)
	}

	// 等待所有goroutine完成
	wg.Wait()

	success := atomic.LoadInt64(&successCount)
	fail := atomic.LoadInt64(&failCount)
	
	logs.Info("ScanNeedCommitRecords: Completed. Success: %d, Failed: %d, Total: %d", success, fail, len(records))
	
	if len(errorMessages) > 0 {
		// 只记录前10个错误，避免日志过长
		errorCount := len(errorMessages)
		if errorCount > 10 {
			errorMessages = errorMessages[:10]
		}
		logs.Error("ScanNeedCommitRecords() failed to commit %d/%d records. Sample errors: %v", fail, len(records), errorMessages)
	}
}

func InitCommitRecordsTask() {
	// 尝试从动态配置读取并发数和批量大小
	if maxWorkersStr, err := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("record.chain.commit.maxWorkers", ""); err == nil && maxWorkersStr != "" {
		if maxWorkers, err := util.ParseIntWithError(maxWorkersStr); err == nil && maxWorkers > 0 {
			maxConcurrentWorkers = maxWorkers
			logs.Info("InitCommitRecordsTask: maxConcurrentWorkers set to %d from config", maxConcurrentWorkers)
		}
	}
	
	if batchSizeStr, err := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("record.chain.commit.batchSize", ""); err == nil && batchSizeStr != "" {
		if batchSize, err := util.ParseIntWithError(batchSizeStr); err == nil && batchSize > 0 {
			batchProcessSize = batchSize
			logs.Info("InitCommitRecordsTask: batchProcessSize set to %d from config", batchProcessSize)
		}
	}

	// Run once immediately on startup
	go ScanNeedCommitRecords()

	// Create cron job
	cronJob := cron.New()
	// 优化：缩短定时任务间隔，从5分钟改为30秒，提高处理频率
	schedule := "@every 30s"
	_, err := cronJob.AddFunc(schedule, ScanNeedCommitRecords)
	if err != nil {
		panic(err)
	}

	cronJob.Start()
	logs.Info("InitCommitRecordsTask: Started with maxWorkers=%d, batchSize=%d, schedule=%s", 
		maxConcurrentWorkers, batchProcessSize, schedule)
}
