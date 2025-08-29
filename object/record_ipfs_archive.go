// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"sync"
	"time"
	"sort"

	"github.com/casibase/casibase/util"
)

// IpfsArchive 表示IPFS归档记录
type IpfsArchive struct {
	Id            int64  `xorm:"id pk autoincr" json:"id"`
	RecordId      int64  `xorm:"int index" json:"recordId"`
	CorrelationId string `xorm:"varchar(256) notnull index" json:"correlationId"`
	IpfsAddress   string `xorm:"varchar(500)" json:"ipfsAddress"`
	UpdateTime    string `xorm:"varchar(100)" json:"updateTime"`
	DataType      int    `xorm:"int" json:"dataType"`
	UploadTime    string `xorm:"varchar(100)" json:"uploadTime"`
	CreateTime    string `xorm:"varchar(100)" json:"createTime"`
}

// 定义全局map队列和互斥锁
var (
	// 使用map[int]map[int64]*Record代替map[int][]*Record以提高查找效率
	recordArchiveQueues = make(map[int]map[int64]*Record)
	queueMutex          sync.Mutex
	maxQueueSize        = 1000
)

// AddIpfsArchive 添加IPFS归档记录
func AddIpfsArchive(archive *IpfsArchive) (bool, error) {
	// 设置创建时间和更新时间
	currentTime := util.GetCurrentTimeWithMilli()
	if archive.CreateTime == "" {
		archive.CreateTime = currentTime
	}
	archive.UpdateTime = currentTime

	affected, err := adapter.engine.Insert(archive)
	if err != nil {
		return false, fmt.Errorf("failed to add ipfs archive: %w", err)
	}

	return affected != 0, nil
}

// GetIpfsArchiveByRecordId 根据Id获取IPFS归档记录
func GetIpfsArchiveByRecordId(recordId int64) (*IpfsArchive, error) {
	archive := &IpfsArchive{RecordId: recordId}
	existed, err := adapter.engine.Get(archive)
	if err != nil {
		return nil, fmt.Errorf("failed to get ipfs archive: %w", err)
	}
	if !existed {
		return nil, nil
	}

	return archive, nil
}

// GetIpfsArchiveById 根据Id获取IPFS归档记录
func GetIpfsArchiveById(id int64) (*IpfsArchive, error) {
	archive := &IpfsArchive{Id: id}
	existed, err := adapter.engine.Get(archive)
	if err != nil {
		return nil, fmt.Errorf("failed to get ipfs archive: %w", err)
	}
	if !existed {
		return nil, nil
	}

	return archive, nil
}

// GetIpfsArchiveByCorrelationId 根据correlation_id获取IPFS归档记录
func GetIpfsArchiveByCorrelationId(correlationId string) (*IpfsArchive, error) {
	archive := &IpfsArchive{CorrelationId: correlationId}
	existed, err := adapter.engine.Get(archive)
	if err != nil {
		return nil, fmt.Errorf("failed to get ipfs archive: %w", err)
	}
	if !existed {
		return nil, nil
	}

	return archive, nil
}

// GetIpfsArchiveByCorrelationIdAndDataType 根据correlationId和dataType获取IPFS归档记录列表
func GetIpfsArchivesByCorrelationIdAndDataType(correlationId string, dataType int, offset, limit int, sortField, sortOrder string) ([]*IpfsArchive, error) {
	archives := []*IpfsArchive{}
	session := adapter.engine.NewSession()
	session = session.And("correlation_id=?", correlationId)
	session = session.And("data_type=?", dataType)

	// 添加分页
	if offset >= 0 && limit > 0 {
		session = session.Limit(limit, offset)
	}

	if sortField == "" || sortOrder == "" {
		sortField = "update_time"
	}
	if sortOrder == "ascend" {
		session = session.Asc(util.SnakeString(sortField))
	} else {
		session = session.Desc(util.SnakeString(sortField))
	}

	err := session.Find(&archives)
	if err != nil {
		return archives, fmt.Errorf("failed to get ipfs archives by correlation_id and data_type: %w", err)
	}

	return archives, nil
}

// GetIpfsArchives 获取多个IPFS归档记录
func GetIpfsArchives(offset, limit int, field, value, sortField, sortOrder string) ([]*IpfsArchive, error) {
	archives := []*IpfsArchive{}

	if sortField == "" {
		sortField = "update_time"
	}
	if sortOrder == "" {
		sortOrder = "descend"
	}

	session := GetDbSession("", offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&archives)
	if err != nil {
		return archives, fmt.Errorf("failed to get ipfs archives: %w", err)
	}

	return archives, nil
}

