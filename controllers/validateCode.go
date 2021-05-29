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

package controllers

import (
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
)

// GetCaptcha gets captcha.
func (c *ApiController) GetCaptcha() {
	var resp Response

	id, captcha := object.GetCaptcha()

	resp = Response{Status: "ok", Msg: "success", Data: captcha, Data2: id}

	c.Data["json"] = resp
	c.ServeJSON()
}

// GetValidateCode gets validate code.
func (c *ApiController) GetValidateCode() {
	information := c.Input().Get("information")
	verifyType := c.Input().Get("type") // verify type: 1: phone, 2: email.

	id, code := object.GetNewValidateCode(information)

	if verifyType == "1" {
		service.SendSms(information, code)
	} else {
		service.SendRegistrationMail(information, code)
	}

	resp := Response{Status: "ok", Msg: "success", Data: id}

	c.Data["json"] = resp
	c.ServeJSON()
}
