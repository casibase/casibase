// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type VectorScore struct {
	Vector string  `xorm:"varchar(100)" json:"vector"`
	Score  float32 `json:"score"`
}

type Suggestion struct {
	Text  string `json:"text"`
	IsHit bool   `json:"isHit"`
}

type Message struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	Organization      string        `xorm:"varchar(100)" json:"organization"`
	User              string        `xorm:"varchar(100) index" json:"user"`
	Chat              string        `xorm:"varchar(100) index" json:"chat"`
	ReplyTo           string        `xorm:"varchar(100) index" json:"replyTo"`
	Author            string        `xorm:"varchar(100)" json:"author"`
	Text              string        `xorm:"mediumtext" json:"text"`
	ReasonText        string        `xorm:"mediumtext" json:"reasonText"`
	ErrorText         string        `xorm:"mediumtext" json:"errorText"`
	FileName          string        `xorm:"varchar(100)" json:"fileName"`
	Comment           string        `xorm:"mediumtext" json:"comment"`
	TokenCount        int           `json:"tokenCount"`
	TextTokenCount    int           `json:"textTokenCount"`
	Price             float64       `json:"price"`
	Currency          string        `xorm:"varchar(100)" json:"currency"`
	IsHidden          bool          `json:"isHidden"`
	IsDeleted         bool          `json:"isDeleted"`
	NeedNotify        bool          `json:"needNotify"`
	IsAlerted         bool          `json:"isAlerted"`
	IsRegenerated     bool          `json:"isRegenerated"`
	ModelProvider     string        `xorm:"varchar(100)" json:"modelProvider"`
	EmbeddingProvider string        `xorm:"varchar(100)" json:"embeddingProvider"`
	VectorScores      []VectorScore `xorm:"mediumtext" json:"vectorScores"`
	LikeUsers         []string      `json:"likeUsers"`
	DisLikeUsers      []string      `json:"dislikeUsers"`
	Suggestions       []Suggestion  `json:"suggestions"`
}

func GetGlobalMessages() ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&messages)
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func GetGlobalMessagesByCreatedTime() ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Asc("owner").Asc("created_time").Find(&messages)
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func GetChatMessages(chat string) ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Asc("created_time").Find(&messages, &Message{Chat: chat})
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func GetMessages(owner string, user string) ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Desc("created_time").Find(&messages, &Message{Owner: owner, User: user})
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func GetNearMessageCount(user string, limitMinutes int) (int, error) {
	sinceTime := time.Now().Add(-time.Minute * time.Duration(limitMinutes))
	nearMessageCount, err := adapter.engine.Desc("created_time").Where("created_time >= ?", sinceTime).Count(&Message{Owner: "admin", User: user, Author: "AI"})
	if err != nil {
		return -1, err
	}
	return int(nearMessageCount), nil
}

func getMessage(owner, name string) (*Message, error) {
	message := Message{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&message)
	if err != nil {
		return &message, err
	}

	if existed {
		return &message, nil
	} else {
		return nil, nil
	}
}

func GetMessage(id string) (*Message, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getMessage(owner, name)
}

