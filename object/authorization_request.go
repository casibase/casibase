package object

import (
	"time"
)

// AuthorizationRequest 授权请求结构体
type AuthorizationRequest struct {
	Id                  int       `xorm:"int notnull pk autoincr" json:"id"`
	RequestId           string    `xorm:"varchar(100) notnull unique" json:"requestId"`
	DoctorName          string    `xorm:"varchar(100) notnull" json:"doctorName"`
	DoctorId            string    `xorm:"varchar(100) notnull" json:"doctorId"`
	DoctorContact       string    `xorm:"varchar(200)" json:"doctorContact"`
	PatientHashId       string    `xorm:"varchar(200) notnull" json:"patientHashId"`
	Hospitals           string    `xorm:"text notnull" json:"hospitals"`
	ValidityPeriod      int       `xorm:"int notnull" json:"validityPeriod"`
	DataTimeRangeStart  *time.Time `xorm:"datetime" json:"dataTimeRangeStart"`
	DataTimeRangeEnd    *time.Time `xorm:"datetime" json:"dataTimeRangeEnd"`
	ApplicationNote     string    `xorm:"text" json:"applicationNote"`
	Status              string    `xorm:"varchar(20) notnull default 'pending'" json:"status"`
	CreatedTime         time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"createdTime"`
	UpdatedTime         time.Time `xorm:"datetime notnull default CURRENT_TIMESTAMP" json:"updatedTime"`
	ProcessedTime       *time.Time `xorm:"datetime" json:"processedTime"`
	ProcessedBy         string    `xorm:"varchar(100)" json:"processedBy"`
	RejectReason        string    `xorm:"text" json:"rejectReason"`
}

// GetAuthorizationRequests 获取授权请求列表
func GetAuthorizationRequests(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*AuthorizationRequest, error) {
	requests := []*AuthorizationRequest{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&requests)
	if err != nil {
		return requests, err
	}
	return requests, nil
}

// GetAuthorizationRequest 根据ID获取授权请求
func GetAuthorizationRequest(id string) (*AuthorizationRequest, error) {
	request := &AuthorizationRequest{}
	existed, err := adapter.engine.ID(id).Get(request)
	if err != nil {
		return nil, err
	}
	if existed {
		return request, nil
	}
	return nil, nil
}

// AddAuthorizationRequest 添加授权请求
func AddAuthorizationRequest(request *AuthorizationRequest) (bool, error) {
	affected, err := adapter.engine.Insert(request)
	return affected > 0, err
}

// UpdateAuthorizationRequest 更新授权请求
func UpdateAuthorizationRequest(request *AuthorizationRequest) (bool, error) {
	affected, err := adapter.engine.ID(request.Id).AllCols().Update(request)
	return affected > 0, err
}

// DeleteAuthorizationRequest 删除授权请求
func DeleteAuthorizationRequest(request *AuthorizationRequest) (bool, error) {
	affected, err := adapter.engine.ID(request.Id).Delete(request)
	return affected > 0, err
}

// GetAuthorizationRequestsByDoctorId 根据医生ID获取授权请求
func GetAuthorizationRequestsByDoctorId(doctorId string) ([]*AuthorizationRequest, error) {
	requests := []*AuthorizationRequest{}
	err := adapter.engine.Where("doctor_id = ?", doctorId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetAuthorizationRequestsByPatientHashId 根据患者HashID获取授权请求
func GetAuthorizationRequestsByPatientHashId(patientHashId string) ([]*AuthorizationRequest, error) {
	requests := []*AuthorizationRequest{}
	err := adapter.engine.Where("patient_hash_id = ?", patientHashId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetAuthorizationRequestsByPatientId 根据患者ID获取授权请求（通过idCard字段匹配）
func GetAuthorizationRequestsByPatientId(patientId string) ([]*AuthorizationRequest, error) {
	requests := []*AuthorizationRequest{}
	// 查询该患者的所有授权请求（包括所有状态）
	err := adapter.engine.Where("patient_hash_id = ?", patientId).OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetAllAuthorizationRequests 获取所有授权请求（调试用）
func GetAllAuthorizationRequests() ([]*AuthorizationRequest, error) {
	requests := []*AuthorizationRequest{}
	err := adapter.engine.OrderBy("created_time desc").Find(&requests)
	return requests, err
}

// GetAuthorizationRequestByRequestId 根据请求ID获取授权请求
func GetAuthorizationRequestByRequestId(requestId string) (*AuthorizationRequest, error) {
	request := &AuthorizationRequest{}
	existed, err := adapter.engine.Where("request_id = ?", requestId).Get(request)
	if err != nil {
		return nil, err
	}
	if existed {
		return request, nil
	}
	return nil, nil
}
