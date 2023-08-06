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
	"strconv"

	"github.com/casbin/casibase/util"
)

const (
	chatWorker    = 1
	messageWorker = 2
)

type IDGenerator interface {
	GetId() (int64, error)
	GetStringId() (string, error)
}

type ChatIdGenerator struct {
	IDGenerator
	snow *util.Snow
}

func NewChatIdGenerator() *ChatIdGenerator {
	return &ChatIdGenerator{snow: util.NewSnow(chatWorker)}
}

func (c *ChatIdGenerator) GetId() (int64, error) {
	return c.snow.GetSnowFlakeID()
}

func (c *ChatIdGenerator) GetStringId() (string, error) {
	id, err := c.GetId()
	if err != nil {
		return "", err
	}

	return strconv.FormatInt(id, 10), err
}

type MessageIdGenerator struct {
	IDGenerator
	snow *util.Snow
}

func NewMessageIdGenerator() *MessageIdGenerator {
	return &MessageIdGenerator{snow: util.NewSnow(messageWorker)}
}

func (m *MessageIdGenerator) GetId() (int64, error) {
	return m.snow.GetSnowFlakeID()
}

func (m *MessageIdGenerator) GetStringId() (string, error) {
	id, err := m.GetId()
	if err != nil {
		return "", err
	}

	return strconv.FormatInt(id, 10), err
}
