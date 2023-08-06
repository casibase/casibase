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
	"sync"

	"github.com/casbin/casibase/object"
)

type MessageQueue interface {
	Send(topic string, message *object.Message) error
	Subscribe(topic string) (chan *object.Message, error)
}

type MessageQueueImpl struct {
	userMessage map[string]chan *object.Message
	mu          sync.Mutex
}

func NewMessageQueueImpl() *MessageQueueImpl {
	return &MessageQueueImpl{userMessage: make(map[string]chan *object.Message)}
}

func (m *MessageQueueImpl) Send(topic string, message *object.Message) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.userMessage[topic]; !ok {
		m.userMessage[topic] = make(chan *object.Message, 1000)
	}

	select {
	case m.userMessage[topic] <- message:
		fmt.Println(topic, message)
		return nil
	default:
		return errors.New("channel is full")
	}
}

func (m *MessageQueueImpl) Subscribe(topic string) (chan *object.Message, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.userMessage[topic]; !ok {
		m.userMessage[topic] = make(chan *object.Message, 1000)
	}

	return m.userMessage[topic], nil
}
