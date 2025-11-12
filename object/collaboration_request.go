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

package object

import (
	"time"
)

// CollaborationRequest 协同诊疗请求结构体
type CollaborationRequest struct {
	Id                  int       `xorm:"int notnull pk autoincr" json:"id"`
	RequestId           string    `xorm:"varchar(100) notnull unique" json:"requestId"`
	InitiatorDoctorId   string    `xorm:"varchar(100) notnull index" json:"initiatorDoctorId"`
	InitiatorDoctorName string    `xorm:"varchar(100) notnull" json:"initiatorDoctorName"`
	InitiatorHospital   string    `xorm:"varchar(200) notnull" json:"initiatorHospital"`
	PatientHashId       string    `xorm:"varchar(200) notnull index" json:"patientHashId"`
	// 明文身份证号不入库，仅透传用于前端显示或临时计算
	PatientIdentityNumber string    `xorm:"-" json:"patientIdentityNumber"`
	PatientName         string    `xorm:"varchar(100)" json:"patientName"`
	TargetHospitals     string    `xorm:"text notnull" json:"targetHospitals"` // JSON array of hospital names
	TargetDoctors       string    `xorm:"text" json:"targetDoctors"` // JSON array of doctor IDs (owner/name format)
	Description         string    `xorm:"text" json:"description"`
	Status              string    `xorm:"varchar(20) notnull default 'active'" json:"status"` // active, completed, cancelled
	CreatedTime         time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"createdTime"`
	UpdatedTime         time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"updatedTime"`
}

// GetCollaborationRequests 获取协同诊疗请求列表
func GetCollaborationRequests(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&requests)
	if err != nil {
		return requests, err
	}
	return requests, nil
}

// GetCollaborationRequest 根据ID获取协同诊疗请求
func GetCollaborationRequest(id string) (*CollaborationRequest, error) {
	request := &CollaborationRequest{}
	existed, err := adapter.engine.ID(id).Get(request)
	if err != nil {
		return nil, err
	}
	if existed {
		return request, nil
	}
	return nil, nil
}

// GetCollaborationRequestByRequestId 根据请求ID获取协同诊疗请求
func GetCollaborationRequestByRequestId(requestId string) (*CollaborationRequest, error) {
	request := &CollaborationRequest{}
	existed, err := adapter.engine.Where("request_id = ?", requestId).Get(request)
	if err != nil {
		return nil, err
	}
	if existed {
		return request, nil
	}
	return nil, nil
}

// AddCollaborationRequest 添加协同诊疗请求
func AddCollaborationRequest(request *CollaborationRequest) (bool, error) {
	affected, err := adapter.engine.Insert(request)
	return affected > 0, err
}

// UpdateCollaborationRequest 更新协同诊疗请求
func UpdateCollaborationRequest(request *CollaborationRequest) (bool, error) {
	affected, err := adapter.engine.ID(request.Id).AllCols().Update(request)
	return affected > 0, err
}

// DeleteCollaborationRequest 删除协同诊疗请求
func DeleteCollaborationRequest(request *CollaborationRequest) (bool, error) {
	affected, err := adapter.engine.ID(request.Id).Delete(request)
	return affected > 0, err
}

// GetCollaborationRequestsByInitiatorDoctorId 根据发起医生ID获取协同诊疗请求
func GetCollaborationRequestsByInitiatorDoctorId(doctorId string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	err := adapter.engine.Where("initiator_doctor_id = ?", doctorId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetCollaborationRequestsByPatientHashId 根据患者HashID获取协同诊疗请求
func GetCollaborationRequestsByPatientHashId(patientHashId string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	err := adapter.engine.Where("patient_hash_id = ?", patientHashId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetActiveCollaborationRequestsByTargetHospital 根据目标医院获取活跃的协同诊疗请求
func GetActiveCollaborationRequestsByTargetHospital(hospitalName string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	// 使用LIKE查询，因为targetHospitals是JSON数组字符串
	err := adapter.engine.Where("target_hospitals LIKE ? AND status = 'active'", "%\""+hospitalName+"\"%").OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetActiveCollaborationRequestsByTargetDoctor 根据目标医生ID获取活跃的协同诊疗请求
func GetActiveCollaborationRequestsByTargetDoctor(doctorId string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	// 使用LIKE查询，因为targetDoctors是JSON数组字符串，格式为 "owner/name"
	err := adapter.engine.Where("target_doctors LIKE ? AND status = 'active'", "%\""+doctorId+"\"%").OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetCollaborationRequestsByTargetDoctor 根据目标医生ID获取所有状态的协同诊疗请求（包括已关闭的）
// 排除该医生自己发起的请求
func GetCollaborationRequestsByTargetDoctor(doctorId string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	// 使用LIKE查询，因为targetDoctors是JSON数组字符串，格式为 "owner/name"
	// 同时排除该医生自己发起的请求
	err := adapter.engine.Where("target_doctors LIKE ? AND initiator_doctor_id != ?", "%\""+doctorId+"\"%", doctorId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetCollaborationRequestsByTargetHospital 根据目标医院获取所有状态的协同诊疗请求（包括已关闭的）
// 排除该医院医生自己发起的请求（需要传入当前医生ID）
func GetCollaborationRequestsByTargetHospital(hospitalName string, excludeDoctorId string) ([]*CollaborationRequest, error) {
	requests := []*CollaborationRequest{}
	// 使用LIKE查询，因为targetHospitals是JSON数组字符串
	query := adapter.engine.Where("target_hospitals LIKE ?", "%\""+hospitalName+"\"%")
	if excludeDoctorId != "" {
		query = query.And("initiator_doctor_id != ?", excludeDoctorId)
	}
	err := query.OrderBy("created_time desc").Find(&requests)
	return requests, err
}


