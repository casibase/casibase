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
	"encoding/json"
	"fmt"
	"strings"

	"github.com/beego/beego/context"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/util"
)

var logPostOnly bool

func init() {
	logPostOnly = conf.GetConfigBool("logPostOnly")
}

type Record struct {
	Id int `xorm:"int notnull pk autoincr" json:"id"`

	Owner       string `xorm:"varchar(100) index" json:"owner"`
	Name        string `xorm:"varchar(100) index" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	Organization    string `xorm:"varchar(100)" json:"organization"`
	ClientIp        string `xorm:"varchar(100)" json:"clientIp"`
	UserAgent       string `xorm:"varchar(200)" json:"userAgent"`
	User            string `xorm:"varchar(100)" json:"user"`
	Method          string `xorm:"varchar(100)" json:"method"`
	RequestUri      string `xorm:"varchar(1000)" json:"requestUri"`
	Action          string `xorm:"varchar(1000)" json:"action"`
	Language        string `xorm:"varchar(100)" json:"language"`
	Query        string `xorm:"varchar(100)" json:"query"`
	Region          string `xorm:"varchar(100)" json:"region"`
	City            string `xorm:"varchar(100)" json:"city"`
	Unit            string `xorm:"varchar(100)" json:"unit"`
	Section         string `xorm:"varchar(100)" json:"section"`
	DiseaseCategory string `xorm:"varchar(256)" json:"diseaseCategory"`

	Object    string `xorm:"mediumtext" json:"object"`
	Response  string `xorm:"mediumtext" json:"response"`
	ErrorText string `xorm:"mediumtext" json:"errorText"`
	// ExtendedUser *User  `xorm:"-" json:"extendedUser"`

	Provider    string `xorm:"varchar(100)" json:"provider"`
	Block       string `xorm:"varchar(100) index" json:"block"`
	BlockHash   string `xorm:"varchar(500)" json:"blockHash"`
	Transaction string `xorm:"varchar(500)" json:"transaction"`

	Provider2    string `xorm:"varchar(100)" json:"provider2"`
	Block2       string `xorm:"varchar(100)" json:"block2"`
	BlockHash2   string `xorm:"varchar(500)" json:"blockHash2"`
	Transaction2 string `xorm:"varchar(500)" json:"transaction2"`
	// For cross-chain records

	IsTriggered bool `json:"isTriggered"`
	NeedCommit  bool `xorm:"index" json:"needCommit"`

	CorrelationId string `xorm:"varchar(256)" json:"correlationId"`
	Objcid        string `xorm:"varchar(500)" json:"objcid"`
}

// PatientBrief 为从 record.object 中解析出的关键患者信息（冗余解析）
type PatientBrief struct {
	PatientName      string `json:"patientName"`
	Section          string `json:"section"`
	Unit             string `json:"unit"`
	ConsultationTime string `json:"consultationTime"`
	Diagnosis        string `json:"diagnosis"`
	LocalDBIndex     string `json:"localDBIndex"`
	CorrelationId    string `json:"correlationId"`
}



type Response struct {
	Status string `json:"status"`
	Msg    string `json:"msg"`
}

func GetRecordCountFilterUser(owner, field, value,username string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	if username == "" {
		return session.Count(&Record{Owner: owner})
	} else {
		return session.Count(&Record{Owner: owner, User: username})
	}
}

func GetRecordCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Record{Owner: owner})
}

func GetRecords(owner string) ([]*Record, error) {
	records := []*Record{}
	err := adapter.engine.Desc("id").Find(&records, &Record{Owner: owner})
	if err != nil {
		return records, err
	}
	return records, nil
}

func GetRecordsFilterUser(owner,username string) ([]*Record, error) {
	records := []*Record{}
	// 如果username==""，则获取所有owner的记录
	// 否则获取指定owner和user的记录
	if username == "" {
		err := adapter.engine.Desc("id").Find(&records, &Record{Owner: owner})
		if err != nil {
			return records, err
		}
	}else{
		err := adapter.engine.Desc("id").Find(&records, &Record{Owner: owner, User: username})
		if err != nil {
			return records, err
		}
	}

	

	return records, nil
}


func getAllRecords() ([]*Record, error) {
	records := []*Record{}
	err := adapter.engine.Desc("id").Find(&records, &Record{})
	if err != nil {
		return records, err
	}

	return records, nil
}

func getValidAndNeedCommitRecords(records []*Record) ([]*Record, []int, []interface{}, error) {
	providerFirst, providerSecond, err := GetTwoActiveBlockchainProvider("admin")
	if err != nil {
		return nil, nil, nil, err
	}

	var validRecords []*Record
	var needCommitIdx []int
	var data []interface{}
	recordTime := util.GetCurrentTimeWithMilli()

	for i, record := range records {
		ok, err := prepareRecord(record, providerFirst, providerSecond)
		if err != nil {
			return nil, nil, nil, err
		}
		if !ok {
			continue
		}
		record.CreatedTime = util.GetCurrentTimeBasedOnLastMilli(recordTime)
		recordTime = record.CreatedTime

		validRecords = append(validRecords, record)
		data = append(data, map[string]interface{}{"name": record.Name})
		if record.NeedCommit {
			needCommitIdx = append(needCommitIdx, i)
		}
	}
	return validRecords, needCommitIdx, data, nil
}

func GetPaginationRecords(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Record, error) {
	records := []*Record{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&records)
	if err != nil {
		return records, err
	}
	return records, nil
}

func GetPaginationRecordsFilterUser(owner string, offset, limit int, field, value, sortField, sortOrder,username string) ([]*Record, error) {
	records := []*Record{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	if username == "" {
		err := session.Find(&records)
		if err != nil {
			return records, err
		}
	}else{
		session.And("user=?", username)
		err := session.Find(&records)
		if err != nil {
			return records, err
		}
	}

	return records, nil
}

// GetRecord retrieves a record by its ID or owner/name format.
func GetRecord(id string, lang string) (*Record, error) {
	record := &Record{}

	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to parse record identifier '%s': neither a valid owner/[id|name] format"), id)
	}
	// Try to parse as integer ID first
	if recordId, err := util.ParseIntWithError(name); err == nil && recordId > 0 {
		// Valid integer ID
		record.Id = recordId
	} else {
		record.Owner = owner
		record.Name = name
	}

	existed, err := adapter.engine.Get(record)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to get record with id '%s': %w"), id, err)
	}
	
	if existed {
		return record, nil
	}

	return nil, nil
}



// GetRecordsByAction 根据owner和action字段获取记录，按Id降序排列
func GetRecordsByAction( action string) ([]*Record, error) {
	records := []*Record{}
	err := adapter.engine.Desc("id").Where("action = ?", action).Find(&records)
	if err != nil {
		return records, err
	}
	return records, nil
}

func GetRecordsByIds(ids []int) ([]*Record, error) {
	records := []*Record{}
	err := adapter.engine.In("id", ids).Find(&records)
	if err != nil {
		return records, err
	}
	return records, nil
}

func prepareRecord(record *Record, providerFirst, providerSecond *Provider) (bool, error) {
	if logPostOnly && record.Method == "GET" {
		return false, nil
	}

	if strings.HasSuffix(record.Action, "-record") {
		return false, nil
	}

	if strings.HasSuffix(record.Action, "-record-second") {
		return false, nil
	}

	if strings.HasSuffix(record.Action, "-records") {
		return false, nil
	}

	if record.Provider == "" {
		if providerFirst != nil {
			record.Provider = providerFirst.Name
		}

		if providerSecond != nil {
			record.Provider2 = providerSecond.Name
		}
	}

	record.Id = 0
	record.Name = util.GenerateId()
	record.Owner = record.Organization

	return true, nil
}

func UpdateRecord(id string, record *Record, lang string) (bool, error) {
	p, err := GetRecord(id, lang)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	// Update provider
	if record.Provider != p.Provider {
		record.Block = ""
		record.BlockHash = ""
		record.Transaction = ""
	}
	if record.Provider2 != p.Provider2 {
		record.Block2 = ""
		record.BlockHash2 = ""
		record.Transaction2 = ""
	}

	affected, err := adapter.engine.Where("id = ?", p.Id).AllCols().Update(record)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func UpdateRecordInternal(id int, record Record) error {
	_, err := adapter.engine.ID(id).Update(record)
	if err != nil {
		return err
	}
	return nil
}

func UpdateRecordFields(id string, fields map[string]interface{}, lang string) (bool, error) {
	p, err := GetRecord(id, lang)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.Table(&Record{}).Where("id = ?", p.Id).Update(fields)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func NewRecord(ctx *context.Context) (*Record, error) {
	ip := strings.Replace(util.GetIPFromRequest(ctx.Request), ": ", "", -1)
	action := strings.Replace(ctx.Request.URL.Path, "/api/", "", -1)
	requestUri := util.FilterQuery(ctx.Request.RequestURI, []string{"accessToken"})
	if len(requestUri) > 1000 {
		requestUri = requestUri[0:1000]
	}

	object := ""
	if len(ctx.Input.RequestBody) != 0 {
		object = string(ctx.Input.RequestBody)
	}

	respBytes, err := json.Marshal(ctx.Input.Data()["json"])
	if err != nil {
		return nil, err
	}

	var resp Response
	err = json.Unmarshal(respBytes, &resp)
	if err != nil {
		return nil, err
	}

	language := ctx.Request.Header.Get("Accept-Language")
	if len(language) > 2 {
		language = language[0:2]
	}
	languageCode := conf.GetLanguage(language)

	// get location info from client ip
	locationInfo, err := util.GetInfoFromIP(ip)
	if err != nil {
		return nil, err
	}
	region := locationInfo.Country
	city := locationInfo.City

	record := Record{
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTimeWithMilli(),
		ClientIp:    ip,
		User:        "",
		Method:      ctx.Request.Method,
		RequestUri:  requestUri,
		Action:      action,
		Language:    languageCode,
		Region:      region,
		City:        city,
		Object:      object,
		Response:    fmt.Sprintf("{\"status\":\"%s\",\"msg\":\"%s\"}", resp.Status, resp.Msg),
		IsTriggered: false,
	}
	return &record, nil
}

func AddRecord(record *Record, lang string) (bool, interface{}, error) {
	providerFirst, providerSecond, err := GetTwoActiveBlockchainProvider(record.Owner)
	if err != nil {
		return false, nil, err
	}

	ok, err := prepareRecord(record, providerFirst, providerSecond)
	if err != nil {
		return false, nil, err
	}
	if !ok {
		return false, nil, nil
	}

	record.CreatedTime = util.GetCurrentTimeWithMilli()

	affected, err := adapter.engine.Insert(record)
	if err != nil {
		return false, nil, err
	}


	data := map[string]interface{}{"name": record.Name}

	if record.NeedCommit {
		_, commitResult, err := CommitRecord(record, lang)
		if err != nil {
			data["error_text"] = err.Error()
		} else {
			data = commitResult
		}
	}

	go AddRecordToArchiveQueueFromRecordAdd(record, lang)

	// 异步执行
	go UploadObjectToIPFS(record)

	

	return affected != 0, data, nil
}

func AddRecords(records []*Record, syncEnabled bool, lang string) (bool, interface{}, error) {
	if len(records) == 0 {
		return false, nil, nil
	}

	validRecords, needCommitRecordsIdx, data, err := getValidAndNeedCommitRecords(records)
	if err != nil {
		return false, nil, err
	}

	if len(validRecords) == 0 {
		return false, nil, nil
	}

	totalAffected := int64(0)
	session := adapter.engine.NewSession()
	defer session.Close()
	err = session.Begin()
	if err != nil {
		return false, nil, err
	}

	batchSize := 150
	for i := 0; i < len(validRecords); i += batchSize {
		end := min(i+batchSize, len(validRecords))

		batch := validRecords[i:end]
		affected, err := session.Insert(batch)
		if err != nil {
			session.Rollback()
			return false, nil, err
		}
		totalAffected += affected
	}

	err = session.Commit()
	if err != nil {
		return false, nil, err
	}

	// Send commit event for records that need to be committed
	if len(needCommitRecordsIdx) > 0 {
		if syncEnabled {
			var needCommitRecords []*Record
			for _, idx := range needCommitRecordsIdx {
				needCommitRecords = append(needCommitRecords, records[idx])
			}
			_, commitResults := CommitRecords(needCommitRecords, lang)
			for i, idx := range needCommitRecordsIdx {
				data[idx] = commitResults[i]
			}
		} else {
			// 优化：直接异步处理当前这批记录，而不是扫描所有记录
			// 这样可以避免重复扫描和锁竞争
			var needCommitRecords []*Record
			for _, idx := range needCommitRecordsIdx {
				needCommitRecords = append(needCommitRecords, records[idx])
			}
			go func() {
				// 异步处理当前这批记录
				CommitRecords(needCommitRecords, lang)
			}()
		}
	}


	// 异步执行
	go func() {
		for _, record := range validRecords {
			AddRecordToArchiveQueueFromRecordAdd(record,lang)
			UploadObjectToIPFS(record)
		}
	}()


	return totalAffected != 0, data, nil
}

func DeleteRecord(record *Record) (bool, error) {
	affected, err := adapter.engine.Where("id = ?", record.Id).Delete(&Record{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (record *Record) getUniqueId() string {
	return fmt.Sprintf("%s/%d", record.Owner, record.Id)
}

func (record *Record) getId() string {
	return fmt.Sprintf("%s/%s", record.Owner, record.Name)
}

func (r *Record) updateErrorText(errText string, lang string) (bool, error) {
	r.ErrorText = errText
	if r.Id != 0 {
		affected, err := adapter.engine.Where("owner = ? AND name = ?", r.Owner, r.Name).Cols("error_text").Update(r)
		if err != nil {
			return affected > 0, fmt.Errorf(i18n.Translate(lang, "object:failed to update error text for record %s: %s"), r.getId(), err)
		}
		return affected > 0, nil
	} else {
		affected, err := adapter.engine.ID(r.Id).Cols("error_text").Update(r)
		if err != nil {
			return affected > 0, fmt.Errorf(i18n.Translate(lang, "object:failed to update error text for record %s: %s"), r.getUniqueId(), err)
		}
		return affected > 0, nil
	}
}

func UploadObjectToIPFS (r *Record) (bool, error) {
	needUploadObjectToIPFS, _ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("record.object.uploadIPFS.switch", "true")

	if needUploadObjectToIPFS == "false" {
		return false, nil
	}


	ipfs, err := RecordObjectToIPFS(r)
	if err != nil {
		fmt.Println(">>> [UploadObjectToIPFS]RecordObjectToIPFS error:", err)
		return false, err
	}
	
	
	affected, err := adapter.engine.Where("name = ?", r.Name).Cols("objcid").Update(&Record{Objcid: ipfs})
	if err != nil {
		return false, fmt.Errorf("failed to update objcid for record %s: %s", r.getUniqueId(), err)
	}
	if affected > 0 {
		fmt.Println(">>> [UploadObjectToIPFS]Object字段已经上传ipfs:", ipfs)
	} else {
		fmt.Println(">>> [UploadObjectToIPFS]Object字段上传ipfs成功但更新失败，建议人工更新:", ipfs, "| record的Name字段为：",r.Name)
	}
	return affected > 0, nil
}



// GetPatientByHashID 根据患者HashID查询就诊记录
func GetPatientByHashID(hashID string) ([]*Record, error) {
	records := []*Record{}

	// 查询correlation_id为指定HashID的记录
	err := adapter.engine.Where("correlation_id = ?", hashID).Find(&records)
	// err := adapter.engine.Where("object LIKE ? AND request_uri = ?", "%"+hashID+"%", "/api/add-outpatient").Find(&records)
	if err != nil {
		return records, err
	}

	return records, nil
}

// GetLatestPatientBriefByHashID 通过 hashID 查找最近一条记录并对 object 进行鲁棒解析
func GetLatestPatientBriefByHashID(hashID string) (*PatientBrief, error) {
	var record Record
	// 优先按 id 或 created_time 倒序获取最近一条
	existed, err := adapter.engine.Where("correlation_id = ?", hashID).Desc("id").Get(&record)
	if err != nil {
		return nil, err
	}
	if !existed {
		return nil, nil
	}
	brief := parsePatientBriefFromObject(record.Object)
	// 兜底：若 object 中没有 correlationId，则使用 record.CorrelationId
	if brief.CorrelationId == "" {
		brief.CorrelationId = record.CorrelationId
	}
	return brief, nil
}

// parsePatientBriefFromObject 对不规则 JSON 进行冗余解析，容忍字段名差异与类型差异
func parsePatientBriefFromObject(obj string) *PatientBrief {
	result := &PatientBrief{}
	if strings.TrimSpace(obj) == "" {
		return result
	}
	// 先尝试解析为 map
	var m map[string]interface{}
	if err := json.Unmarshal([]byte(obj), &m); err != nil {
		// 非标准 JSON，直接返回空结果
		return result
	}
	// 提取工具：支持多个别名、自动转为字符串并裁剪
	extract := func(keys ...string) string {
		for _, k := range keys {
			if v, ok := m[k]; ok {
				switch vv := v.(type) {
				case string:
					s := strings.TrimSpace(vv)
					if s != "" {
						return s
					}
				case float64:
					s := strings.TrimSpace(fmt.Sprintf("%.0f", vv))
					if s != "" && s != "0" {
						return s
					}
				case bool:
					if vv {
						return "true"
					}
					return "false"
				default:
					b, _ := json.Marshal(vv)
					s := strings.TrimSpace(string(b))
					if s != "" && s != "null" && s != "{}" && s != "[]" {
						return s
					}
				}
			}
		}
		return ""
	}
	result.PatientName = extract("patientName", "name", "patient_name")
	result.Section = extract("section", "dept", "department", "科室")
	result.Unit = extract("unit", "clinic", "departmentUnit", "门诊")
	result.ConsultationTime = extract("consultationTime", "visitTime", "time", "就诊时间")
	result.Diagnosis = extract("diagnosis", "diag", "诊断")
	result.LocalDBIndex = extract("localDBIndex", "index", "localIndex")
	result.CorrelationId = extract("correlationId", "hashId", "identityHash")
	return result
}
