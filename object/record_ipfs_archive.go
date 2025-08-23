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
	"fmt"
	"sync"

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

// AddRecordToArchiveQueue 将记录添加到归档队列
// 当队列大小达到1000时，触发IPFS归档流程
func AddRecordToArchiveQueue(record *Record, dataType int) error {
	if record == nil || record.CorrelationId == "" {
		return fmt.Errorf("invalid record or correlation_id")
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

	// 检查队列大小是否达到阈值
	if len(recordArchiveQueues[dataType]) >= maxQueueSize {
		// 触发IPFS归档流程
		go ArchiveToIPFS(dataType)
	}

	return nil
}

// ArchiveToIPFS 执行IPFS归档操作
func ArchiveToIPFS(dataType int) {
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
		return
	}

	// 这里实现IPFS归档逻辑

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