// UpdateIpfsArchive 更新IPFS归档记录(基于CorrelationId)
func UpdateIpfsArchive(archive *IpfsArchive) (bool, error) {
	if archive.CorrelationId == "" {
		return false, fmt.Errorf("correlation_id cannot be empty")
	}

	// 更新时间
	archive.UpdateTime = util.GetCurrentTimeWithMilli()

	affected, err := adapter.engine.Where("correlation_id = ?", archive.CorrelationId).AllCols().Update(archive)
	if err != nil {
		return false, fmt.Errorf("failed to update ipfs archive: %w", err)
	}

	return affected != 0, nil
}

// UpdateIpfsArchiveById 根据Id更新IPFS归档记录
func UpdateIpfsArchiveById(archive *IpfsArchive) (bool, error) {
	if archive.Id <= 0 {
		return false, fmt.Errorf("id cannot be empty or less than zero")
	}

	// 更新时间
	archive.UpdateTime = util.GetCurrentTimeWithMilli()

	affected, err := adapter.engine.ID(archive.Id).AllCols().Update(archive)
	if err != nil {
		return false, fmt.Errorf("failed to update ipfs archive by id: %w", err)
	}

	return affected != 0, nil
}

// DeleteIpfsArchive 删除IPFS归档记录(基于CorrelationId)
func DeleteIpfsArchiveByCorrelationId(correlationId string) (bool, error) {
	if correlationId == "" {
		return false, fmt.Errorf("correlation_id cannot be empty")
	}

	affected, err := adapter.engine.Where("correlation_id = ?", correlationId).Delete(&IpfsArchive{})
	if err != nil {
		return false, fmt.Errorf("failed to delete ipfs archive: %w", err)
	}

	return affected != 0, nil
}

// DeleteIpfsArchiveByRecordId 根据id删除IPFS归档记录
func DeleteIpfsArchiveByRecordId(id int64) (bool, error) {
	if id <= 0 {
		return false, fmt.Errorf("id cannot be empty or less than zero")
	}

	affected, err := adapter.engine.Where("id = ?", id).Delete(&IpfsArchive{})
	if err != nil {
		return false, fmt.Errorf("failed to delete ipfs archive by id: %w", err)
	}

	return affected != 0, nil
}

// DeleteIpfsArchiveById 根据Id删除IPFS归档记录
func DeleteIpfsArchiveById(id int64) (bool, error) {
	if id <= 0 {
		return false, fmt.Errorf("id cannot be empty or less than zero")
	}

	affected, err := adapter.engine.ID(id).Delete(&IpfsArchive{})
	if err != nil {
		return false, fmt.Errorf("failed to delete ipfs archive by id: %w", err)
	}

	return affected != 0, nil
}

// ============== 队列信息 ==================
// 设定记录归档队列
func AddRecordToArchiveQueueFromRecordAdd(record *Record) {
    if record == nil {
        return
    }

    var dataType int
    switch record.Action {
    case "add-outpatient":
        dataType = 1
    case "add-inpatient":
        dataType = 2
    case "add-knowledge":
        dataType = 3
    case "add-telemedicine":
        dataType = 4
    default:
        // 其他类型action不处理
        return
    }

    // 异步调用
    go AddRecordToArchiveQueue(record, dataType)
}


// AddRecordToArchiveQueue 将记录添加到归档队列
// 当队列大小达到1000时，触发IPFS归档流程
func AddRecordToArchiveQueue(record *Record, dataType int) error {
	if record == nil {
		return fmt.Errorf("invalid record")
	}


	// 先将记录信息保存到数据库
	archive := &IpfsArchive{
		RecordId:      int64(record.Id),
		CorrelationId: record.CorrelationId,
		DataType:      dataType,
		CreateTime:    util.GetCurrentTimeWithMilli(),
		UpdateTime:    util.GetCurrentTimeWithMilli(),
	}

	_, err := AddIpfsArchive(archive)
	if err != nil {
		return fmt.Errorf("failed to add record to archive database: %w", err)
	}

	// 再添加到内存队列
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 确保该dataType的队列已初始化
	if _, exists := recordArchiveQueues[dataType]; !exists {
		recordArchiveQueues[dataType] = make(map[int64]*Record)
	}

	// 使用record.Id作为键添加到set中
	recordArchiveQueues[dataType][int64(record.Id)] = record

	userId := record.User

	// 检查队列大小是否达到阈值
	if len(recordArchiveQueues[dataType]) >= maxQueueSize {
		// 触发IPFS归档流程
		go ArchiveToIPFS(dataType, userId)
	}

	return nil
}

