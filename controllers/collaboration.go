// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/object"
	// "github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/util"
	"github.com/google/uuid"
)

// CreateCollaborationRequest
// @Title CreateCollaborationRequest
// @Tag Collaboration API
// @Description 创建协同诊疗请求
// @Param   body     body   object.CollaborationRequest  true        "collaboration request info"
// @Success 200 {object} Response The Response object
// @router /create-collaboration-request [post]
func (c *ApiController) CreateCollaborationRequest() {
	var request object.CollaborationRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &request)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// // 若提供了 patientHashId，则尝试从 record 表解析最新一条对象信息，填充患者冗余字段
	// if strings.TrimSpace(request.PatientHashId) != "" && strings.TrimSpace(request.PatientName) == "" {
	// 	if brief, e := object.GetLatestPatientBriefByHashID(request.PatientHashId); e == nil && brief != nil {
	// 		if request.PatientName == "" && brief.PatientName != "" {
	// 			request.PatientName = brief.PatientName
	// 		}
	// 		// InitiatorHospital 已由发起方提供；此处不覆盖，仅在需要时可根据 section / unit 做兜底
	// 		// 可按需扩展更多冗余字段
	// 	}
	// }

	// 生成唯一的请求ID
	request.RequestId = fmt.Sprintf("collab-%s", uuid.New().String())
	request.CreatedTime = time.Now()
	request.UpdatedTime = time.Now()
	request.Status = "active"

	success, err := object.AddCollaborationRequest(&request)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError("Failed to create collaboration request")
		return
	}

	// 上链：创建Record记录并上链（同步执行，确保上链成功）
	// 使用与系统自动记录一致的 Organization 和 User，这样 record 页面才能显示
	casdoorOrganization := conf.GetConfigString("casdoorOrganization")
	if casdoorOrganization == "" {
		casdoorOrganization = "casibase"
	}
	// 获取当前登录用户的 username（与系统自动记录一致）
	currentUsername := c.GetSessionUsername()
	if currentUsername == "" {
		// 如果没有登录用户，使用 InitiatorDoctorId
		currentUsername = request.InitiatorDoctorId
	}
	record := &object.Record{
		Owner:        casdoorOrganization, // 使用与系统自动记录一致的 owner
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTimeWithMilli(),
		Organization: casdoorOrganization, // 使用与系统自动记录一致的 organization
		ClientIp:     c.getClientIp(),    // 设置客户端 IP
		UserAgent:   c.getUserAgent(),    // 设置 User Agent
		User:         currentUsername,     // 使用当前登录用户（与系统自动记录一致），这样 record 页面才能显示
		Method:       "POST",
		RequestUri:   "/api/create-collaboration-request",
		Action:       "create-collaboration-request",
		Object:       util.StructToJson(request), // Object 中包含 InitiatorDoctorId，可以从这里获取发起方信息
		NeedCommit:   true,
	}

	success, result, err := object.AddRecord(record, "zh")
	if err != nil {
		fmt.Printf("Failed to add collaboration request record: %v\n", err)
		c.ResponseError(fmt.Sprintf("创建记录失败: %v", err))
		return
	}

	if !success {
		c.ResponseError("创建记录失败")
		return
	}

	// AddRecord 内部已经处理了 NeedCommit，检查返回结果
	fmt.Printf("AddRecord result type: %T, value: %+v\n", result, result)
	fmt.Printf("Record after AddRecord: Id=%d, Name=%s, NeedCommit=%v\n", record.Id, record.Name, record.NeedCommit)
	if resultMap, ok := result.(map[string]interface{}); ok {
		fmt.Printf("Result map: %+v\n", resultMap)
		if errorText, exists := resultMap["error_text"]; exists && errorText != nil && errorText != "" {
			fmt.Printf("上链失败，错误信息: %v\n", errorText)
			c.ResponseError(fmt.Sprintf("上链失败: %v", errorText))
			return
		}
		if block, exists := resultMap["block"]; exists && block != nil && block != "" {
			fmt.Printf("Collaboration request committed to blockchain: %s, block: %v\n", record.Name, block)
		} else {
			fmt.Printf("警告: AddRecord 返回结果中没有 block 字段，尝试手动上链。record.Id=%d\n", record.Id)
			// 如果 AddRecord 内部没有上链成功，手动上链
			var dbRecord *object.Record
			if record.Id > 0 {
				dbRecord = record
			} else {
				// 通过 owner/name 获取记录
				recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
				var err error
				dbRecord, err = object.GetRecord(recordId, "zh")
				if err != nil || dbRecord == nil {
					fmt.Printf("警告: 无法从数据库获取记录，记录ID: %s, 错误: %v\n", recordId, err)
					c.ResponseError(fmt.Sprintf("获取记录失败，无法上链"))
					return
				}
			}
			_, _, err := object.CommitRecord(dbRecord, "zh")
			if err != nil {
				fmt.Printf("Failed to commit collaboration request to blockchain: %v\n", err)
				c.ResponseError(fmt.Sprintf("上链失败: %v", err))
				return
			}
			fmt.Printf("Collaboration request committed to blockchain: %s\n", record.Name)
		}
	} else {
		fmt.Printf("警告: AddRecord 返回结果不是 map[string]interface{} 类型: %T\n", result)
		// 如果返回结果不是预期的类型，尝试手动上链
		var dbRecord *object.Record
		if record.Id > 0 {
			dbRecord = record
		} else {
			// 通过 owner/name 获取记录
			recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
			var err error
			dbRecord, err = object.GetRecord(recordId, "zh")
			if err != nil || dbRecord == nil {
				fmt.Printf("警告: 无法从数据库获取记录，记录ID: %s, 错误: %v\n", recordId, err)
				c.ResponseError(fmt.Sprintf("获取记录失败，无法上链"))
				return
			}
		}
		_, _, err := object.CommitRecord(dbRecord, "zh")
		if err != nil {
			fmt.Printf("Failed to commit collaboration request to blockchain: %v\n", err)
			c.ResponseError(fmt.Sprintf("上链失败: %v", err))
			return
		}
		fmt.Printf("Collaboration request committed to blockchain: %s\n", record.Name)
	}

	c.ResponseOk(request)
}