func UpdateMessage(id string, message *Message, isHitOnly bool) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	originMessage, err := getMessage(owner, name)
	if err != nil {
		return false, err
	}
	if message == nil {
		return false, nil
	}

	if originMessage.TextTokenCount == 0 || originMessage.Text != message.Text {
		size, err := getMessageTextTokenCount(message.ModelProvider, message.Text)
		if err != nil {
			return false, err
		}
		message.TextTokenCount = size
	}

	if isHitOnly {
		_, err = adapter.engine.ID(core.PK{owner, name}).Cols("suggestions").Update(message)
	} else {
		_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(message)
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func RefineMessageFiles(message *Message, origin string) error {
	text := message.Text
	// re := regexp.MustCompile(`data:image\/([a-zA-Z]*);base64,([^"]*)`)
	re := regexp.MustCompile(`data:([a-zA-Z]*\/[a-zA-Z\-\.]*);base64,([^"]*)`)
	matches := re.FindAllString(text, -1)
	if matches != nil {
		store, err := GetDefaultStore("admin")
		if err != nil {
			return err
		}

		obj, err := store.GetImageProviderObj()
		if err != nil {
			return err
		}

		for _, match := range matches {
			var content []byte
			content, err = parseBase64Image(match)
			if err != nil {
				return err
			}

			filePath := fmt.Sprintf("%s/%s/%s/%s", message.Organization, message.User, message.Chat, message.FileName)

			var fileUrl string
			fileUrl, err = obj.PutObject(message.User, message.Chat, filePath, bytes.NewBuffer(content))
			if err != nil {
				return err
			}

			if strings.Contains(fileUrl, "?") {
				tokens := strings.Split(fileUrl, "?")
				fileUrl = tokens[0]
			}

			var httpUrl string
			httpUrl, err = getUrlFromPath(fileUrl, origin)
			if err != nil {
				return err
			}

			text = strings.Replace(text, match, httpUrl, 1)
		}
	}

	message.Text = text
	return nil
}

func AddMessage(message *Message) (bool, error) {
	size, err := getMessageTextTokenCount(message.ModelProvider, message.Text)
	if err != nil {
		return false, err
	}
	message.TextTokenCount = size
	affected, err := adapter.engine.Insert(message)
	if err != nil {
		return false, err
	}

	if affected != 0 {
		var chat *Chat
		chat, err = getChat(message.Owner, message.Chat)
		if err != nil {
			return false, err
		}

		if chat != nil {
			chat.UpdatedTime = util.GetCurrentTime()
			chat.MessageCount += 1
			_, err = UpdateChat(chat.GetId(), chat)
			if err != nil {
				return false, err
			}
		}
	}

	return affected != 0, nil
}

func DeleteMessage(message *Message) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{message.Owner, message.Name}).Delete(&Message{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteAllLaterMessages(messageId string) error {
	originMessage, err := GetMessage(messageId)
	if err != nil {
		return err
	}
	// Get all messages for this chat
	allMessages, err := GetChatMessages(originMessage.Chat)
	if err != nil {
		return err
	}

	// Find and delete messages created after the original message
	for _, msg := range allMessages {
		if msg.CreatedTime >= originMessage.CreatedTime {
			_, err := DeleteMessage(msg)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func DeleteMessagesByChat(message *Message) (bool, error) {
	affected, err := adapter.engine.Delete(&Message{Owner: message.Owner, Chat: message.Chat})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (message *Message) GetId() string {
	return fmt.Sprintf("%s/%s", message.Owner, message.Name)
}

func GetRecentRawMessages(chat string, createdTime string, memoryLimit int) ([]*model.RawMessage, error) {
	res := []*model.RawMessage{}
	if memoryLimit == 0 {
		return res, nil
	}

	messages := []*Message{}
	err := adapter.engine.Where("created_time <= ?", createdTime).Desc("created_time").Limit(2*memoryLimit, 2).Find(&messages, &Message{Chat: chat})
	if err != nil {
		return nil, err
	}

	for _, message := range messages {
		rawTextTokenCount := message.TextTokenCount
		if rawTextTokenCount == 0 {
			rawTextTokenCount, err = getMessageTextTokenCount(message.ModelProvider, message.Text)
			if err != nil {
				return nil, err
			}
		}
		rawMessage := &model.RawMessage{
			Text:           message.Text,
			Author:         message.Author,
			TextTokenCount: message.TextTokenCount,
		}
		res = append(res, rawMessage)
	}
	return res, nil
}

type MyWriter struct {
	bytes.Buffer
}

func (w *MyWriter) Flush() {}

func (w *MyWriter) Write(p []byte) (n int, err error) {
	s := string(p)
	if strings.HasPrefix(s, "event: message\ndata: ") && strings.HasSuffix(s, "\n\n") {
		data := strings.TrimSuffix(strings.TrimPrefix(s, "event: message\ndata: "), "\n\n")
		return w.Buffer.WriteString(data)
	}
	return w.Buffer.Write(p)
}

func GetAnswer(provider string, question string) (string, *model.ModelResult, error) {
	_, modelProviderObj, err := GetModelProviderFromContext("admin", provider)
	if err != nil {
		return "", nil, err
	}

	history := []*model.RawMessage{}
	knowledge := []*model.RawMessage{}
	var writer MyWriter

	modelResult, err := modelProviderObj.QueryText(question, &writer, history, "", knowledge)
	if err != nil {
		return "", nil, err
	}

	res := writer.String()
	res = strings.Trim(res, "\"")
	return res, modelResult, nil
}

func GetMessageCount(owner string, field string, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Message{})
}

func GetPaginationMessage(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Message, error) {
	messages := []*Message{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&messages)
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func getMessageTextTokenCount(modelName string, text string) (int, error) {
	tokenCount, err := model.GetTokenSize(modelName, text)
	if err != nil {
		tokenCount, err = model.GetTokenSize("gpt-3.5-turbo", text)
	}
	if err != nil {
		return 0, err
	}
	return tokenCount, nil
}
