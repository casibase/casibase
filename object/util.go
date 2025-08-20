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
	"fmt"
	"net/url"
	"strings"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/util"
	"github.com/sashabaranov/go-openai"
	"xorm.io/xorm"
)

func getUrlFromPath(path string, origin string) (string, error) {
	if strings.HasPrefix(path, "http") {
		return path, nil
	}

	res := strings.Replace(path, ":", "|", 1)
	res = fmt.Sprintf("storage/%s", res)
	res, err := url.JoinPath(origin, res)
	return res, err
}

func GetDbSession(owner string, offset, limit int, field, value, sortField, sortOrder string) *xorm.Session {
	session := adapter.engine.NewSession()
	if offset != -1 && limit != -1 {
		session.Limit(limit, offset)
	}
	if owner != "" {
		session = session.And("owner=?", owner)
	}
	if field != "" && value != "" {
		if util.FilterField(field) {
			session = session.And(fmt.Sprintf("%s like ?", util.SnakeString(field)), fmt.Sprintf("%%%s%%", value))
		}
	}
	if sortField == "" || sortOrder == "" {
		sortField = "created_time"
	}
	if sortOrder == "ascend" {
		session = session.Asc(util.SnakeString(sortField))
	} else {
		session = session.Desc(util.SnakeString(sortField))
	}
	return session
}

func isAdmin(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}

	res := user.IsAdmin || user.Type == "chat-admin"
	return res
}

func isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	retryableErrors := []string{
		string(openai.RunErrorRateLimitExceeded),
	}

	for _, retryableErr := range retryableErrors {
		if strings.Contains(err.Error(), retryableErr) {
			return true
		}
	}
	return false
}