// GetCollaborationRequestsByDoctor
// @Title GetCollaborationRequestsByDoctor
// @Tag Collaboration API
// @Description 获取医生的协同诊疗请求（发起的）
// @Param   doctorId     query    string  true        "doctor id"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-requests-by-doctor [get]
func (c *ApiController) GetCollaborationRequestsByDoctor() {
	doctorId := c.Input().Get("doctorId")
	if doctorId == "" {
		c.ResponseError("doctorId is required")
		return
	}

	requests, err := object.GetCollaborationRequestsByInitiatorDoctorId(doctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(requests)
}

// GetCollaborationRequestsByHospital
// @Title GetCollaborationRequestsByHospital
// @Tag Collaboration API
// @Description 获取针对某医院的协同诊疗请求（包括已关闭的），排除当前医生自己发起的请求
// @Param   hospitalName     query    string  true        "hospital name"
// @Param   excludeDoctorId     query    string  false        "doctor id to exclude (current doctor id)"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-requests-by-hospital [get]
func (c *ApiController) GetCollaborationRequestsByHospital() {
	hospitalName := c.Input().Get("hospitalName")
	if hospitalName == "" {
		c.ResponseError("hospitalName is required")
		return
	}

	excludeDoctorId := c.Input().Get("excludeDoctorId")
	requests, err := object.GetCollaborationRequestsByTargetHospital(hospitalName, excludeDoctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(requests)
}

// GetCollaborationRequestsByTargetDoctor
// @Title GetCollaborationRequestsByTargetDoctor
// @Tag Collaboration API
// @Description 获取针对某医生的协同诊疗请求（包括已关闭的）
// @Param   doctorId     query    string  true        "doctor id"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-requests-by-target-doctor [get]
func (c *ApiController) GetCollaborationRequestsByTargetDoctor() {
	doctorId := c.Input().Get("doctorId")
	if doctorId == "" {
		c.ResponseError("doctorId is required")
		return
	}

	requests, err := object.GetCollaborationRequestsByTargetDoctor(doctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(requests)
}

// GetCollaborationRequest
// @Title GetCollaborationRequest
// @Tag Collaboration API
// @Description 获取单个协同诊疗请求详情
// @Param   requestId     query    string  true        "request id"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-request [get]
func (c *ApiController) GetCollaborationRequest() {
	requestId := c.Input().Get("requestId")
	if requestId == "" {
		c.ResponseError("requestId is required")
		return
	}

	request, err := object.GetCollaborationRequestByRequestId(requestId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if request == nil {
		c.ResponseError("Request not found")
		return
	}

	c.ResponseOk(request)
}

// UpdateCollaborationRequestStatus
// @Title UpdateCollaborationRequestStatus
// @Tag Collaboration API
// @Description 更新协同诊疗请求状态
// @Param   body     body   map[string]string  true        "request info"
// @Success 200 {object} Response The Response object
// @router /update-collaboration-request-status [post]
func (c *ApiController) UpdateCollaborationRequestStatus() {
	var params map[string]string
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &params)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	requestId := params["requestId"]
	status := params["status"]

	if requestId == "" || status == "" {
		c.ResponseError("requestId and status are required")
		return
	}

	request, err := object.GetCollaborationRequestByRequestId(requestId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if request == nil {
		c.ResponseError("Request not found")
		return
	}

	request.Status = status
	request.UpdatedTime = time.Now()

	success, err := object.UpdateCollaborationRequest(request)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError("Failed to update collaboration request")
		return
	}

	// 上链：创建Record记录并上链（同步执行，确保上链成功）
	// 使用与系统自动记录一致的 Organization 和 User，这样 record 页面才能显示
	casdoorOrganization := conf.GetConfigString("casdoorOrganization")
	if casdoorOrganization == "" {
		casdoorOrganization = "casibase"
	}
	// 获取当前登录用户的 username（与系统自动记录一致）
	currentUsername := c.GetSessionUsername()
	if currentUsername == "" {
		// 如果没有登录用户，使用 InitiatorDoctorId
		currentUsername = request.InitiatorDoctorId
	}
	record := &object.Record{
		Owner:        casdoorOrganization, // 使用与系统自动记录一致的 owner
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTimeWithMilli(),
		Organization: casdoorOrganization, // 使用与系统自动记录一致的 organization
		ClientIp:     c.getClientIp(),    // 设置客户端 IP
		UserAgent:   c.getUserAgent(),    // 设置 User Agent
		User:         currentUsername,     // 使用当前登录用户（与系统自动记录一致），这样 record 页面才能显示
		Method:       "POST",
		RequestUri:   "/api/update-collaboration-request-status",
		Action:       fmt.Sprintf("update-collaboration-request-status-%s", status),
		Object:       util.StructToJson(request), // Object 中包含 InitiatorDoctorId，可以从这里获取发起方信息
		NeedCommit:   true,
	}

	success, result, err := object.AddRecord(record, "zh")
	if err != nil {
		fmt.Printf("Failed to add collaboration request status update record: %v\n", err)
		// 这里不返回错误，因为状态更新已经成功，上链失败只记录日志
	} else if success {
		// AddRecord 内部已经处理了 NeedCommit，检查返回结果
		fmt.Printf("AddRecord result type: %T, value: %+v\n", result, result)
		fmt.Printf("Record after AddRecord: Id=%d, Name=%s, NeedCommit=%v\n", record.Id, record.Name, record.NeedCommit)
		if resultMap, ok := result.(map[string]interface{}); ok {
			fmt.Printf("Result map: %+v\n", resultMap)
			if block, exists := resultMap["block"]; exists && block != nil && block != "" {
				fmt.Printf("Collaboration request status update committed to blockchain: %s, block: %v\n", record.Name, block)
			} else {
				fmt.Printf("警告: AddRecord 返回结果中没有 block 字段，尝试手动上链。record.Id=%d\n", record.Id)
				// 如果 AddRecord 内部没有上链成功，手动上链
				var dbRecord *object.Record
				if record.Id > 0 {
					dbRecord = record
				} else {
					// 通过 owner/name 获取记录
					recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
					var err error
					dbRecord, err = object.GetRecord(recordId, "zh")
					if err != nil || dbRecord == nil {
						fmt.Printf("警告: 无法从数据库获取记录，记录ID: %s, 错误: %v\n", recordId, err)
					}
				}
				if dbRecord != nil {
					_, _, err := object.CommitRecord(dbRecord, "zh")
					if err != nil {
						fmt.Printf("Failed to commit collaboration request status update to blockchain: %v\n", err)
					} else {
						fmt.Printf("Collaboration request status update committed to blockchain: %s\n", record.Name)
					}
				}
			}
		}
	}

	c.ResponseOk(request)
}

// SubmitDiagnosisOpinion
// @Title SubmitDiagnosisOpinion
// @Tag Collaboration API
// @Description 提交诊疗意见
// @Param   body     body   object.DiagnosisOpinion  true        "diagnosis opinion info"
// @Success 200 {object} Response The Response object
// @router /submit-diagnosis-opinion [post]
func (c *ApiController) SubmitDiagnosisOpinion() {
	var opinion object.DiagnosisOpinion
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &opinion)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 直接创建新意见（允许同一医生提交多条意见）
	opinion.OpinionId = fmt.Sprintf("opinion-%s", uuid.New().String())
	opinion.CreatedTime = time.Now()
	opinion.UpdatedTime = time.Now()
	opinion.Status = "submitted"

	success, err := object.AddDiagnosisOpinion(&opinion)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError("Failed to submit diagnosis opinion")
		return
	}

	// 上链：创建Record记录并上链（同步执行，确保上链成功）
	// 使用与系统自动记录一致的 Organization 和 User，这样 record 页面才能显示
	casdoorOrganization := conf.GetConfigString("casdoorOrganization")
	if casdoorOrganization == "" {
		casdoorOrganization = "casibase"
	}
	// 获取当前登录用户的 username（与系统自动记录一致）
	currentUsername := c.GetSessionUsername()
	if currentUsername == "" {
		// 如果没有登录用户，使用 opinion.DoctorId
		currentUsername = opinion.DoctorId
	}
	record := &object.Record{
		Owner:        casdoorOrganization, // 使用与系统自动记录一致的 owner
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTimeWithMilli(),
		Organization: casdoorOrganization, // 使用与系统自动记录一致的 organization
		ClientIp:     c.getClientIp(),    // 设置客户端 IP
		UserAgent:   c.getUserAgent(),    // 设置 User Agent
		User:         currentUsername,     // 使用当前登录用户（与系统自动记录一致），这样 record 页面才能显示
		Method:       "POST",
		RequestUri:   "/api/submit-diagnosis-opinion",
		Action:       "submit-diagnosis-opinion",
		Object:       util.StructToJson(opinion), // Object 中包含 DoctorId，可以从这里获取操作者信息
		NeedCommit:   true,
	}

	success, result, err := object.AddRecord(record, "zh")
	if err != nil {
		fmt.Printf("Failed to add diagnosis opinion record: %v\n", err)
		c.ResponseError(fmt.Sprintf("创建记录失败: %v", err))
		return
	}

	if !success {
		c.ResponseError("创建记录失败")
		return
	}

	// AddRecord 内部已经处理了 NeedCommit，检查返回结果
	fmt.Printf("AddRecord result type: %T, value: %+v\n", result, result)
	fmt.Printf("Record after AddRecord: Id=%d, Name=%s, NeedCommit=%v\n", record.Id, record.Name, record.NeedCommit)
	if resultMap, ok := result.(map[string]interface{}); ok {
		fmt.Printf("Result map: %+v\n", resultMap)
		if errorText, exists := resultMap["error_text"]; exists && errorText != nil && errorText != "" {
			fmt.Printf("上链失败，错误信息: %v\n", errorText)
			c.ResponseError(fmt.Sprintf("上链失败: %v", errorText))
			return
		}
		if block, exists := resultMap["block"]; exists && block != nil && block != "" {
			fmt.Printf("Diagnosis opinion committed to blockchain: %s, block: %v\n", record.Name, block)
		} else {
			fmt.Printf("警告: AddRecord 返回结果中没有 block 字段，尝试手动上链。record.Id=%d\n", record.Id)
			// 如果 AddRecord 内部没有上链成功，手动上链
			var dbRecord *object.Record
			if record.Id > 0 {
				dbRecord = record
			} else {
				// 通过 owner/name 获取记录
				recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
				var err error
				dbRecord, err = object.GetRecord(recordId, "zh")
				if err != nil || dbRecord == nil {
					fmt.Printf("警告: 无法从数据库获取记录，记录ID: %s, 错误: %v\n", recordId, err)
					c.ResponseError(fmt.Sprintf("获取记录失败，无法上链"))
					return
				}
			}
			_, _, err := object.CommitRecord(dbRecord, "zh")
			if err != nil {
				fmt.Printf("Failed to commit diagnosis opinion to blockchain: %v\n", err)
				c.ResponseError(fmt.Sprintf("上链失败: %v", err))
				return
			}
			fmt.Printf("Diagnosis opinion committed to blockchain: %s\n", record.Name)
		}
	} else {
		fmt.Printf("警告: AddRecord 返回结果不是 map[string]interface{} 类型: %T\n", result)
		// 如果返回结果不是预期的类型，尝试手动上链
		var dbRecord *object.Record
		if record.Id > 0 {
			dbRecord = record
		} else {
			// 通过 owner/name 获取记录
			recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
			var err error
			dbRecord, err = object.GetRecord(recordId, "zh")
			if err != nil || dbRecord == nil {
				fmt.Printf("警告: 无法从数据库获取记录，记录ID: %s, 错误: %v\n", recordId, err)
				c.ResponseError(fmt.Sprintf("获取记录失败，无法上链"))
				return
			}
		}
		_, _, err := object.CommitRecord(dbRecord, "zh")
		if err != nil {
			fmt.Printf("Failed to commit diagnosis opinion to blockchain: %v\n", err)
			c.ResponseError(fmt.Sprintf("上链失败: %v", err))
			return
		}
		fmt.Printf("Diagnosis opinion committed to blockchain: %s\n", record.Name)
	}

	c.ResponseOk(opinion)
}

// GetDiagnosisOpinionsByCollaborationReq
// @Title GetDiagnosisOpinionsByCollaborationReq
// @Tag Collaboration API
// @Description 获取协同诊疗请求的所有诊疗意见
// @Param   requestId     query    string  true        "collaboration request id"
// @Success 200 {object} Response The Response object
// @router /get-diagnosis-opinions-by-request [get]
func (c *ApiController) GetDiagnosisOpinionsByCollaborationReq() {
	requestId := c.Input().Get("requestId")
	if requestId == "" {
		c.ResponseError("requestId is required")
		return
	}

	opinions, err := object.GetDiagnosisOpinionsByCollaborationReqId(requestId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(opinions)
}

// GetDiagnosisOpinionsByDoctor
// @Title GetDiagnosisOpinionsByDoctor
// @Tag Collaboration API
// @Description 获取医生在某个协同诊疗请求中的所有诊疗意见
// @Param   requestId     query    string  true        "collaboration request id"
// @Param   doctorId     query    string  true        "doctor id"
// @Success 200 {object} Response The Response object
// @router /get-diagnosis-opinions-by-doctor [get]
func (c *ApiController) GetDiagnosisOpinionsByDoctor() {
	requestId := c.Input().Get("requestId")
	doctorId := c.Input().Get("doctorId")

	if requestId == "" || doctorId == "" {
		c.ResponseError("requestId and doctorId are required")
		return
	}

	opinions, err := object.GetDiagnosisOpinionsByCollaborationReqIdAndDoctorId(requestId, doctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(opinions)
}

// CreateCollaborationKnowledgeRequest
// @Title CreateCollaborationKnowledgeRequest
// @Tag Collaboration API
// @Description 创建协同诊疗知识请求（知识上链场景）
// @Param   body     body   object.CollaborationRequest  true        "collaboration knowledge request info"
// @Success 200 {object} Response The Response object
// @router /create-collaboration-knowledge-request [post]
func (c *ApiController) CreateCollaborationKnowledgeRequest() {
	var request object.CollaborationRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &request)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 生成唯一的请求ID
	request.RequestId = fmt.Sprintf("collab-knowledge-%s", uuid.New().String())
	request.CreatedTime = time.Now()
	request.UpdatedTime = time.Now()
	request.Status = "active"

	success, err := object.AddCollaborationRequest(&request)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError("Failed to create collaboration knowledge request")
		return
	}

	// 上链：创建Record记录并上链（同步执行，确保上链成功）
	// 使用与系统自动记录一致的 Organization 和 User，这样 record 页面才能显示
	casdoorOrganization := conf.GetConfigString("casdoorOrganization")
	if casdoorOrganization == "" {
		casdoorOrganization = "casibase"
	}
	// 获取当前登录用户的 username（与系统自动记录一致）
	currentUsername := c.GetSessionUsername()
	if currentUsername == "" {
		// 如果没有登录用户，使用 InitiatorDoctorId
		currentUsername = request.InitiatorDoctorId
	}
	record := &object.Record{
		Owner:        casdoorOrganization, // 使用与系统自动记录一致的 owner
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTimeWithMilli(),
		Organization: casdoorOrganization, // 使用与系统自动记录一致的 organization
		ClientIp:     c.getClientIp(),      // 设置客户端 IP
		UserAgent:   c.getUserAgent(),      // 设置 User Agent
		User:         currentUsername,      // 使用当前登录用户（与系统自动记录一致），这样 record 页面才能显示
		Method:       "POST",
		RequestUri:   "/api/create-collaboration-knowledge-request",
		Action:       "create-collaboration-knowledge-request",
		Object:       util.StructToJson(request), // Object 中包含 InitiatorDoctorId，可以从这里获取发起方信息
		NeedCommit:   true,
	}

	success, _, err = object.AddRecord(record, "zh")
	if err != nil {
		fmt.Printf("Failed to add collaboration knowledge request record: %v\n", err)
		c.ResponseError(fmt.Sprintf("创建记录失败: %v", err))
		return
	}

	if !success {
		c.ResponseError("创建记录失败")
		return
	}

	// 强制手动上链，确保上链成功
	fmt.Printf("[上链] AddRecord 完成，record.Id=%d, Name=%s, Owner=%s\n", record.Id, record.Name, record.Owner)
	
	// 获取记录（如果 record.Id 为 0，通过 owner/name 获取）
	var dbRecord *object.Record
	if record.Id > 0 {
		dbRecord = record
		fmt.Printf("[上链] 使用 record.Id=%d\n", record.Id)
	} else {
		recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
		fmt.Printf("[上链] record.Id 为 0，通过 owner/name 获取记录: %s\n", recordId)
		var err error
		dbRecord, err = object.GetRecord(recordId, "zh")
		if err != nil || dbRecord == nil {
			fmt.Printf("[上链] 错误: 无法获取记录: %v\n", err)
			c.ResponseError(fmt.Sprintf("获取记录失败: %v", err))
			return
		}
		fmt.Printf("[上链] 成功获取记录，Id=%d\n", dbRecord.Id)
	}
	
	// 检查是否已经上链
	if dbRecord.Block != "" {
		fmt.Printf("[上链] 记录已上链，block=%s\n", dbRecord.Block)
	} else {
		// 手动上链
		fmt.Printf("[上链] 开始手动上链...\n")
		commitSuccess, commitResult, err := object.CommitRecord(dbRecord, "zh")
		if err != nil {
			fmt.Printf("[上链] 错误: 上链失败: %v\n", err)
			c.ResponseError(fmt.Sprintf("上链失败: %v", err))
			return
		}
		if commitSuccess {
			if commitResult != nil {
				if block, ok := commitResult["block"]; ok && block != nil && block != "" {
					fmt.Printf("[上链] 成功: block=%v\n", block)
					// 验证数据库是否已更新：重新获取记录检查 block 字段
					verifyRecordId := fmt.Sprintf("%s/%s", dbRecord.Owner, dbRecord.Name)
					if dbRecord.Id > 0 {
						verifyRecordId = fmt.Sprintf("%s/%d", dbRecord.Owner, dbRecord.Id)
					}
					verifyRecord, verifyErr := object.GetRecord(verifyRecordId, "zh")
					if verifyErr == nil && verifyRecord != nil {
						if verifyRecord.Block != "" {
							fmt.Printf("[上链] 验证成功: 数据库中的 block=%s\n", verifyRecord.Block)
						} else {
							fmt.Printf("[上链] 警告: 数据库中的 block 仍为空，更新可能失败\n")
						}
					} else {
						fmt.Printf("[上链] 警告: 无法验证数据库更新: %v\n", verifyErr)
					}
				} else {
					fmt.Printf("[上链] 警告: CommitRecord 返回成功但 block 为空: %+v\n", commitResult)
				}
			} else {
				fmt.Printf("[上链] 警告: CommitRecord 返回成功但结果为 nil\n")
			}
		} else {
			fmt.Printf("[上链] 警告: CommitRecord 返回 commitSuccess=false\n")
		}
	}

	c.ResponseOk(request)
}

// GetCollaborationKnowledgeRequestsByDoctor
// @Title GetCollaborationKnowledgeRequestsByDoctor
// @Tag Collaboration API
// @Description 获取医生发起的协同诊疗知识请求
// @Param   doctorId     query    string  true        "doctor id"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-knowledge-requests-by-doctor [get]
func (c *ApiController) GetCollaborationKnowledgeRequestsByDoctor() {
	doctorId := c.Input().Get("doctorId")
	if doctorId == "" {
		c.ResponseError("doctorId is required")
		return
	}

	requests, err := object.GetCollaborationRequestsByInitiatorDoctorId(doctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 过滤出知识上链相关的请求（有DiseaseName的）
	knowledgeRequests := []*object.CollaborationRequest{}
	for _, req := range requests {
		if req.DiseaseName != "" {
			knowledgeRequests = append(knowledgeRequests, req)
		}
	}

	c.ResponseOk(knowledgeRequests)
}

// GetCollaborationKnowledgeRequestsByHospital
// @Title GetCollaborationKnowledgeRequestsByHospital
// @Tag Collaboration API
// @Description 获取针对某医院的协同诊疗知识请求，排除当前医生自己发起的请求
// @Param   hospitalName     query    string  true        "hospital name"
// @Param   excludeDoctorId     query    string  false        "doctor id to exclude (current doctor id)"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-knowledge-requests-by-hospital [get]
func (c *ApiController) GetCollaborationKnowledgeRequestsByHospital() {
	hospitalName := c.Input().Get("hospitalName")
	if hospitalName == "" {
		c.ResponseError("hospitalName is required")
		return
	}

	excludeDoctorId := c.Input().Get("excludeDoctorId")
	requests, err := object.GetCollaborationRequestsByTargetHospital(hospitalName, excludeDoctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 过滤出知识上链相关的请求（有DiseaseName的）
	knowledgeRequests := []*object.CollaborationRequest{}
	for _, req := range requests {
		if req.DiseaseName != "" {
			knowledgeRequests = append(knowledgeRequests, req)
		}
	}

	c.ResponseOk(knowledgeRequests)
}

// GetCollaborationKnowledgeRequestsByTargetDoctor
// @Title GetCollaborationKnowledgeRequestsByTargetDoctor
// @Tag Collaboration API
// @Description 获取针对某医生的协同诊疗知识请求
// @Param   doctorId     query    string  true        "doctor id"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-knowledge-requests-by-target-doctor [get]
func (c *ApiController) GetCollaborationKnowledgeRequestsByTargetDoctor() {
	doctorId := c.Input().Get("doctorId")
	if doctorId == "" {
		c.ResponseError("doctorId is required")
		return
	}

	requests, err := object.GetCollaborationRequestsByTargetDoctor(doctorId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 过滤出知识上链相关的请求（有DiseaseName的）
	knowledgeRequests := []*object.CollaborationRequest{}
	for _, req := range requests {
		if req.DiseaseName != "" {
			knowledgeRequests = append(knowledgeRequests, req)
		}
	}

	c.ResponseOk(knowledgeRequests)
}

// SubmitShareKnowledge
// @Title SubmitShareKnowledge
// @Tag Collaboration API
// @Description 提交共享知识
// @Param   body     body   object.SharedKnowledge  true        "shared knowledge info"
// @Success 200 {object} Response The Response object
// @router /submit-share-knowledge [post]
func (c *ApiController) SubmitShareKnowledge() {
	var knowledge object.SharedKnowledge
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &knowledge)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 生成唯一的共享ID
	knowledge.ShareId = fmt.Sprintf("share-%s", uuid.New().String())
	knowledge.CreatedTime = time.Now()
	knowledge.UpdatedTime = time.Now()
	knowledge.Status = "shared"

	success, err := object.AddSharedKnowledge(&knowledge)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError("Failed to submit share knowledge")
		return
	}

	// 检查是否有共享知识后，更新协同诊疗请求状态为 completed
	// 获取该请求的所有共享知识
	allKnowledge, err := object.GetSharedKnowledgeByCollaborationReqId(knowledge.CollaborationReqId)
	if err == nil && len(allKnowledge) > 0 {
		// 获取协同诊疗请求
		request, err := object.GetCollaborationRequestByRequestId(knowledge.CollaborationReqId)
		if err == nil && request != nil && request.Status == "active" {
			// 更新状态为 completed
			request.Status = "completed"
			request.UpdatedTime = time.Now()
			_, err = object.UpdateCollaborationRequest(request)
			if err != nil {
				fmt.Printf("Failed to update collaboration request status: %v\n", err)
			} else {
				fmt.Printf("Collaboration request status updated to completed: %s\n", knowledge.CollaborationReqId)
			}
		}
	}

	// 更新关系类型的共享次数（通过统计 shared_knowledge 表）
	// 这里异步更新，不影响主流程
	go func() {
		// 解析 triples 获取关系类型
		var triples []map[string]interface{}
		err := json.Unmarshal([]byte(knowledge.Triples), &triples)
		if err == nil {
			// 统计每个关系类型的共享次数
			relationTypeCounts := make(map[string]int)
			for _, triple := range triples {
				if relation, ok := triple["relation"].(string); ok {
					relationTypeCounts[relation]++
				}
			}
			// 这里可以更新到统计表或缓存，暂时先记录日志
			fmt.Printf("关系类型共享次数更新: %v\n", relationTypeCounts)
		}
	}()

	// 上链：创建Record记录并上链（同步执行，确保上链成功）
	// 使用与系统自动记录一致的 Organization 和 User，这样 record 页面才能显示
	casdoorOrganization := conf.GetConfigString("casdoorOrganization")
	if casdoorOrganization == "" {
		casdoorOrganization = "casibase"
	}
	// 获取当前登录用户的 username（与系统自动记录一致）
	currentUsername := c.GetSessionUsername()
	if currentUsername == "" {
		// 如果没有登录用户，使用 knowledge.DoctorId
		currentUsername = knowledge.DoctorId
	}
	record := &object.Record{
		Owner:        casdoorOrganization, // 使用与系统自动记录一致的 owner
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTimeWithMilli(),
		Organization: casdoorOrganization, // 使用与系统自动记录一致的 organization
		ClientIp:     c.getClientIp(),    // 设置客户端 IP
		UserAgent:   c.getUserAgent(),    // 设置 User Agent
		User:         currentUsername,      // 使用当前登录用户（与系统自动记录一致），这样 record 页面才能显示
		Method:       "POST",
		RequestUri:   "/api/submit-share-knowledge",
		Action:       "submit-share-knowledge",
		Object:       util.StructToJson(knowledge), // Object 中包含 DoctorId，可以从这里获取操作者信息
		NeedCommit:   true,
	}

	success, _, err = object.AddRecord(record, "zh")
	if err != nil {
		fmt.Printf("Failed to add share knowledge record: %v\n", err)
		c.ResponseError(fmt.Sprintf("创建记录失败: %v", err))
		return
	}

	if !success {
		c.ResponseError("创建记录失败")
		return
	}

	// 强制手动上链，确保上链成功
	fmt.Printf("[上链] AddRecord 完成，record.Id=%d, Name=%s, Owner=%s\n", record.Id, record.Name, record.Owner)
	
	// 获取记录（如果 record.Id 为 0，通过 owner/name 获取）
	var dbRecord *object.Record
	if record.Id > 0 {
		dbRecord = record
		fmt.Printf("[上链] 使用 record.Id=%d\n", record.Id)
	} else {
		recordId := fmt.Sprintf("%s/%s", record.Owner, record.Name)
		fmt.Printf("[上链] record.Id 为 0，通过 owner/name 获取记录: %s\n", recordId)
		var err error
		dbRecord, err = object.GetRecord(recordId, "zh")
		if err != nil || dbRecord == nil {
			fmt.Printf("[上链] 错误: 无法获取记录: %v\n", err)
			c.ResponseError(fmt.Sprintf("获取记录失败: %v", err))
			return
		}
		fmt.Printf("[上链] 成功获取记录，Id=%d\n", dbRecord.Id)
	}
	
	// 检查是否已经上链
	if dbRecord.Block != "" {
		fmt.Printf("[上链] 记录已上链，block=%s\n", dbRecord.Block)
	} else {
		// 手动上链
		fmt.Printf("[上链] 开始手动上链...\n")
		commitSuccess, commitResult, err := object.CommitRecord(dbRecord, "zh")
		if err != nil {
			fmt.Printf("[上链] 错误: 上链失败: %v\n", err)
			c.ResponseError(fmt.Sprintf("上链失败: %v", err))
			return
		}
		if commitSuccess {
			if commitResult != nil {
				if block, ok := commitResult["block"]; ok && block != nil && block != "" {
					fmt.Printf("[上链] 成功: block=%v\n", block)
					// 验证数据库是否已更新：重新获取记录检查 block 字段
					verifyRecordId := fmt.Sprintf("%s/%s", dbRecord.Owner, dbRecord.Name)
					if dbRecord.Id > 0 {
						verifyRecordId = fmt.Sprintf("%s/%d", dbRecord.Owner, dbRecord.Id)
					}
					verifyRecord, verifyErr := object.GetRecord(verifyRecordId, "zh")
					if verifyErr == nil && verifyRecord != nil {
						if verifyRecord.Block != "" {
							fmt.Printf("[上链] 验证成功: 数据库中的 block=%s\n", verifyRecord.Block)
						} else {
							fmt.Printf("[上链] 警告: 数据库中的 block 仍为空，更新可能失败\n")
						}
					} else {
						fmt.Printf("[上链] 警告: 无法验证数据库更新: %v\n", verifyErr)
					}
				} else {
					fmt.Printf("[上链] 警告: CommitRecord 返回成功但 block 为空: %+v\n", commitResult)
				}
			} else {
				fmt.Printf("[上链] 警告: CommitRecord 返回成功但结果为 nil\n")
			}
		} else {
			fmt.Printf("[上链] 警告: CommitRecord 返回 commitSuccess=false\n")
		}
	}

	c.ResponseOk(knowledge)
}

// GetSharedKnowledgeByRequest
// @Title GetSharedKnowledgeByRequest
// @Tag Collaboration API
// @Description 获取协同诊疗请求的所有共享知识
// @Param   requestId     query    string  true        "collaboration request id"
// @Success 200 {object} Response The Response object
// @router /get-shared-knowledge-by-request [get]
func (c *ApiController) GetSharedKnowledgeByRequest() {
	requestId := c.Input().Get("requestId")
	if requestId == "" {
		c.ResponseError("requestId is required")
		return
	}

	knowledgeList, err := object.GetSharedKnowledgeByCollaborationReqId(requestId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(knowledgeList)
}

// UploadCollaborationPdf
// @Title UploadCollaborationPdf
// @Tag Collaboration API
// @Description 上传协同诊疗PDF文件
// @Param file formData file true "The pdf file to upload"
// @Success 200 {object} Response The Response object
// @router /upload-collaboration-pdf [post]
func (c *ApiController) UploadCollaborationPdf() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	file, header, err := c.GetFile("file")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	defer file.Close()

	fmt.Printf("UploadCollaborationPdf: header.Size = %d\n", header.Size)

	// 尝试 seek 到文件头，防止文件指针不在起始位置
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, 0)
	}

	filename := header.Filename
	ext := filepath.Ext(filename)
	if ext != ".pdf" {
		c.ResponseError("Only PDF files are allowed")
		return
	}

	// 读取所有内容
	content, err := io.ReadAll(file)
	if err != nil {
		c.ResponseError(fmt.Sprintf("Failed to read file: %v", err))
		return
	}
	fmt.Printf("UploadCollaborationPdf: read bytes = %d\n", len(content))

	if len(content) == 0 {
		c.ResponseError("File content is empty")
		return
	}

	// 确保目录存在
	uploadDir := "files/collaboration_pdf"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		err = os.MkdirAll(uploadDir, 0755)
		if err != nil {
			c.ResponseError(fmt.Sprintf("Failed to create upload directory: %v", err))
			return
		}
	}

	// 生成唯一文件名
	newFilename := fmt.Sprintf("%s-%s.pdf", userName, uuid.New().String())
	filePath := filepath.Join(uploadDir, newFilename)

	// 写入文件内容
	err = os.WriteFile(filePath, content, 0644)
	if err != nil {
		c.ResponseError(fmt.Sprintf("Failed to save file: %v", err))
		return
	}

	// 构造访问 URL
	// 使用 API 接口访问，避免静态资源映射问题
	origin := conf.GetConfigString("origin") // 获取配置的域名
	fileUrl := fmt.Sprintf("%s/api/get-collaboration-pdf?name=%s", origin, newFilename)
	
	// 如果 origin 为空，直接返回相对路径
	if origin == "" {
		fileUrl = fmt.Sprintf("/api/get-collaboration-pdf?name=%s", newFilename)
	}

	c.ResponseOk(map[string]string{
		"url": fileUrl,
		"name": filename,
	})
}

// GetCollaborationPdf
// @Title GetCollaborationPdf
// @Tag Collaboration API
// @Description 获取协同诊疗PDF文件
// @Param name query string true "文件名"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-pdf [get]
func (c *ApiController) GetCollaborationPdf() {
	filename := c.Input().Get("name")
	if filename == "" {
		c.ResponseError("文件名不能为空")
		return
	}

	// 安全检查：防止路径遍历
	if filepath.Base(filename) != filename {
		c.ResponseError("文件名非法")
		return
	}

	uploadDir := "files/collaboration_pdf"
	filePath := filepath.Join(uploadDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.ResponseError("文件不存在")
		return
	}

	c.Ctx.Output.Download(filePath, filename)
}


