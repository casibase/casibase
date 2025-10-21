// 本段代码是为了修正record中Object传入的字段不正确的问题。请勿进行任何修改！如有问题请联系jjq

package object

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/casibase/casibase/util"
)

// 定义全局变量，修复任务结构体（并发安全）
var (
	bugfixRecordObjectTask = map[string]interface{}{
		"taskId":                 "",
		"taskType":               "",
		"createTime":             "",
		"allRecords":             0,
		"nowFinishRecordsCount":  0,
		"wrongRecords":           "",
		"errorInfo":              "",
		"params":                 "",
		"status":                 "finished", // notStarted,preparing, running, finished
		"isTest":                 false,
	}
	bugfixRecordObjectTaskLock sync.RWMutex

	bugfixStopNow     = false // 用于停止当前修复任务
	bugfixStopNowLock sync.RWMutex
)

func setBugfixField(key string, value interface{}) {
	bugfixRecordObjectTaskLock.Lock()
	defer bugfixRecordObjectTaskLock.Unlock()
	bugfixRecordObjectTask[key] = value
}

func getBugfixField(key string) interface{} {
	bugfixRecordObjectTaskLock.RLock()
	defer bugfixRecordObjectTaskLock.RUnlock()
	return bugfixRecordObjectTask[key]
}

func incNowFinishRecordsCount() {
	bugfixRecordObjectTaskLock.Lock()
	defer bugfixRecordObjectTaskLock.Unlock()
	if v, ok := bugfixRecordObjectTask["nowFinishRecordsCount"].(int); ok {
		bugfixRecordObjectTask["nowFinishRecordsCount"] = v + 1
	} else if v64, ok := bugfixRecordObjectTask["nowFinishRecordsCount"].(float64); ok {
		bugfixRecordObjectTask["nowFinishRecordsCount"] = int(v64) + 1
	} else {
		bugfixRecordObjectTask["nowFinishRecordsCount"] = 1
	}
}

func setBugfixStopNow(v bool) {
	bugfixStopNowLock.Lock()
	defer bugfixStopNowLock.Unlock()
	bugfixStopNow = v
}

func getBugfixStopNow() bool {
	bugfixStopNowLock.RLock()
	defer bugfixStopNowLock.RUnlock()
	return bugfixStopNow
}

func getBugfixTaskJSON() string {
	bugfixRecordObjectTaskLock.RLock()
	defer bugfixRecordObjectTaskLock.RUnlock()
	b, err := json.Marshal(bugfixRecordObjectTask)
	if err != nil {
		return "{}"
	}
	return string(b)
}

// ========== 修复任务控制函数 ==========
func BUGFIX_CreateBugFixTask(taskType, params string) (taskId string, err error) {
	// 判断能否创建
	if !BUGFIX_checkCanChange() {
		return "", fmt.Errorf("Another bugfix task is still in progress. Please try again later.")
	}

	// 初始化修复任务
	setBugfixField("status", "running")
	setBugfixStopNow(false)

	// 生成task的uuid和name
	uuid := util.GenerateUUID()
	setBugfixField("taskId", uuid)
	setBugfixField("taskType", taskType+"_"+uuid)
	setBugfixField("createTime", time.Now().Format("2006-01-02 15:04:05"))
	setBugfixField("allRecords", -1)
	setBugfixField("nowFinishRecordsCount", 0)
	setBugfixField("wrongRecords", "")
	setBugfixField("errorInfo", "")
	setBugfixField("isTest", false)
	setBugfixField("params", params)

	switch taskType {
		case "fixRecordObject":
			go fixRecordObject(uuid, params)

		case "reUploadRecordObject":
			go reUploadRecordObject(uuid, params)

		case "reCommitRecordToChain":
			go reCommitRecordToChain(uuid, params)
		
		case "ipfsArchieve_correlationId_fix":
			go ipfsArchieve_correlationId_fix(uuid, params)

		case "ipfsArchieve_clearUpload":
			go ipfsArchieve_clearUpload(uuid, params)

		case "ipfsArchieve_clearUpload_by_ipfsAddress":
			go ipfsArchieve_clearUpload_by_ipfsAddress(uuid, params)
	}
	return uuid, nil
}

