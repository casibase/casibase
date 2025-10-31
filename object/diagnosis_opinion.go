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

// DiagnosisOpinion 诊疗意见结构体
type DiagnosisOpinion struct {
	Id                 int       `xorm:"int notnull pk autoincr" json:"id"`
	OpinionId          string    `xorm:"varchar(100) notnull unique" json:"opinionId"`
	CollaborationReqId string    `xorm:"varchar(100) notnull index" json:"collaborationReqId"`
	DoctorId           string    `xorm:"varchar(100) notnull index" json:"doctorId"`
	DoctorName         string    `xorm:"varchar(100) notnull" json:"doctorName"`
	HospitalName       string    `xorm:"varchar(200) notnull" json:"hospitalName"`
	Department         string    `xorm:"varchar(100)" json:"department"`
	Opinion            string    `xorm:"text notnull" json:"opinion"`
	Diagnosis          string    `xorm:"text" json:"diagnosis"`
	TreatmentSuggestion string   `xorm:"text" json:"treatmentSuggestion"`
	Status             string    `xorm:"varchar(20) notnull default 'submitted'" json:"status"` // submitted, updated, withdrawn
	CreatedTime        time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"createdTime"`
	UpdatedTime        time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"updatedTime"`
}

// GetDiagnosisOpinions 获取诊疗意见列表
func GetDiagnosisOpinions(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*DiagnosisOpinion, error) {
	opinions := []*DiagnosisOpinion{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&opinions)
	if err != nil {
		return opinions, err
	}
	return opinions, nil
}

// GetDiagnosisOpinion 根据ID获取诊疗意见
func GetDiagnosisOpinion(id string) (*DiagnosisOpinion, error) {
	opinion := &DiagnosisOpinion{}
	existed, err := adapter.engine.ID(id).Get(opinion)
	if err != nil {
		return nil, err
	}
	if existed {
		return opinion, nil
	}
	return nil, nil
}

// GetDiagnosisOpinionByOpinionId 根据意见ID获取诊疗意见
func GetDiagnosisOpinionByOpinionId(opinionId string) (*DiagnosisOpinion, error) {
	opinion := &DiagnosisOpinion{}
	existed, err := adapter.engine.Where("opinion_id = ?", opinionId).Get(opinion)
	if err != nil {
		return nil, err
	}
	if existed {
		return opinion, nil
	}
	return nil, nil
}

// AddDiagnosisOpinion 添加诊疗意见
func AddDiagnosisOpinion(opinion *DiagnosisOpinion) (bool, error) {
	affected, err := adapter.engine.Insert(opinion)
	return affected > 0, err
}

// UpdateDiagnosisOpinion 更新诊疗意见
func UpdateDiagnosisOpinion(opinion *DiagnosisOpinion) (bool, error) {
	affected, err := adapter.engine.ID(opinion.Id).AllCols().Update(opinion)
	return affected > 0, err
}

// DeleteDiagnosisOpinion 删除诊疗意见
func DeleteDiagnosisOpinion(opinion *DiagnosisOpinion) (bool, error) {
	affected, err := adapter.engine.ID(opinion.Id).Delete(opinion)
	return affected > 0, err
}

// GetDiagnosisOpinionsByCollaborationReqId 根据协同诊疗请求ID获取所有诊疗意见
func GetDiagnosisOpinionsByCollaborationReqId(collaborationReqId string) ([]*DiagnosisOpinion, error) {
	opinions := []*DiagnosisOpinion{}
	err := adapter.engine.Where("collaboration_req_id = ?", collaborationReqId).OrderBy("created_time desc").Find(&opinions)
	return opinions, err
}

// GetDiagnosisOpinionsByDoctorId 根据医生ID获取诊疗意见
func GetDiagnosisOpinionsByDoctorId(doctorId string) ([]*DiagnosisOpinion, error) {
	opinions := []*DiagnosisOpinion{}
	err := adapter.engine.Where("doctor_id = ?", doctorId).OrderBy("created_time desc").Find(&opinions)
	return opinions, err
}

// GetDiagnosisOpinionsByCollaborationReqIdAndDoctorId 根据协同诊疗请求ID和医生ID获取该医生的所有诊疗意见
func GetDiagnosisOpinionsByCollaborationReqIdAndDoctorId(collaborationReqId, doctorId string) ([]*DiagnosisOpinion, error) {
	opinions := []*DiagnosisOpinion{}
	err := adapter.engine.Where("collaboration_req_id = ? AND doctor_id = ?", collaborationReqId, doctorId).OrderBy("created_time desc").Find(&opinions)
	return opinions, err
}


