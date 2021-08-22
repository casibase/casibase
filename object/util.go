// Copyright 2021 The casbin Authors. All Rights Reserved.
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
	"strconv"

	"github.com/casdoor/casdoor-go-sdk/auth"
)

func GetUserField(user *auth.User, field string) string {
	return user.Properties[field]
}

func GetUserFieldInt(user *auth.User, field string) int {
	res, err := strconv.Atoi(user.Properties[field])
	if err != nil {
		panic(err)
	}

	return res
}

func SetUserField(user *auth.User, field string, value string) {
	user.Properties[field] = value
}

func SetUserFieldInt(user *auth.User, field string, value int) {
	user.Properties[field] = strconv.Itoa(value)
}

func IntToBool(i int) bool {
	b := false
	if i == 1 {
		b = true
	}
	return b
}

func BoolToInt(i bool) int {
	b := 0
	if i {
		b = 1
	}
	return b
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Limit(users []*auth.User, start, limit int) []*auth.User {
	if start >= len(users) {
		return nil
	}

	end := minInt(len(users), start+limit)
	return users[start:end]
}