func BUGFIX_checkCanChange() bool {
	// 判断bugfixRecordObjectTask的status是否仍在preparing或running
	status := getBugfixField("status")
	if s, ok := status.(string); ok {
		if s == "preparing" || s == "running" {
			return false
		}
	}
	return true
}

func BUGFIX_stopCurrentTask() error {
	setBugfixStopNow(true)
	// setBugfixField("status", "finished")
	// setBugfixField("taskId", "")
	// setBugfixField("taskType", "")
	return nil
}

func BUGFIX_getCurrentTask() string {
	return getBugfixTaskJSON()
}


func BUGFIX_judgeIsTest(params string) bool {
	// 判断是否是test
	isTest := false
	var paramsMap map[string]interface{}
	err := json.Unmarshal([]byte(params), &paramsMap)
	if err == nil {
		if v, ok := paramsMap["isTest"]; ok {
			switch t := v.(type) {
			case bool:
				isTest = t
			case string:
				if t == "true" || t == "1" {
					isTest = true
				}
			case float64:
				if int(t) == 1 {
					isTest = true
				}
			}
		}
	}
	setBugfixField("isTest", isTest)
	return isTest
}


// ========== 具体修复函数 ==========
func fixRecordObject(taskId, params string) {
	// 准备阶段
	// 查询有哪些需要进行查询和修复的record
	setBugfixField("status", "preparing")
	// params是JSON字符串，请解析为map
	var paramsMap map[string]interface{}
	err := json.Unmarshal([]byte(params), &paramsMap)
	if err != nil {
		fmt.Printf("Failed to unmarshal params: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to unmarshal params: %v", err))
		setBugfixField("status", "finished")
		return
	}

	// 查询数据库，获取数据库中record中action等于paramsMap["action"]的数据
	records, err := getRecordsByActionBUGFIX(paramsMap["action"].(string), paramsMap["section"].(string))
	// 如果传入 isTest 参数且为真，则只处理前 10 条记录
	isTest := BUGFIX_judgeIsTest(params)
	if isTest && len(records) > 10 {
		records = records[:10]
	}
			
	// 统计需要查询和修复的总记录数

	if err != nil {
		fmt.Printf("Failed to get records: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to get records: %v", err))
		setBugfixField("status", "finished")
		return
	}
	if isTest && len(records) > 10 {
		records = records[:10]
	}
	totalRecords := len(records)
	setBugfixField("allRecords", totalRecords)
	// 标记当前任务是否为测试模式
	setBugfixField("isTest", isTest)

	// 遍历records，提取object为json字符串，进行解析，获取其中的object字段
	setBugfixField("status", "running")
	// counts are tracked via shared task state; local counters not needed

	for _, record := range records {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return
		}
		// 进行修复操作
		fixRecord(record,paramsMap["section"].(string))
		// 休息30
		time.Sleep(30 * time.Millisecond)
	}

	setBugfixField("status", "finished")
	fmt.Println("Bugfix task finished.")	
}

