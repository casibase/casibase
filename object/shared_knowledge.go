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
	"encoding/json"
	"time"
)

// Triple 三元组结构
type Triple struct {
	Head     string `json:"head"`
	Relation string `json:"relation"`
	Tail     string `json:"tail"`
}

// SharedKnowledge 共享知识结构体
type SharedKnowledge struct {
	Id                int       `xorm:"int notnull pk autoincr" json:"id"`
	ShareId           string    `xorm:"varchar(100) notnull unique" json:"shareId"`
	CollaborationReqId string    `xorm:"varchar(100) notnull index" json:"collaborationReqId"`
	DoctorId          string    `xorm:"varchar(100) notnull index" json:"doctorId"`
	DoctorName        string    `xorm:"varchar(100) notnull" json:"doctorName"`
	HospitalName      string    `xorm:"varchar(200) notnull" json:"hospitalName"`
	Triples           string    `xorm:"text notnull" json:"triples"` // JSON array of Triple
	Status            string    `xorm:"varchar(20) notnull default 'shared'" json:"status"` // shared
	CreatedTime       time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"createdTime"`
	UpdatedTime       time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"updatedTime"`
}

// GetSharedKnowledge 根据ID获取共享知识
func GetSharedKnowledge(id string) (*SharedKnowledge, error) {
	knowledge := &SharedKnowledge{}
	existed, err := adapter.engine.ID(id).Get(knowledge)
	if err != nil {
		return nil, err
	}
	if existed {
		return knowledge, nil
	}
	return nil, nil
}

// GetSharedKnowledgeByShareId 根据共享ID获取共享知识
func GetSharedKnowledgeByShareId(shareId string) (*SharedKnowledge, error) {
	knowledge := &SharedKnowledge{}
	existed, err := adapter.engine.Where("share_id = ?", shareId).Get(knowledge)
	if err != nil {
		return nil, err
	}
	if existed {
		return knowledge, nil
	}
	return nil, nil
}

// AddSharedKnowledge 添加共享知识
func AddSharedKnowledge(knowledge *SharedKnowledge) (bool, error) {
	affected, err := adapter.engine.Insert(knowledge)
	return affected > 0, err
}

// UpdateSharedKnowledge 更新共享知识
func UpdateSharedKnowledge(knowledge *SharedKnowledge) (bool, error) {
	affected, err := adapter.engine.ID(knowledge.Id).AllCols().Update(knowledge)
	return affected > 0, err
}

// DeleteSharedKnowledge 删除共享知识
func DeleteSharedKnowledge(knowledge *SharedKnowledge) (bool, error) {
	affected, err := adapter.engine.ID(knowledge.Id).Delete(knowledge)
	return affected > 0, err
}

// GetSharedKnowledgeByCollaborationReqId 根据协同诊疗请求ID获取所有共享知识
func GetSharedKnowledgeByCollaborationReqId(collaborationReqId string) ([]*SharedKnowledge, error) {
	knowledgeList := []*SharedKnowledge{}
	err := adapter.engine.Where("collaboration_req_id = ?", collaborationReqId).OrderBy("created_time desc").Find(&knowledgeList)
	return knowledgeList, err
}

// GetSharedKnowledgeByDoctorId 根据医生ID获取共享知识
func GetSharedKnowledgeByDoctorId(doctorId string) ([]*SharedKnowledge, error) {
	knowledgeList := []*SharedKnowledge{}
	err := adapter.engine.Where("doctor_id = ?", doctorId).OrderBy("created_time desc").Find(&knowledgeList)
	return knowledgeList, err
}

// GetRelationTypeShareCounts 获取关系类型的共享次数统计
// 根据专病名称，统计每个关系类型的共享次数
func GetRelationTypeShareCounts(diseaseName string) (map[string]int, error) {
	counts := make(map[string]int)
	
	// 获取所有共享知识
	allKnowledge, err := GetAllSharedKnowledge()
	if err != nil {
		return counts, err
	}

	// 遍历所有共享知识，解析 triples 并统计
	for _, knowledge := range allKnowledge {
		if knowledge.Triples == "" {
			continue
		}

		// 解析 triples JSON
		var triples []map[string]interface{}
		err := json.Unmarshal([]byte(knowledge.Triples), &triples)
		if err != nil {
			continue
		}

		// 检查是否包含该专病名称
		hasDisease := false
		for _, triple := range triples {
			if head, ok := triple["head"].(string); ok && head == diseaseName {
				hasDisease = true
				break
			}
		}

		if hasDisease {
			// 统计每个关系类型的共享次数
			// 对于每次共享操作，每个关系类型只加1次（不管该关系类型有多少个三元组）
			relationTypesInThisShare := make(map[string]bool)
			for _, triple := range triples {
				if relation, ok := triple["relation"].(string); ok {
					// 如果这个关系类型在这次共享中还没有统计过，则加1
					if !relationTypesInThisShare[relation] {
						counts[relation]++
						relationTypesInThisShare[relation] = true
					}
				}
			}
		}
	}

	return counts, nil
}

// GetAllSharedKnowledge 获取所有共享知识
func GetAllSharedKnowledge() ([]*SharedKnowledge, error) {
	knowledgeList := []*SharedKnowledge{}
	err := adapter.engine.OrderBy("created_time desc").Find(&knowledgeList)
	return knowledgeList, err
}


