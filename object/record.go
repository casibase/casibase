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

	Organization string `xorm:"varchar(100)" json:"organization"`
	ClientIp     string `xorm:"varchar(100)" json:"clientIp"`
	UserAgent    string `xorm:"varchar(200)" json:"userAgent"`
	User         string `xorm:"varchar(100)" json:"user"`
	Method       string `xorm:"varchar(100)" json:"method"`
	RequestUri   string `xorm:"varchar(1000)" json:"requestUri"`
	Action       string `xorm:"varchar(1000)" json:"action"`
	Language     string `xorm:"varchar(100)" json:"language"`
	Region       string `xorm:"varchar(100)" json:"region"`
	City         string `xorm:"varchar(100)" json:"city"`
	Unit         string `xorm:"varchar(100)" json:"unit"`
	Section      string `xorm:"varchar(100)" json:"section"`
	DiseaseCategory      string `xorm:"varchar(256)" json:"diseaseCategory"`


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
}

type Response struct {
	Status string `json:"status"`
	Msg    string `json:"msg"`
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

// GetRecord retrieves a record by its ID or owner/name format.
func GetRecord(id string) (*Record, error) {
	record := &Record{}

	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, fmt.Errorf("failed to parse record identifier '%s': neither a valid owner/[id|name] format", id)
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
		return nil, fmt.Errorf("failed to get record with id '%s': %w", id, err)
	}
	if existed {
		return record, nil
	}

	return nil, nil
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

func UpdateRecord(id string, record *Record) (bool, error) {
	p, err := GetRecord(id)
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

func UpdateRecordFields(id string, fields map[string]interface{}) (bool, error) {
	p, err := GetRecord(id)
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

func AddRecord(record *Record) (bool, interface{}, error) {
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

	// 将记录添加到IPFS归档队列
	// AddRecordToArchiveQueue(record)

	data := map[string]interface{}{"name": record.Name}

	if record.NeedCommit {
		_, commitResult, err := CommitRecord(record)
		if err != nil {
			data["error_text"] = err.Error()
		} else {
			data = commitResult
		}
	}

	return affected != 0, data, nil
}

func AddRecords(records []*Record, syncEnabled bool) (bool, interface{}, error) {
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
			_, commitResults := CommitRecords(needCommitRecords)
			for i, idx := range needCommitRecordsIdx {
				data[idx] = commitResults[i]
			}
		} else {
			go ScanNeedCommitRecords()
		}
	}

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

func (r *Record) updateErrorText(errText string) (bool, error) {
	r.ErrorText = errText
	if r.Id != 0 {
		affected, err := adapter.engine.Where("owner = ? AND name = ?", r.Owner, r.Name).Cols("error_text").Update(r)
		if err != nil {
			return affected > 0, fmt.Errorf("failed to update error text for record %s: %s", r.getId(), err)
		}
		return affected > 0, nil
	} else {
		affected, err := adapter.engine.ID(r.Id).Cols("error_text").Update(r)
		if err != nil {
			return affected > 0, fmt.Errorf("failed to update error text for record %s: %s", r.getUniqueId(), err)
		}
		return affected > 0, nil
	}
}
