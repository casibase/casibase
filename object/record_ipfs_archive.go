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
	"time"

	"github.com/casibase/casibase/util"
)

// IpfsArchive 表示IPFS归档记录
type IpfsArchive struct {
	Id            int64  `xorm:"id pk autoincr" json:"id"`
	RecordId      int64 `xorm:"int index" json:"recordId"`
	CorrelationId string `xorm:"varchar(256) notnull index" json:"correlationId"`
	IpfsAddress   string `xorm:"varchar(500)" json:"ipfsAddress"`
	UpdateTime    string `xorm:"varchar(100)" json:"updateTime"`
	DataType      int    `xorm:"int" json:"dataType"`
	UploadTime    string `xorm:"varchar(100)" json:"uploadTime"`
	CreateTime    string `xorm:"varchar(100)" json:"createTime"`
}

// 定义全局数组和互斥锁
var (
	recordArchiveQueue []*Record
	queueMutex         sync.Mutex
	maxQueueSize       = 1000
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

// GetIpfsArchives 获取多个IPFS归档记录
func GetIpfsArchives(offset, limit int, field, value string) ([]*IpfsArchive, error) {
	archives := []*IpfsArchive{}
	session := GetDbSession("", offset, limit, field, value, "update_time", "DESC")
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

// AddRecordToArchiveQueue 将记录添加到归档队列
// 当队列大小达到1000时，触发IPFS归档流程
func AddRecordToArchiveQueue(record *Record) error {
	if record == nil || record.CorrelationId == "" {
		return fmt.Errorf("invalid record or correlation_id")
	}

	// 先将记录信息保存到数据库
	archive := &IpfsArchive{
		CorrelationId: record.CorrelationId,
		DataType:      1, // 假设1表示记录类型
		CreateTime:    util.GetCurrentTimeWithMilli(),
	}

	_, err := AddIpfsArchive(archive)
	if err != nil {
		return fmt.Errorf("failed to add record to archive database: %w", err)
	}

	// 再添加到内存队列
	queueMutex.Lock()
	defer queueMutex.Unlock()

	recordArchiveQueue = append(recordArchiveQueue, record)

	// 检查队列大小是否达到阈值
	if len(recordArchiveQueue) >= maxQueueSize {
		// 触发IPFS归档流程
		go archiveToIPFS()
	}

	return nil
}

// archiveToIPFS 执行IPFS归档操作
func archiveToIPFS() {
	// 创建一个临时队列副本，避免长时间持有锁
	var tempQueue []*Record

	queueMutex.Lock()
	if len(recordArchiveQueue) > 0 {
		tempQueue = make([]*Record, len(recordArchiveQueue))
		copy(tempQueue, recordArchiveQueue)
		// 清空原队列
		recordArchiveQueue = []*Record{}
	}
	queueMutex.Unlock()

	if len(tempQueue) == 0 {
		return
	}

	// 这里实现IPFS归档逻辑

}

// uploadToIPFS 将记录上传到IPFS
// 实际应用中需要实现与IPFS的交互
func uploadToIPFS(record *Record) string {
	// 这里是IPFS上传逻辑的占位符
	// 模拟上传过程
	time.Sleep(100 * time.Millisecond)

	// 生成模拟的IPFS地址
	// 实际应用中，这里应该返回真实的IPFS地址
	return fmt.Sprintf("ipfs://Qm%s", util.GenerateId()[:10])
}

// GetQueueSize 返回当前队列大小（主要用于测试）
func GetQueueSize() int {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	return len(recordArchiveQueue)
}
