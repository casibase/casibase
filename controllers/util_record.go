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
	"fmt"
	"strings"

	"github.com/beego/beego/context"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/util"
)

func NewRecord(ctx *context.Context) *casdoorsdk.Record {
	ip := strings.Replace(util.GetIPFromRequest(ctx.Request), ": ", "", -1)
	action := strings.Replace(ctx.Request.URL.Path, "/api/", "", -1)
	requestUri := util.FilterQuery(ctx.Request.RequestURI, []string{"accessToken"})
	if len(requestUri) > 1000 {
		requestUri = requestUri[0:1000]
	}

	record := casdoorsdk.Record{
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		ClientIp:    ip,
		User:        "",
		Method:      ctx.Request.Method,
		RequestUri:  requestUri,
		Action:      action,
		IsTriggered: false,
	}
	return &record
}

func addRecord(c *ApiController, userName string, requestUri string) {
	record := NewRecord(c.Ctx)
	record.User = userName
	if requestUri != "" {
		record.RequestUri = requestUri
	}

	util.SafeGoroutine(func() {
		_, err := casdoorsdk.AddRecord(record)
		if err != nil {
			panic(err)
		}
	})
}

func addRecordForFile(c *ApiController, userName string, action string, storeId string, key string, filename string, isLeaf bool) {
	typ := "Folder"
	if isLeaf {
		typ = "File"
	}

	_, storeName := util.GetOwnerAndNameFromId(storeId)

	path := fmt.Sprintf("/%s/%s", key, filename)
	if filename == "" {
		path = key
	}

	text := fmt.Sprintf("%s%s, Store: %s, Path: %s", action, typ, storeName, path)
	addRecord(c, userName, text)
}
