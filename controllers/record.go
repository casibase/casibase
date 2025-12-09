
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

package controllers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)


const (
	RECORD_OBJECT_CHANGE = "record.object.change"
	RECORD_OBJECT_HIDE_CONTENT = "record.object.hide.content"
)

// GetRecords
// @Title GetRecords
// @Tag Record API
// @Description get all records
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Record The Response object
// @router /get-records [get]
func (c *ApiController) GetRecords() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	// 仅管理员可获取自己的
	username := c.GetSessionUsername()
	if username == "" {
		c.ResponseError("Please login first")
		return
	}
	usertag := c.GetSessionUserTag()
	isUserTagAdmin := false

	if usertag == "admin" {
		isUserTagAdmin = true
		username = ""
		// 标识为非管理员时，强制只查询自己的
	}


	if limit == "" || page == "" {
		records, err := []*object.Record{}, error(nil)
		if isUserTagAdmin == false {
			records, err = object.GetRecordsFilterUser(owner,username)
		} else{
			records, err = object.GetRecords(owner)
		}
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		records = HideRecordsObject(records)
		c.ResponseOk(records)
	} else {
		limit, err := util.ParseIntWithError(limit)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		count := int64(0)
		if isUserTagAdmin == false {
			count, err = object.GetRecordCountFilterUser(owner, field, value,username)
		} else {
			count, err = object.GetRecordCount(owner, field, value)
		}
		
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		records := []*object.Record{}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		if isUserTagAdmin == false {
			records, err = object.GetPaginationRecordsFilterUser(owner, paginator.Offset(), limit, field, value, sortField, sortOrder,username)
		} else {
			records, err = object.GetPaginationRecords(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		}
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		records = HideRecordsObject(records)
		c.ResponseOk(records, paginator.Nums())
	}
}

// GetRecord
// @Title GetRecord
// @Tag Record API
// @Description get record
// @Param   id     query    string  true        "The id ( owner/name ) of the record"
// @Success 200 {object} object.Record The Response object
// @router /get-record [get]
func (c *ApiController) GetRecord() {
	id := c.Input().Get("id")

	record, err := object.GetRecord(id, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	record = HideRecordObject(record)
	c.ResponseOk(record)
}

// GetRecordsByActionController 获取指定action的记录，按Id降序
// /get-records-by-action
func (c *ApiController) GetRecordsByAction() {
	action := c.Input().Get("action")
	if action == "" {
		c.ResponseError("action is required")
		return
	}

	records, err := object.GetRecordsByAction(action)
	
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	records = HideRecordsObject(records)
	c.ResponseOk(records)
}

// UpdateRecord
// @Title UpdateRecord
// @Tag Record API
// @Description update record
// @Param   id     query    string  true        "The id ( owner/name ) of the record"
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /update-record [post]
func (c *ApiController) UpdateRecord() {
	id := c.Input().Get("id")

	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateRecord(id, &record, c.GetAcceptLanguage()))
	c.ServeJSON()
}

// AddRecord
// @Title AddRecord
// @Tag Record API
// @Description add a record
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /add-record [post]
func (c *ApiController) AddRecord() {
	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if record.ClientIp == "" {
		record.ClientIp = c.getClientIp()
	}
	if record.UserAgent == "" {
		record.UserAgent = c.getUserAgent()
	}
	if record.Count == 0 {
		record.Count = 1
	}

	c.Data["json"] = wrapActionResponse2(object.AddRecord(&record, c.GetAcceptLanguage()))
	c.ServeJSON()
}

