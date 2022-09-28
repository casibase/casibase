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

package object

import (
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/microcosm-cc/bluemonday"
)

func HasNode(id string) bool {
	node := GetNode(id)

	return node != nil
}

func HasTab(id string) bool {
	tab := GetTab(id)

	return tab != nil
}

func HasPlane(id string) bool {
	plane := GetPlane(id)

	return plane != nil
}

// IsForbidden check member whether is forbidden.
func IsForbidden(user *casdoorsdk.User) bool {
	return user.IsForbidden
}

func FilterUnsafeHTML(content string) string {
	if content == "" {
		return content
	}
	p := bluemonday.UGCPolicy()
	p.AllowAttrs("style").OnElements("span")
	p.AllowElements("video")
	p.AllowAttrs("width").OnElements("video")
	p.AllowAttrs("controls").OnElements("video")
	p.AllowAttrs("src").OnElements("source")
	p.AllowAttrs("type").OnElements("source")
	p.AllowAttrs("style").OnElements("video")
	res := p.Sanitize(content)
	return res
}
