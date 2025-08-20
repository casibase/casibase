package object

import (
	"sync"
)

// 定义全局数组和互斥锁
var (
	recordArchiveQueue []*Record
	queueMutex         sync.Mutex
	maxQueueSize       = 1000
)

// AddRecordToArchiveQueue 将记录添加到归档队列
// 当队列大小达到1000时，触发IPFS归档流程
func AddRecordToArchiveQueue(record *Record) {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 添加记录到队列
	recordArchiveQueue = append(recordArchiveQueue, record)

	// 检查队列大小是否达到阈值
	if len(recordArchiveQueue) >= maxQueueSize {
		// 触发IPFS归档流程
		go archiveToIPFS()
	}
}

// archiveToIPFS 执行IPFS归档操作
// TODO: 实现IPFS上传逻辑
func archiveToIPFS() {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	// 这里是IPFS归档逻辑的占位符
	// 未来需要实现将recordArchiveQueue中的记录上传到IPFS的功能

	// 归档完成后清空队列
	// 注意：在实际实现中，应该确认上传成功后再清空队列
	recordArchiveQueue = []*Record{}

	// 记录日志（实际应用中应该使用日志系统）
	// fmt.Printf("IPFS归档完成，耗时: %d ms\n", endTime - startTime)
}

// GetQueueSize 返回当前队列大小（主要用于测试）
func GetQueueSize() int {
	queueMutex.Lock()
	defer queueMutex.Unlock()

	return len(recordArchiveQueue)
}