// AddRecords
// @Title AddRecords
// @Tag Record API
// @Description add multiple records
// @Param   body    body   []object.Record  true        "The details of the records"
// @Param   sync    query  string           false       "Set to 'true' or '1' to enable synchronous processing"
// @Success 200 {object} controllers.Response The Response object
// @router /add-records [post]
func (c *ApiController) AddRecords() {
	// Determine synchronous processing
	var syncEnabled bool
	syncParam := strings.ToLower(c.Input().Get("sync"))
	if syncParam == "true" || syncParam == "1" {
		syncEnabled = true
	} else {
		syncEnabled = false
	}
	var records []*object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &records)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}


	if len(records) == 0 {
		c.ResponseError(c.T("controllers:No records to add"))
		return
	}

	clientIp := c.getClientIp()
	userAgent := c.getUserAgent()

	for i := range records {
		if records[i].ClientIp == "" {
			records[i].ClientIp = clientIp
		}
		if records[i].UserAgent == "" {
			records[i].UserAgent = userAgent
		}
		if records[i].Count == 0 {
			records[i].Count = 1
		}
	}

	c.Data["json"] = wrapActionResponse2(object.AddRecords(records, syncEnabled, c.GetAcceptLanguage()))
	c.ServeJSON()
}

// DeleteRecord
// @Title DeleteRecord
// @Tag Record API
// @Description delete a record
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-record [post]
func (c *ApiController) DeleteRecord() {
	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteRecord(&record))
	c.ServeJSON()
}


func HideRecordsObject(records []*object.Record)([]*object.Record) {
	flag , err := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(RECORD_OBJECT_CHANGE,"false")
	if err!=nil || flag == "false" {
		return records
	}

	content , _ := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(RECORD_OBJECT_HIDE_CONTENT,"{\"info\":\"数据进行加密存储，不提供明文显示\"}")
	for _, record := range records {
		record.Object = content
	}
	return records
}

func HideRecordObject(record *object.Record)(*object.Record) {
	flag , err := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(RECORD_OBJECT_CHANGE,"false")
	if err!=nil || flag == "false" {
		return record
	}

	content , _ := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(RECORD_OBJECT_HIDE_CONTENT,"{\"info\":\"数据进行加密存储，不提供明文显示\"}")
	record.Object = content
	return record
}


