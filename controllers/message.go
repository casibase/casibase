// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"encoding/json"

	"github.com/casbin/casibase/object"
)

func (c *ApiController) GetGlobalMessages() {
	messages, err := object.GetGlobalMessages()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

func (c *ApiController) GetMessages() {
	owner := c.Input().Get("owner")

	messages, err := object.GetMessages(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

func (c *ApiController) GetMessage() {
	id := c.Input().Get("id")

	message, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(message)
}

func (c *ApiController) UpdateMessage() {
	id := c.Input().Get("id")

	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateMessage(id, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