// GetQueueSize 返回指定dataType的队列大小（主要用于测试）
func GetQueueSize(dataType int) int {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	if queue, exists := recordArchiveQueues[dataType]; exists {
		return len(queue)
	}
	return 0
}

// GetAllQueueSizes 返回所有dataType的队列大小（主要用于测试）
func GetAllQueueSizes() map[int]int {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	sizes := make(map[int]int)
	for dataType, queue := range recordArchiveQueues {
		sizes[dataType] = len(queue)
	}
	return sizes
}

// GetAllQueueData 获取所有队列的数据
func GetAllQueueData() map[int][]*Record {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	data := make(map[int][]*Record)
	for dataType, queue := range recordArchiveQueues {
		// 将map转换为slice返回
		data[dataType] = make([]*Record, 0, len(queue))
		for _, record := range queue {
			data[dataType] = append(data[dataType], record)
		}
	}
	return data
}

// AddRecordsWithDataTypesToQueue 将指定的recordId数组添加到对应的dataType队列中
// records: 包含recordId和对应dataType的切片
func AddRecordsWithDataTypesToQueue(records []struct {
	RecordId int64
	DataType int
}) error {
	if len(records) == 0 {
		return nil // 没有需要添加的记录
	}

	// 加锁处理队列
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 处理每条记录
	for _, item := range records {
		recordId := item.RecordId
		dataType := item.DataType

		// 确保该dataType的队列已初始化
		if _, exists := recordArchiveQueues[dataType]; !exists {
			recordArchiveQueues[dataType] = make(map[int64]*Record)
		}

		// 检查记录是否已在队列中
		if _, exists := recordArchiveQueues[dataType][recordId]; exists {
			continue // 记录已在队列中，跳过
		}

		// 获取对应的Record对象
		record, err := GetRecordByRecordId(fmt.Sprintf("%d", recordId))
		if err != nil {
			return fmt.Errorf("failed to get record by id %d: %w", recordId, err)
		}

		if record == nil {
			continue // 记录不存在，跳过
		}

		// 添加到队列
		recordArchiveQueues[dataType][recordId] = record

	}

	return nil
}

// AddUnUploadIpfsDataToQueue 从数据库取出ipfsAddress空的并加入到队列中（id重复的不重复加入到队列）
func AddUnUploadIpfsDataToQueue() error {
	// 查询数据库中ipfsAddress为空的所有记录
	var archives []*IpfsArchive
	err := adapter.engine.Where("ipfs_address is NULL OR ipfs_address = ''").Find(&archives)
	if err != nil {
		return fmt.Errorf("failed to query unuploaded ipfs data: %w", err)
	}

	if len(archives) == 0 {
		return nil // 没有需要处理的记录
	}

	// 加锁处理队列
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 处理每个未上传的记录
	for _, archive := range archives {
		dataType := archive.DataType

		// 确保该dataType的队列已初始化
		if _, exists := recordArchiveQueues[dataType]; !exists {
			recordArchiveQueues[dataType] = make(map[int64]*Record)
		}

		// 检查记录是否已在队列中 (O(1)复杂度)
		if _, exists := recordArchiveQueues[dataType][archive.RecordId]; exists {
			continue // 记录已在队列中，跳过
		}

		// 获取对应的Record对象
		record, err := GetRecordByRecordId(fmt.Sprintf("%d", archive.RecordId))
		if err != nil {
			return fmt.Errorf("failed to get record by id %d: %w", archive.RecordId, err)
		}

		if record == nil {
			continue // 记录不存在，跳过
		}

		// 添加到队列
		recordArchiveQueues[dataType][archive.RecordId] = record
	}

	return nil
}

// GetRecordByRecordId 根据recordId查询记录
func GetRecordByRecordId(recordId string) (*Record, error) {
	// 尝试将recordId解析为整数
	id, err := util.ParseIntWithError(recordId)
	if err != nil {
		return nil, fmt.Errorf("invalid recordId format: %s, error: %w", recordId, err)
	}

	// 创建Record对象并设置Id
	record := &Record{Id: id}

	// 查询数据库
	existed, err := adapter.engine.Get(record)
	if err != nil {
		return nil, fmt.Errorf("failed to get record by id %d: %w", id, err)
	}

	// 检查记录是否存在
	if !existed {
		return nil, nil
	}

	return record, nil
}