// GetPatientByHashID
// @Title GetPatientByHashID
// @Tag Record API
// @Description get patient records by hash ID
// @Param   hashId     query    string  true        "The hash ID of the patient"
// @Success 200 {object} []object.Record The Response object
// @router /get-patient-by-hash-id [get]
func (c *ApiController) GetPatientByHashID() {
	hashID := c.Input().Get("hashId")
	if hashID == "" {
		c.ResponseError("hashId参数不能为空")
		return
	}

	// 验证hashID格式（基本长度检查）
	if len(hashID) < 10 {
		c.ResponseError("hashID格式不正确，长度至少为10个字符")
		return
	}

	fmt.Printf("开始查询患者就诊记录，HashID: %s，过滤条件: requestUri=/api/add-outpatient\n", hashID)
		
	// 调试：打印前几条记录的object内容
	// for i, record := range records {
	// 	if i < 3 { // 只打印前3条记录
	// 		fmt.Printf("记录 %d 的object内容: %s\n", i, record.Object)
	// 	}
	// }
	
	records, err := object.GetPatientByHashID(hashID)
	if err != nil {
		fmt.Printf("查询患者就诊记录失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	fmt.Printf("查询到 %d 条就诊记录\n", len(records))
	
	// 医生查询患者记录时不隐藏object内容，因为需要解析医院信息
	// records = HideRecordsObject(records)
	c.ResponseOk(records)
}

// CreateAuthorizationRequest
// @Title CreateAuthorizationRequest
// @Tag Authorization Request API
// @Description create authorization request
// @Param   doctorName     body    string  true        "医生姓名"
// @Param   doctorId       body    string  true        "医生ID"
// @Param   doctorContact   body    string  false       "医生联系方式"
// @Param   patientHashId  body    string  true        "患者HashID"
// @Param   hospitals      body    string  true        "申请的医院列表(JSON格式)"
// @Param   validityPeriod body    int     true        "授权有效期(天数)"
// @Param   dataTimeRangeStart body string false       "数据时间范围开始"
// @Param   dataTimeRangeEnd   body string false       "数据时间范围结束"
// @Param   applicationNote body   string  false       "申请说明"
// @Success 200 {object} object.AuthorizationRequest The Response object
// @router /create-authorization-request [post]
func (c *ApiController) CreateAuthorizationRequest() {
	var requestData struct {
		DoctorName          string `json:"doctorName"`
		DoctorId            string `json:"doctorId"`
		DoctorContact       string `json:"doctorContact"`
		PatientHashId       string `json:"patientHashId"`
		Hospitals           string `json:"hospitals"`
		ValidityPeriod      int    `json:"validityPeriod"`
		DataTimeRangeStart  string `json:"dataTimeRangeStart"`
		DataTimeRangeEnd    string `json:"dataTimeRangeEnd"`
		ApplicationNote     string `json:"applicationNote"`
	}
	
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &requestData)
	if err != nil {
		c.ResponseError(fmt.Sprintf("JSON解析失败: %v", err))
		return
	}

	// 验证必填字段
	if requestData.DoctorName == "" {
		c.ResponseError("医生姓名不能为空")
		return
	}
	if requestData.DoctorId == "" {
		c.ResponseError("医生ID不能为空")
		return
	}
	if requestData.PatientHashId == "" {
		c.ResponseError("患者HashID不能为空")
		return
	}
	if requestData.Hospitals == "" {
		c.ResponseError("申请的医院列表不能为空")
		return
	}
	if requestData.ValidityPeriod <= 0 {
		c.ResponseError("授权有效期必须大于0天")
		return
	}

	// 解析时间范围
	var startTime, endTime *time.Time
	if requestData.DataTimeRangeStart != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", requestData.DataTimeRangeStart); err == nil {
			startTime = &t
		} else {
			fmt.Printf("解析开始时间失败: %v\n", err)
		}
	}
	if requestData.DataTimeRangeEnd != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", requestData.DataTimeRangeEnd); err == nil {
			endTime = &t
		} else {
			fmt.Printf("解析结束时间失败: %v\n", err)
		}
	}

	// 创建授权请求对象
	request := &object.AuthorizationRequest{
		DoctorName:          requestData.DoctorName,
		DoctorId:            requestData.DoctorId,
		DoctorContact:       requestData.DoctorContact,
		PatientHashId:       requestData.PatientHashId,
		Hospitals:           requestData.Hospitals,
		ValidityPeriod:      requestData.ValidityPeriod,
		DataTimeRangeStart:  startTime,
		DataTimeRangeEnd:    endTime,
		ApplicationNote:     requestData.ApplicationNote,
	}

	// 生成八位随机数
	generateRandomString := func(length int) string {
		const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
		result := make([]byte, length)
		for i := 0; i < length; i++ {
			result[i] = chars[rand.Intn(len(chars))]
		}
		return string(result)
	}

	// 生成请求ID
	request.RequestId = fmt.Sprintf("AR_%d_%s", time.Now().Unix(), generateRandomString(8))
	request.Status = "pending"
	request.CreatedTime = time.Now()
	request.UpdatedTime = time.Now()

	fmt.Printf("创建授权请求: 医生=%s, 患者HashID=%s, 医院数量=%d\n", 
		request.DoctorName, request.PatientHashId, len(request.Hospitals))

	success, err := object.AddAuthorizationRequest(request)
	if err != nil {
		fmt.Printf("创建授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("创建失败: %v", err))
		return
	}

	if success {
		fmt.Printf("授权请求创建成功，请求ID: %s\n", request.RequestId)
		c.ResponseOk(request)
	} else {
		c.ResponseError("创建失败")
	}
}

