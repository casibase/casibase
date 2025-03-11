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
	UserAgent    string `xorm:"varchar(100)" json:"userAgent"`
	User         string `xorm:"varchar(100)" json:"user"`
	Method       string `xorm:"varchar(100)" json:"method"`
	RequestUri   string `xorm:"varchar(1000)" json:"requestUri"`
	Action       string `xorm:"varchar(1000)" json:"action"`
	Language     string `xorm:"varchar(100)" json:"language"`

	Object   string `xorm:"mediumtext" json:"object"`
	Response string `xorm:"mediumtext" json:"response"`
	// ExtendedUser *User  `xorm:"-" json:"extendedUser"`

	Provider    string `xorm:"varchar(100)" json:"provider"`
	Block       string `xorm:"varchar(100)" json:"block"`
	Transaction string `xorm:"varchar(500)" json:"transaction"`
	IsTriggered bool   `json:"isTriggered"`
}

type Response struct {
	Status string `json:"status"`
	Msg    string `json:"msg"`
}

func GetRecordCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
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

func GetPaginationRecords(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Record, error) {
	records := []*Record{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&records)
	if err != nil {
		return records, err
	}

	return records, nil
}

func getRecord(owner string, name string) (*Record, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	record := Record{Name: name}
	existed, err := adapter.engine.Get(&record)
	if err != nil {
		return &record, err
	}

	if existed {
		return &record, nil
	} else {
		return nil, nil
	}
}

func GetRecord(id string) (*Record, error) {
	owner, name := util.GetOwnerAndNameFromIdNoCheck(id)
	return getRecord(owner, name)
}

func UpdateRecord(id string, record *Record) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	if p, err := getRecord(owner, name); err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.Where("name = ?", name).AllCols().Update(record)
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
	if ctx.Input.RequestBody != nil && len(ctx.Input.RequestBody) != 0 {
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

	record := Record{
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		ClientIp:    ip,
		User:        "",
		Method:      ctx.Request.Method,
		RequestUri:  requestUri,
		Action:      action,
		Language:    languageCode,
		Object:      object,
		Response:    fmt.Sprintf("{\"status\":\"%s\",\"msg\":\"%s\"}", resp.Status, resp.Msg),
		IsTriggered: false,
	}
	return &record, nil
}

func AddRecord(record *Record) bool {
	if logPostOnly {
		if record.Method == "GET" {
			return false
		}
	}

	if strings.HasSuffix(record.Action, "-record") {
		return false
	}

	if record.Provider == "" {
		provider, err := getActiveBlockchainProvider("admin")
		if err != nil {
			panic(err)
		}

		if provider != nil {
			record.Provider = provider.Name
		}
	}

	record.Owner = record.Organization

	affected, err := adapter.engine.Insert(record)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteRecord(record *Record) (bool, error) {
	affected, err := adapter.engine.Where("name = ?", record.Name).Delete(&Record{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (record *Record) getId() string {
	return fmt.Sprintf("%s/%s", record.Owner, record.Name)
}