// RemoveRecordFromQueueByRecordIdAndDataType 从队列中移除指定recordId和dataType的记录
// 并从数据库中删除对应的归档记录
func RemoveRecordFromQueueByRecordIdAndDataType(recordId int64, dataType int) error {
	// 加锁处理队列
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 检查该dataType的队列是否存在
	queue, exists := recordArchiveQueues[dataType]
	if !exists {
		return nil // 队列为空，无需操作
	}

	// 检查记录是否在队列中
	if _, exists := queue[recordId]; !exists {
		return nil // 记录不在队列中，无需操作
	}

	// 从队列中删除记录
	delete(queue, recordId)

	// 如果队列为空，则删除该队列
	if len(queue) == 0 {
		delete(recordArchiveQueues, dataType)
	}
	return nil
}

// ================== 上传IPFS ==================

// ArchiveToIPFS 执行IPFS归档操作
func ArchiveToIPFS(dataType int, userId string) (string, error) {
	// 创建一个临时队列副本，避免长时间持有锁
	var tempQueue []*Record

	queueMutex.Lock()
	if queue, exists := recordArchiveQueues[dataType]; exists && len(queue) > 0 {
		// 将map转换为slice用于处理
		tempQueue = make([]*Record, 0, len(queue))
		for _, record := range queue {
			tempQueue = append(tempQueue, record)
		}
		// 清空原队列
		recordArchiveQueues[dataType] = make(map[int64]*Record)
	}
	queueMutex.Unlock()

	if len(tempQueue) == 0 {
		return "", errors.New(fmt.Sprintf("queue is empty"))
	}

	// 这里实现IPFS归档逻辑
	ipfsAddress, err := sendIpfsUploadReq(tempQueue, dataType)
	if err != nil {
		// 失败了，将内容重新加入队列中
		queueMutex.Lock()
		for _, record := range tempQueue {
			recordArchiveQueues[dataType][int64(record.Id)] = record
		}
		queueMutex.Unlock()
		return "", errors.New(fmt.Sprintf("Failed: %v\n", err))
	}

	for _, record := range tempQueue {

		// 更新IPFS归档记录
		archive, err := GetIpfsArchiveByRecordId(int64(record.Id))
		if err != nil {
			fmt.Printf("Failed to get ipfs archive: %v\n", err)
			continue
		}

		if archive != nil {
			// 这里可以更新归档记录的IPFS地址等信息
			archive.IpfsAddress = ipfsAddress
			archive.UploadTime = util.GetCurrentTimeWithMilli()
			_, err = UpdateIpfsArchiveById(archive)
			if err != nil {
				fmt.Printf("Failed to update ipfs archive: %v\n", err)
			}
		}
		fmt.Printf("Successfully archived record %d to IPFS\n", record.Id)
	}
	return ipfsAddress, nil
}

func sendIpfsUploadReq(queueData []*Record, dataType int) (string, error) {
	content, contentErr := generateExcelFromRecords(queueData)
	if contentErr != nil {
		return "", contentErr
	}
	// 构造请求体
	requestBody := map[string]interface{}{
		"uId":         "casbin",
		"aesKey":      generateAESKey(32),
		"fileContent": content,
		"fileName":    fmt.Sprintf("%d-%s", dataType, util.GetCurrentTimeWithMilli()),
		"apiUrl": map[string]string{
			"ipfsServiceUrl":  "http://47.113.204.64:5001",
			"chainServiceUrl": "http://47.113.204.64:9001/tencent-chainapi/exec",
			"contractName":    "tencentChainqaContractV221demo01",
		},
	}

	// 转换为JSON
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		fmt.Printf("Failed to marshal request body: %v\n", err)
		return "", err
	}

	fmt.Printf("上传IPFS: " + string(jsonData))

	// 发送POST请求
	url := "https://47.113.204.64:23554/api/upload/uploadFile"
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Failed to send POST request: %v\n", err)
		return "", err
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Failed to read response body: %v\n", err)
		return "", err
	}

	// 处理响应
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Request failed with status code: %d, response: %s\n", resp.StatusCode, string(body))
		return "", err
	}

	// 解析响应
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		fmt.Printf("Failed to unmarshal response: %v\n", err)
		return "", err
	}

	// 检查响应状态
	code, ok := response["code"].(float64)
	if !ok {
		fmt.Printf("Invalid response format: code not found or not a number\n")
		return "", errors.New("invalid response format")
	}

	if code == 0 {
		// 成功响应，提取pos
		data, ok := response["data"].(map[string]interface{})
		if !ok {
			fmt.Printf("Invalid response format: data not found or not an object\n")
			return "", errors.New("invalid response data format")
		}

		pos, ok := data["pos"].(string)
		if !ok {
			fmt.Printf("Invalid response format: pos not found or not a string\n")
			return "", errors.New("pos not found in response")
		}

		return pos, nil
	} else {
		// 错误响应，提取error
		data, ok := response["data"].(map[string]interface{})
		if !ok {
			fmt.Printf("Invalid response format: data not found or not an object\n")
			return "", errors.New("invalid response data format")
		}

		// 先获取msg和errorMsg
		msg, msgOk := response["msg"].(string)
		errorMsg, ok := data["error"].(string)

		// 按照msg -> errorMsg的优先级设置错误消息
		if msgOk && ok {
			// 如果msg和error都存在，返回"msg——errorMsg"格式
			errorMsg = fmt.Sprintf("%s——%s", msg, errorMsg)
		} else if msgOk {
			// 如果只有msg存在，使用msg
			errorMsg = msg
		} else if !ok {
			// 如果msg和error都不存在，使用默认错误消息
			errorMsg = fmt.Sprintf("request failed with code: %v", code)
		}

		return "", errors.New(errorMsg)
	}
}

