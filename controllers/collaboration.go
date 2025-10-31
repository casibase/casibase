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
	"time"

	"github.com/casibase/casibase/object"
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

	// 上链：创建Record记录并上链
	go func() {
		record := &object.Record{
			Owner:       "admin",
			Name:        util.GenerateId(),
			CreatedTime: util.GetCurrentTimeWithMilli(),
			Organization: "admin",
			User:        request.InitiatorDoctorId,
			Method:      "POST",
			RequestUri:  "/api/create-collaboration-request",
			Action:      "create-collaboration-request",
			Object:      util.StructToJson(request),
			NeedCommit:  true,
		}
		
		_, _, err := object.AddRecord(record, "zh")
		if err != nil {
			fmt.Printf("Failed to add collaboration request record: %v\n", err)
			return
		}

		// 自动提交上链
		if record.NeedCommit {
			_, _, err := object.CommitRecord(record, "zh")
			if err != nil {
				fmt.Printf("Failed to commit collaboration request to blockchain: %v\n", err)
			}
		}
	}()

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
// @Description 获取针对某医院的协同诊疗请求
// @Param   hospitalName     query    string  true        "hospital name"
// @Success 200 {object} Response The Response object
// @router /get-collaboration-requests-by-hospital [get]
func (c *ApiController) GetCollaborationRequestsByHospital() {
	hospitalName := c.Input().Get("hospitalName")
	if hospitalName == "" {
		c.ResponseError("hospitalName is required")
		return
	}

	requests, err := object.GetActiveCollaborationRequestsByTargetHospital(hospitalName)
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

	// 上链：创建Record记录并上链
	go func() {
		record := &object.Record{
			Owner:       "admin",
			Name:        util.GenerateId(),
			CreatedTime: util.GetCurrentTimeWithMilli(),
			Organization: "admin",
			User:        opinion.DoctorId,
			Method:      "POST",
			RequestUri:  "/api/submit-diagnosis-opinion",
			Action:      "submit-diagnosis-opinion",
			Object:      util.StructToJson(opinion),
			NeedCommit:  true,
		}
		
		_, _, err := object.AddRecord(record, "zh")
		if err != nil {
			fmt.Printf("Failed to add diagnosis opinion record: %v\n", err)
			return
		}

		// 自动提交上链
		if record.NeedCommit {
			_, _, err := object.CommitRecord(record, "zh")
			if err != nil {
				fmt.Printf("Failed to commit diagnosis opinion to blockchain: %v\n", err)
			}
		}
	}()

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


