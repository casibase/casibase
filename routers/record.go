// Copyright 2024 The Casibase Authors.. All Rights Reserved.
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

package routers

import (
	"fmt"

	"github.com/beego/beego/context"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func RecordMessage(ctx *context.Context) {
	if ctx.Request.URL.Path == "/api/login" || ctx.Request.URL.Path == "/api/signup" || ctx.Request.URL.Path == "/api/get-assets" {
		return
	}

	userId := getUsername(ctx)
	ctx.Input.SetParam("recordUserId", userId)
}

func AfterRecordMessage(ctx *context.Context) {
	record, err := object.NewRecord(ctx)
	if err != nil {
		fmt.Printf("AfterRecordMessage() error: %s\n", err.Error())
		return
	}

	userId := ctx.Input.Params()["recordUserId"]
	if userId != "" {
		record.Organization, record.User = util.GetOwnerAndNameFromId(userId)
	}

	object.AddRecord(record)
}