func fixRecord(record *Record,section_ string) {
	// 检查record.Object是否为JSON字符串
	var objMap map[string]interface{}
	err := json.Unmarshal([]byte(record.Object), &objMap)
	if err != nil {
		// 不是JSON字符串，跳过
		return
	}

	// prepare string id for logging / wrongRecords
	idStr := strconv.Itoa(record.Id)

	// 如果已经有了correlationId字段，就不用修复了
	if _, ok := objMap["correlationId"]; ok {
		return
	}


	// 将objMap的key进行修正，原本的数据
	// 提取原本的字段值
	idCardNo, _ := objMap["idCardNo"].(string)
	patientName, _ := objMap["name"].(string)
	localDBIndex, _ := objMap["admId"].(string)
	consultationTime, _ := objMap["admTime"].(string)
	section := section_// 不带院区
	unit, _ := objMap["admDepartment"].(string)
	diagnosis:= "-"

	// 重新构建objMap
	objMap = map[string]interface{}{
		"correlationId":     idCardNo,
		"patientName":       patientName,
		"localDBIndex":      localDBIndex,
		"consultationTime":  consultationTime,
		"section":           section,
		"unit":              unit,
		"diagnosis":         diagnosis,
	}



	// 将objMap转换回JSON字符串
	fixedObjectBytes, err := json.Marshal(objMap)
	if err != nil {
		log.Println("Failed to marshal fixed object:", err)
		bugfixRecordObjectTaskLock.Lock()
		if wr, ok := bugfixRecordObjectTask["wrongRecords"].(string); ok {
			bugfixRecordObjectTask["wrongRecords"] = wr + idStr + ";"
		} else {
			bugfixRecordObjectTask["wrongRecords"] = idStr + ";"
		}
		bugfixRecordObjectTaskLock.Unlock()
		return
	}
	fixedObjectStr := string(fixedObjectBytes)

	// 更新record的Object字段
	record.Object = fixedObjectStr
	record.Section = section
	record.CorrelationId = idCardNo
	_, err = adapter.engine.ID(record.Id).Update(record)
	if err != nil {
		log.Printf("failed to update record %d: %v", record.Id, err)
		bugfixRecordObjectTaskLock.Lock()
		if wr, ok := bugfixRecordObjectTask["wrongRecords"].(string); ok {
			bugfixRecordObjectTask["wrongRecords"] = wr + idStr + ";"
		} else {
			bugfixRecordObjectTask["wrongRecords"] = idStr + ";"
		}
		bugfixRecordObjectTaskLock.Unlock()
		return
	}
	// 更新成功，更新已完成数量
	incNowFinishRecordsCount()
}

func reUploadRecordObject(taskId, params string) {
	// 准备阶段
	// 查询有哪些需要进行查询和修复的record
	setBugfixField("status", "preparing")
	// params是JSON字符串，请解析为map
	var paramsMap map[string]interface{}
	err := json.Unmarshal([]byte(params), &paramsMap)
	if err != nil {
		fmt.Printf("Failed to unmarshal params: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to unmarshal params: %v", err))
		setBugfixField("status", "finished")
		return
	}

	// 查询数据库，获取数据库中record中action等于paramsMap["action"]的数据
	records, err := getRecordsByActionBUGFIX(paramsMap["action"].(string), paramsMap["section"].(string))
	// 如果传入 isTest 参数且为真，则只处理前 10 条记录
	isTest := BUGFIX_judgeIsTest(params)
	if isTest && len(records) > 10 {
		records = records[:10]
	}
			
	// 统计需要查询和修复的总记录数

	if err != nil {
		fmt.Printf("Failed to get records: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to get records: %v", err))
		setBugfixField("status", "finished")
		return
	}
	if isTest && len(records) > 10 {
		records = records[:10]
	}
	totalRecords := len(records)
	setBugfixField("allRecords", totalRecords)
	// 标记当前任务是否为测试模式
	setBugfixField("isTest", isTest)

	// 遍历records，提取object为json字符串，进行解析，获取其中的object字段
	setBugfixField("status", "running")
	// counts are tracked via shared task state; local counters not needed

	for _, record := range records {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return
		}
		// 将record的object重新传入
		go UploadObjectToIPFS(record)
		incNowFinishRecordsCount()
		// 休息1s
		time.Sleep(10 * time.Millisecond)
	}


	setBugfixField("status", "finished")
	fmt.Println("Bugfix task finished.")	
}

