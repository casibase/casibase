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

package object

import "time"

type ChatMember struct {
	ID        int       `xorm:"'id' pk autoincr" json:"id"`
	UserName  string    `xorm:"'user_name' index" json:"user_name"`
	ChatName  string    `xorm:"'chat_name' index" json:"chat_name"`
	CreatedAt time.Time `xorm:"'created_at' created" json:"created_at"`
	UpdatedAt time.Time `xorm:"'updated_at' updated" json:"updated_at"`
	DeletedAt time.Time `xorm:"'deleted_at' deleted" json:"deleted_at"`
}

func AddChatMember(chatMember *ChatMember) (bool, error) {
	exist, err := adapter.engine.Get(chatMember)
	if err != nil {
		return false, err
	}

	if exist {
		return true, nil
	}

	affected, err := adapter.engine.Insert(chatMember)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func GetChatMembersByChatName(chatName string) ([]ChatMember, error) {
	var members []ChatMember
	err := adapter.engine.Where("chat_name = ?", chatName).Find(&members)
	if err != nil {
		return nil, err
	}
	return members, nil
}

func GetChatMembersByUserName(userName string) ([]ChatMember, error) {
	var members []ChatMember
	err := adapter.engine.Where("user_name = ?", userName).Find(&members)
	if err != nil {
		return nil, err
	}
	return members, nil
}

func DeleteChatMember(chatMember *ChatMember) (bool, error) {
	affected, err := adapter.engine.Delete(chatMember)
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}