// generateAESKey 生成指定长度的随机AES密钥
func generateAESKey(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = chars[time.Now().UnixNano()%int64(len(chars))]
	}
	return string(result)
}

// generateExcelFromRecords 从记录队列生成Excel格式字符串
func generateExcelFromRecords(queueData []*Record) (string, error) {
	if len(queueData) == 0 {
		return "", nil
	}

	// 解析所有object字段，收集所有可能的key
	var allKeys []string
	keyMap := make(map[string]bool)
	recordsData := make([]map[string]interface{}, len(queueData))

	for i, record := range queueData {
		// 解析object字段为map
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(record.Object), &data); err != nil {
			// 打印，继续处理
			fmt.Printf("failed to unmarshal object for record %d: %w", record.Id, err)
			continue
		}
		recordsData[i] = data

		// 收集key
		for key := range data {
			if !keyMap[key] {
				keyMap[key] = true
				allKeys = append(allKeys, key)
			}
		}
	}

	// 收集所有key之后，进行升序排序,避免顺序不一致
	sort.Strings(allKeys)

	// 生成表格字符串
	var result strings.Builder

	// 第一行：key
	for i, key := range allKeys {
		// 处理key中的特殊字符：
		// 1. 若包含空格，替换为下划线(_)
		// 2. 若包含换行符(\n)，替换为HTML换行标签(<br>)
		// 3. 若key仅由星号(*)组成，替换为井号(#)
		
		processedKey := key
		
		// 检查是否仅由星号组成（非空且移除所有*后为空）
		if key != "" && strings.Trim(key, "*") == "" {
			processedKey = "#"
		} else {
			// 替换空格为下划线
			processedKey = strings.ReplaceAll(processedKey, " ", "-")
			// 替换换行符为<br>
			processedKey = strings.ReplaceAll(processedKey, "\n", "<br>")
		}

		result.WriteString(processedKey)
		if i < len(allKeys)-1 {
			result.WriteString(" ")
		}
	}
	result.WriteString("\n")

	// 后续行：value
	for _, data := range recordsData {
		for i, key := range allKeys {
			value, exists := data[key]
			if !exists {
				result.WriteString("--")
			} else {
				// 将value转换为字符串
				valueStr := fmt.Sprintf("%v", value)

				// 如果字符串为空，强制设为"_"
				if valueStr == "" {
					valueStr = "-"
				}

				// 将换行符替换为<br>
				valueStr = strings.ReplaceAll(valueStr, "\n", "<br>")

				// 替换空格为下划线
				result.WriteString(strings.ReplaceAll(valueStr, " ", "-"))
			}
			if i < len(allKeys)-1 {
				result.WriteString(" ")
			}
		}
		result.WriteString("\n")
	}

	// 如果末尾有换行符，去掉
	resultStr := result.String()
	if len(resultStr) > 0 && resultStr[len(resultStr)-1] == '\n' {
		resultStr = resultStr[:len(resultStr)-1]
	}

	return resultStr, nil
}