func reCommitRecordToChain(taskId, params string) {
	// 准备阶段
	// 查询有哪些需要进行查询和修复的record
	setBugfixField("status", "preparing")
	// params是JSON字符串，请解析为map
	var paramsMap map[string]interface{}
	err := json.Unmarshal([]byte(params), &paramsMap)
	if err != nil {
		fmt.Printf("Failed to unmarshal params: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to unmarshal params: %v", err))
		setBugfixField("status", "finished")
		return
	}

	// 查询数据库，获取数据库中record中action等于paramsMap["action"]的数据
	records, err := getRecordsByActionBUGFIX(paramsMap["action"].(string), paramsMap["section"].(string))
	// 如果传入 isTest 参数且为真，则只处理前 10 条记录
	isTest := BUGFIX_judgeIsTest(params)
	if isTest && len(records) > 10 {
		records = records[:10]
	}
			
	// 统计需要查询和修复的总记录数

	if err != nil {
		fmt.Printf("Failed to get records: %v\n", err)
		setBugfixField("errorInfo", fmt.Sprintf("Failed to get records: %v", err))
		setBugfixField("status", "finished")
		return
	}
	if isTest && len(records) > 10 {
		records = records[:10]
	}
	totalRecords := len(records)
	setBugfixField("allRecords", totalRecords)
	// 标记当前任务是否为测试模式
	setBugfixField("isTest", isTest)

	// 遍历records，提取object为json字符串，进行解析，获取其中的object字段
	setBugfixField("status", "running")
	// counts are tracked via shared task state; local counters not needed

	for _, record := range records {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return
		}
		// 将record的object重新传入
		go  commitRecordForce(record, record.Language)

		incNowFinishRecordsCount()
		// 休息30ms
		time.Sleep(30 * time.Millisecond)
	}


	setBugfixField("status", "finished")
	fmt.Println("Bugfix task finished.")	
}

func commitRecordForce(record *Record, lang string) (bool, map[string]interface{}, error) {
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


func getRecordsByActionBUGFIX(action,section string) ([]*Record, error) {
	records := []*Record{}
	err := adapter.engine.Desc("id").Where("action = ? and section = ?", action, section).Find(&records)
	if err != nil {
		return records, err
	}
	return records, nil
}


// 任务2：ipfsArchieve的correlationId与record的correlationId不一致的修复任务
func ipfsArchieve_correlationId_fix(taskId, params string) error { 
	// 遍历所有ipfsArchieve记录，如果其中的correlationId为空，则根据recordId去record表中查询对应的correlationId，并更新ipfsArchieve表中的correlationId字段
	setBugfixField("status", "preparing")
	archieves := []*IpfsArchive{}
	err := adapter.engine.Find(&archieves)
	if err != nil {
		return err
	}
	// 判断是否是test
	// params["isTest"]中可以判断
	isTest := BUGFIX_judgeIsTest(params)
	if isTest && len(archieves) > 10 {
		archieves = archieves[:10]
	}
	setBugfixField("allRecords", len(archieves))
	setBugfixField("status", "running")

	


	// 数据准备完成
	

	for _, archieve := range archieves {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return nil
		}

		if archieve.CorrelationId == "" {
			// 根据recordId查询record表
			record := &Record{}
			has, err := adapter.engine.ID(archieve.RecordId).Get(record)
			if err != nil {
				log.Printf("failed to get record %d: %v", archieve.RecordId, err)
				bugfixRecordObjectTaskLock.Lock()
				if wr, ok := bugfixRecordObjectTask["wrongRecords"].(string); ok {
					bugfixRecordObjectTask["wrongRecords"] = wr + strconv.FormatInt(archieve.RecordId, 10) + ";"
				} else {
					bugfixRecordObjectTask["wrongRecords"] = strconv.FormatInt(archieve.RecordId, 10) + ";"
				}

				bugfixRecordObjectTaskLock.Unlock()

				
				continue
			}
			if !has {
				log.Printf("record %d not found", archieve.RecordId)
				continue
			}
			// 更新ipfsArchieve的correlationId字段
			archieve.CorrelationId = record.CorrelationId
			_, err = adapter.engine.ID(archieve.Id).Update(archieve)
			if err != nil {
				log.Printf("failed to update ipfsArchieve %d: %v", archieve.Id, err)
				setBugfixField("errorInfo", fmt.Sprintf("failed to update ipfsArchieve %d: %v", archieve.Id, err))
				continue
			}
		}

		// 更新已完成数量
		incNowFinishRecordsCount()
		// 休息100毫秒
		time.Sleep(100 * time.Millisecond)
	}
	setBugfixField("status", "finished")
	return nil

}

