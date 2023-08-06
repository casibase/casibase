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

package service

import (
	"errors"
	"fmt"
	"strconv"
	"sync"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"

	"github.com/casbin/casibase/object"
	"github.com/casbin/casibase/util"
)

const (
	ChatTypeSingle = 0
	ChatTypeGroup  = 1
	DefaultAvatar  = "https://cdn.casbin.org/img/casbin.svg"
)

type Chat interface {
	AddChat(chatType int64, userName string, displayName string) (string, error)
	AddSingleChat(user1, user2 string) error
	AddGroupChat(displayName string, userName string) (err error)
	AddChatMember(chatName, userName string) error
	DeleteChatMember(chatName, UserName string) error
	GetChatMembers(chatName string) ([]string, error)
	GetChats(userName string) ([]ChatResp, error)
}

var (
	chatServiceOnce sync.Once
	ChatService     Chat
)

type ChatImpl struct {
	Chat
	id IDGenerator
}

func NewChatService() Chat {
	chatServiceOnce.Do(func() {
		ChatService = &ChatImpl{id: NewChatIdGenerator()}
	})
	return ChatService
}

func (s *ChatImpl) AddSingleChat(user1, user2 string) error {
	u, err := casdoorsdk.GetUser(user2)
	if err != nil {
		return err
	}

	if u == nil || u.Name == "" {
		return errors.New(fmt.Sprintf("user %v does not exist", user2))
	}

	id, err := s.AddChat(ChatTypeSingle, user1, "")
	if err != nil {
		return err
	}

	err = s.AddChatMember(id, user1)
	if err != nil {
		return err
	}

	err = s.AddChatMember(id, user2)
	if err != nil {
		return err
	}

	return nil
}

func (s *ChatImpl) AddGroupChat(displayName string, userName string) (err error) {
	id, err := s.AddChat(ChatTypeGroup, userName, displayName)
	if err != nil {
		return err
	}

	err = s.AddChatMember(id, userName)
	return err
}

func (s *ChatImpl) AddChat(chatType int64, userName string, displayName string) (string, error) {
	id, err := s.id.GetStringId()
	if err != nil {
		return "", err
	}

	affect, err := object.AddChat(&object.Chat{Name: id, Type: strconv.FormatInt(chatType, 10), User1: userName, DisplayName: displayName})
	return id, util.WarpError(affect, err)
}

func (s *ChatImpl) GetChatMembers(chatName string) ([]string, error) {
	result, err := object.GetChatMembersByChatName(chatName)
	if err != nil {
		return nil, err
	}

	members := make([]string, len(result))
	for i, r := range result {
		members[i] = r.UserName
	}

	return members, nil
}

func (s *ChatImpl) AddChatMember(chatName, userName string) error {
	member := &object.ChatMember{ChatName: chatName, UserName: userName}
	affect, err := object.AddChatMember(member)
	return util.WarpError(affect, err)
}

func (s *ChatImpl) GetChats(userName string) ([]ChatResp, error) {
	chatMembers, err := object.GetChatMembersByUserName(userName)
	if err != nil {
		return nil, err
	}

	chats := make([]ChatResp, len(chatMembers))
	for i, cm := range chatMembers {
		chats[i].ChatName = cm.ChatName
		chats[i].DisplayName, chats[i].Avatar, err = s.GetDisplayNameAndAvatar(userName, cm.ChatName)
		if err != nil {
			return nil, err
		}

		if chats[i].Avatar == "" {
			chats[i].Avatar = DefaultAvatar
		}

		chats[i].LastMessage = ""
	}

	return chats, nil
}

func (s *ChatImpl) GetDisplayNameAndAvatar(userName, chatName string) (string, string, error) {
	chat, err := object.GetChatByChatName(chatName)
	if err != nil {
		return "", "", nil
	}

	if chat.Type == fmt.Sprintf("%v", ChatTypeSingle) {
		cms, err2 := object.GetChatMembersByChatName(chatName)
		if err2 != nil {
			return "", "", err2
		}

		for _, cm := range cms {
			if cm.UserName != userName {
				other, err3 := casdoorsdk.GetUser(cm.UserName)
				if err3 != nil {
					return "", "", err3
				}

				return other.Name, other.Avatar, nil
			}
		}
	}

	return chat.DisplayName, "", nil
}

func (s *ChatImpl) DeleteChatMember(chatName, UserName string) error {
	return nil
}
