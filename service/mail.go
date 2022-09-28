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

package service

import (
	"fmt"
	"strings"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

// SendRemindMail sends mail with remind information.
func SendRemindMail(fromName string, title string, content string, topicId string, sender string, receiver string, domain string) error {
	title = fmt.Sprintf("Re: [%s] %s", sender, title)

	content = content + `<p style="font-size:small;-webkit-text-size-adjust:none;color:#666;">-
<br>
You are receiving this because you are subscribed to this thread.
<br> Reply to this email directly, 
<a href="https://` + domain + "/t/" + topicId + `">view it on ` + fromName + `</a>` + `
, or <a href="https://` + domain + `/settings/forum">unsubscribe` + `</a>`

	return SendEmail(title, content, fromName, receiver)
}

func SendEmail(title string, content string, sender string, receivers ...string) error {
	err := casdoorsdk.SendEmail(title, content, sender, receivers...)
	if err != nil && strings.HasPrefix(err.Error(), "No provider for category: \"Email\" is found") {
		return nil
	}
	return err
}
