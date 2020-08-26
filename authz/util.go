// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package authz

import "strings"


func checkAndAddPrefix(s string, prefix string) string {
	if strings.HasPrefix(s, prefix) {
		return s
	}
	return prefix + s
}

func Role(role string) string {
	return checkAndAddPrefix(role, "role::")
}

func User(user string) string {
	return checkAndAddPrefix(user, "user::")
}

func Action(act string) string {
	return checkAndAddPrefix(act, "act::")
}

func Object(obj string) string {
	return checkAndAddPrefix(obj, "obj::")
}

func Node(obj string) string {
	return checkAndAddPrefix(obj, "node::")
}
