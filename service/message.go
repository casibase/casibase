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
	"context"
	"sync"

	"github.com/casbin/casibase/object"
	"github.com/casbin/casibase/util"
	"golang.org/x/sync/errgroup"
)

var (
	messageServiceOnce = sync.Once{}
	MessageService     Message
)

type Message interface {
	Send(msgFrom string, msgTo string, content string) error
	Subscribe(user string) (chan *object.Message, error)
}

type MessageImpl struct {
	id   IDGenerator
	mq   MessageQueue
	chat Chat
}

func NewMessageService() Message {
	messageServiceOnce.Do(func() {
		MessageService = &MessageImpl{
			id:   NewMessageIdGenerator(),
			mq:   NewMessageQueueImpl(),
			chat: NewChatService(),
		}
	})
	return MessageService
}

func (m *MessageImpl) Send(msgFrom, msgTo, content string) error {
	id, err := m.id.GetStringId()
	if err != nil {
		return err
	}

	newMessage := object.Message{Name: id, Author: msgFrom, Chat: msgTo, Text: content}
	err = util.WarpError(object.AddMessage(&newMessage))
	if err != nil {
		return err
	}

	chatMembers, err := m.chat.GetChatMembers(msgTo)
	if err != nil {
		return err
	}

	eg, _ := errgroup.WithContext(context.Background())
	for _, mem := range chatMembers {
		cp := mem
		eg.Go(func() error {
			err2 := m.mq.Send(cp, &newMessage)
			return err2
		})
	}

	err = eg.Wait()
	return err
}

func (m *MessageImpl) Subscribe(user string) (chan *object.Message, error) {
	return m.mq.Subscribe(user)
}