func ipfsArchieve_clearUpload(taskId, paramas string) error { 
	// 遍历所有ipfsArchieve记录，重新上传到IPFS
	setBugfixField("status", "preparing")
	archieves := []*IpfsArchive{}
	err := adapter.engine.Find(&archieves)
	if err != nil {
		return err
	}
	// 判断是否是test
	// params["isTest"]中可以判断
	isTest := BUGFIX_judgeIsTest(paramas)
	if isTest && len(archieves) > 10 {
		archieves = archieves[:10]
	}
	setBugfixField("allRecords", len(archieves))
	setBugfixField("status", "running")

	
	// 数据准备完成
	
	for _, archieve := range archieves {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return nil
		}

		// 将ipfs数据置为ipfs_address is NULL
		archieve.IpfsAddress = ""
		_, err = adapter.engine.ID(archieve.Id).Update(archieve)
		if err != nil {
			log.Printf("failed to update ipfsArchieve %d: %v", archieve.Id, err)
			// 添加错误记录
			bugfixRecordObjectTaskLock.Lock()
			if wr, ok := bugfixRecordObjectTask["wrongRecords"].(string); ok {
				bugfixRecordObjectTask["wrongRecords"] = wr + strconv.FormatInt(archieve.RecordId, 10) + ";"
			} else {
				bugfixRecordObjectTask["wrongRecords"] = strconv.FormatInt(archieve.RecordId, 10) + ";"
			}
			bugfixRecordObjectTaskLock.Unlock()
			continue
		}

		// 更新已完成数量
		incNowFinishRecordsCount()
		// 休息100毫秒
		time.Sleep(100 * time.Millisecond)
	}
	setBugfixField("status", "finished")
	return nil

}

func ipfsArchieve_clearUpload_by_ipfsAddress(taskId, paramas string) error { 
	// 遍历所有ipfsArchieve记录，重新上传到IPFS
	setBugfixField("status", "preparing")
	archieves := []*IpfsArchive{}
	// 查找ipfs_address为params["ipfsAddress"]
	// 解析params
	var paramsMap map[string]interface{}
	err := json.Unmarshal([]byte(paramas), &paramsMap)
	if err != nil {
		log.Println("failed to parse params")
		setBugfixField("status", "finished")
		setBugfixField("errorInfo", "failed to parse params")
		return err
	}
	ipfsAddress, ok := paramsMap["ipfsAddress"].(string)
	if !ok {
		log.Println("ipfsAddress parameter is required")
		setBugfixField("status", "finished")
		setBugfixField("errorInfo", "ipfsAddress parameter is required")
		return fmt.Errorf("ipfsAddress parameter is required")
	}

	err = adapter.engine.Where("ipfs_address = ?", ipfsAddress).Find(&archieves)
	if err != nil {
		log.Printf("failed to get ipfsArchieve: %v", err)
		// 添加错误记录
		
		setBugfixField("errorInfo", fmt.Sprintf("failed to get ipfsArchieve: %v", err))
		setBugfixField("status", "finished")

		return err
	}
	// 判断是否是test
	// params["isTest"]中可以判断
	isTest := BUGFIX_judgeIsTest(paramas)
	if isTest && len(archieves) > 10 {
		archieves = archieves[:10]
	}
	setBugfixField("allRecords", len(archieves))
	setBugfixField("status", "running")

	
	// 数据准备完成
	
	for _, archieve := range archieves {
		// 检查是否需要停止当前任务
		if getBugfixStopNow() {
			fmt.Println("Bugfix task stopped by user.")
			setBugfixField("status", "finished")
			return nil
		}
		// 将ipfs数据置为ipfs_address is NULL
		archieve.IpfsAddress = ""
		_, err = adapter.engine.ID(archieve.Id).Update(archieve)
		if err != nil {
			log.Printf("failed to update ipfsArchieve %d: %v", archieve.Id, err)
			// 添加错误记录
			bugfixRecordObjectTaskLock.Lock()
			if wr, ok := bugfixRecordObjectTask["wrongRecords"].(string); ok {
				bugfixRecordObjectTask["wrongRecords"] = wr + strconv.FormatInt(archieve.RecordId, 10) + ";"
			} else {
				bugfixRecordObjectTask["wrongRecords"] = strconv.FormatInt(archieve.RecordId, 10) + ";"
			}
			bugfixRecordObjectTaskLock.Unlock()
			
		}
		// 更新已完成数量
		incNowFinishRecordsCount()
		// 休息100毫秒
		time.Sleep(100 * time.Millisecond)
	
	}
	setBugfixField("status", "finished")
	return nil
}