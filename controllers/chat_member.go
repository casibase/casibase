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
	"fmt"

	"github.com/casbin/casibase/service"
)

func (c *ApiController) AddChatMember() {
	chatName := c.Input().Get("chatName")
	userName := c.Input().Get("userName")
	if chatName == "" || userName == "" {
		c.ResponseError("missing parameter")
	}

	err := service.NewChatService().AddChatMember(chatName, userName)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk()
}

func (c *ApiController) GetChatMembersByChatName() {
	chatName := c.Input().Get("chatName")
	members, err := service.NewChatService().GetChatMembers(chatName)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(members)
}

func (c *ApiController) GetChatByUserName() {
	userName := c.Input().Get("userName")
	chats, err := service.NewChatService().GetChats(userName)
	fmt.Println(chats)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chats)
}

func (c *ApiController) UserAddChat() {
	user1 := c.GetSessionUser()
	tp := c.Input().Get("chatType")
	name := c.Input().Get("name")
	if tp == "0" {
		err := service.NewChatService().AddSingleChat(user1.Name, name)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	} else {
		err := service.NewChatService().AddGroupChat(name, user1.Name)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk()
}