// GetPatientAuthorizationRequests
// @Title GetPatientAuthorizationRequests
// @Tag Authorization Request API
// @Description get patient's pending authorization requests
// @Param   patientId     query    string  true        "患者ID"
// @Success 200 {object} []object.AuthorizationRequest The Response object
// @router /get-patient-authorization-requests [get]
func (c *ApiController) GetPatientAuthorizationRequests() {
	patientId := c.Input().Get("patientId")
	if patientId == "" {
		c.ResponseError("患者ID不能为空")
		return
	}

	fmt.Printf("查询患者待审批授权请求，患者ID: %s\n", patientId)
	
	// 根据患者ID查询待审批的授权请求（只查询pending状态）
	requests, err := object.GetAuthorizationRequestsByPatientId(patientId)
	if err != nil {
		fmt.Printf("查询患者授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	// 过滤出待审批的请求（只返回pending状态）
	var pendingRequests []*object.AuthorizationRequest
	for _, request := range requests {
		if request.Status == "pending" {
			pendingRequests = append(pendingRequests, request)
		}
	}
	
	fmt.Printf("查询到 %d 条待审批的授权请求\n", len(pendingRequests))
	c.ResponseOk(pendingRequests)
}


// ProcessAuthorizationRequest
// @Title ProcessAuthorizationRequest
// @Tag Authorization Request API
// @Description approve or reject authorization request
// @Param   requestId     body    string  true        "请求ID"
// @Param   action        body    string  true        "操作: approve/reject"
// @Param   reason        body    string  false       "拒绝原因"
// @Success 200 {object} object.AuthorizationRequest The Response object
// @router /process-authorization-request [post]
func (c *ApiController) ProcessAuthorizationRequest() {
	var requestData struct {
		RequestId string `json:"requestId"`
		Action    string `json:"action"`
		Reason    string `json:"reason"`
	}
	
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &requestData)
	if err != nil {
		c.ResponseError(fmt.Sprintf("JSON解析失败: %v", err))
		return
	}

	if requestData.RequestId == "" {
		c.ResponseError("请求ID不能为空")
		return
	}
	
	if requestData.Action != "approve" && requestData.Action != "reject" {
		c.ResponseError("操作类型必须是approve或reject")
		return
	}

	fmt.Printf("处理授权请求: ID=%s, 操作=%s\n", requestData.RequestId, requestData.Action)
	
	// 获取授权请求
	request, err := object.GetAuthorizationRequestByRequestId(requestData.RequestId)
	if err != nil {
		fmt.Printf("获取授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("获取请求失败: %v", err))
		return
	}
	
	if request == nil {
		c.ResponseError("授权请求不存在")
		return
	}
	
	if request.Status != "pending" {
		c.ResponseError("该请求已被处理")
		return
	}

	// 更新请求状态
	now := time.Now()
	request.Status = requestData.Action + "d" // approved/rejected
	request.ProcessedTime = &now
	request.UpdatedTime = now
	
	if requestData.Action == "reject" {
		request.RejectReason = requestData.Reason
	}

	success, err := object.UpdateAuthorizationRequest(request)
	if err != nil {
		fmt.Printf("更新授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("处理失败: %v", err))
		return
	}

	if success {
		fmt.Printf("授权请求处理成功: %s\n", requestData.Action)
		c.ResponseOk(request)
	} else {
		c.ResponseError("处理失败")
	}
}

// GetDoctorAuthorizationRequests
// @Title GetDoctorAuthorizationRequests
// @Tag Authorization Request API
// @Description get doctor's authorization requests history
// @Param   doctorId     query    string  true        "医生ID"
// @Param   patientHashId query   string  false       "患者HashID（可选，用于过滤特定患者的申请）"
// @Success 200 {object} []object.AuthorizationRequest The Response object
// @router /get-doctor-authorization-requests [get]
func (c *ApiController) GetDoctorAuthorizationRequests() {
	doctorId := c.Input().Get("doctorId")
	patientHashId := c.Input().Get("patientHashId")
	
	if doctorId == "" {
		c.ResponseError("医生ID不能为空")
		return
	}

	fmt.Printf("查询医生授权请求历史，医生ID: %s", doctorId)
	if patientHashId != "" {
		fmt.Printf(", 患者HashID: %s", patientHashId)
	}
	fmt.Println()
	
	// 根据医生ID查询所有授权请求
	requests, err := object.GetAuthorizationRequestsByDoctorId(doctorId)
	if err != nil {
		fmt.Printf("查询医生授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	// 如果指定了患者HashID，则过滤出该患者的申请
	var filteredRequests []*object.AuthorizationRequest
	if patientHashId != "" {
		for _, request := range requests {
			if request.PatientHashId == patientHashId {
				filteredRequests = append(filteredRequests, request)
			}
		}
		fmt.Printf("过滤后得到 %d 条该患者的申请记录\n", len(filteredRequests))
		c.ResponseOk(filteredRequests)
	} else {
		fmt.Printf("查询到 %d 条授权请求\n", len(requests))
		c.ResponseOk(requests)
	}
}

// GetPatientAuthorizationHistory
// @Title GetPatientAuthorizationHistory
// @Tag Authorization Request API
// @Description get patient's authorization history (approved/rejected)
// @Param   patientId     query    string  true        "患者ID"
// @Success 200 {object} []object.AuthorizationRequest The Response object
// @router /get-patient-authorization-history [get]
func (c *ApiController) GetPatientAuthorizationHistory() {
	patientId := c.Input().Get("patientId")
	if patientId == "" {
		c.ResponseError("患者ID不能为空")
		return
	}

	fmt.Printf("查询患者授权历史，患者ID: %s\n", patientId)
	
	// 根据患者ID查询所有授权请求
	requests, err := object.GetAuthorizationRequestsByPatientId(patientId)
	if err != nil {
		fmt.Printf("查询患者授权历史失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	fmt.Printf("查询到 %d 条授权请求\n", len(requests))
	
	// 过滤出已处理的请求（非pending状态）
	var processedRequests []*object.AuthorizationRequest
	for _, request := range requests {
		fmt.Printf("请求状态: %s, 患者HashID: %s\n", request.Status, request.PatientHashId)
		if request.Status != "pending" {
			processedRequests = append(processedRequests, request)
		}
	}
	
	fmt.Printf("过滤后得到 %d 条已处理的授权请求\n", len(processedRequests))
	c.ResponseOk(processedRequests)
}

// DebugAuthorizationRequests
// @Title DebugAuthorizationRequests
// @Tag Authorization Request API
// @Description debug all authorization requests
// @Success 200 {object} []object.AuthorizationRequest The Response object
// @router /debug-authorization-requests [get]
func (c *ApiController) DebugAuthorizationRequests() {
	fmt.Printf("调试：查询所有授权请求\n")
	
	requests, err := object.GetAllAuthorizationRequests()
	if err != nil {
		fmt.Printf("查询所有授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	fmt.Printf("数据库中总共有 %d 条授权请求\n", len(requests))
	for i, request := range requests {
		fmt.Printf("请求 %d: ID=%s, 医生=%s, 患者HashID=%s, 状态=%s\n", 
			i+1, request.RequestId, request.DoctorName, request.PatientHashId, request.Status)
	}
	
	c.ResponseOk(requests)
}

// GetAuthorizedPatientRecords
// @Title GetAuthorizedPatientRecords
// @Tag Authorization Request API
// @Description get authorized patient's medical records
// @Param   doctorId     query    string  true        "医生ID"
// @Success 200 {object} []object.Record The Response object
// @router /get-authorized-patient-records [get]
func (c *ApiController) GetAuthorizedPatientRecords() {
	doctorId := c.Input().Get("doctorId")
	if doctorId == "" {
		c.ResponseError("医生ID不能为空")
		return
	}

	fmt.Printf("查询已授权患者的就诊记录，医生ID: %s\n", doctorId)
	
	// 获取该医生的所有已授权的请求
	requests, err := object.GetAuthorizationRequestsByDoctorId(doctorId)
	if err != nil {
		fmt.Printf("查询医生授权请求失败: %v\n", err)
		c.ResponseError(fmt.Sprintf("查询失败: %v", err))
		return
	}
	
	// 过滤出已授权的请求
	var authorizedRequests []*object.AuthorizationRequest
	for _, request := range requests {
		if request.Status == "approved" {
			authorizedRequests = append(authorizedRequests, request)
		}
	}
	
	fmt.Printf("找到 %d 条已授权的请求\n", len(authorizedRequests))
	
	// 获取所有已授权患者的就诊记录
	var allRecords []*object.Record
	for _, request := range authorizedRequests {
		records, err := object.GetPatientByHashID(request.PatientHashId)
		if err != nil {
			fmt.Printf("获取患者 %s 的就诊记录失败: %v\n", request.PatientHashId, err)
			continue
		}
		allRecords = append(allRecords, records...)
	}
	
	fmt.Printf("获取到 %d 条已授权患者的就诊记录\n", len(allRecords))
	c.ResponseOk(allRecords)
}