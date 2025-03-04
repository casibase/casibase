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
	"fmt"

	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func addRecord(c *ApiController, userName string, requestUri string) {
	record, err := object.NewRecord(c.Ctx)
	if err != nil {
		fmt.Printf("addRecord() error: %s\n", err.Error())
		return
	}

	record.User = userName
	if requestUri != "" {
		record.RequestUri = requestUri
	}

	record.Organization = conf.GetConfigString("casdoorOrganization")

	object.AddRecord(record)
}

func addRecordForFile(c *ApiController, userName string, action string, sessionId string, key string, filename string, isLeaf bool) {
	typ := "Folder"
	if isLeaf {
		typ = "File"
	}

	_, storeName := util.GetOwnerAndNameFromId(sessionId)

	path := fmt.Sprintf("/%s/%s", key, filename)
	if filename == "" {
		path = key
	}

	text := fmt.Sprintf("%s%s, Session: %s, Path: %s", action, typ, storeName, path)
	addRecord(c, userName, text)
}
