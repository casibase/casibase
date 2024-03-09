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

type Message struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	Organization string        `xorm:"varchar(100)" json:"organization"`
	User         string        `xorm:"varchar(100) index" json:"user"`
	Chat         string        `xorm:"varchar(100) index" json:"chat"`
	ReplyTo      string        `xorm:"varchar(100) index" json:"replyTo"`
	Author       string        `xorm:"varchar(100)" json:"author"`
	Text         string        `xorm:"mediumtext" json:"text"`
	FileName     string        `xorm:"varchar(100)" json:"fileName"`
	Comment      string        `xorm:"mediumtext" json:"comment"`
	TokenCount   int           `json:"tokenCount"`
	Price        float64       `json:"price"`
	Currency     string        `xorm:"varchar(100)" json:"currency"`
	IsHidden     bool          `json:"isHidden"`
	VectorScores []VectorScore `xorm:"mediumtext" json:"vectorScores"`
}

func GetGlobalMessages() ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&messages)
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

func GetMessages(owner string) ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Desc("created_time").Find(&messages, &Message{Owner: owner})
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func GetMessagesByUser(owner string, user string) ([]*Message, error) {
	messages := []*Message{}
	err := adapter.engine.Desc("created_time").Find(&messages, &Message{Owner: owner, User: user})
	if err != nil {
		return messages, err
	}

	return messages, nil
}

func isWithinTime(createdTime string, minutes int) bool {
	createdTimeObj, _ := time.Parse(time.RFC3339, createdTime)
	t := createdTimeObj.Add(time.Duration(minutes) * time.Minute)
	return time.Now().Before(t)
}

func GetNearMessageCount(user string, limitMinutes int) (int, error) {
	messages, err := GetMessagesByUser("admin", user)
	if err != nil {
		return -1, err
	}

	count := 0
	for _, message := range messages {
		if message.Author == "AI" && isWithinTime(message.CreatedTime, limitMinutes) {
			count += 1
		}
	}
	return count, nil
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

func UpdateMessage(id string, message *Message) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getMessage(owner, name)
	if err != nil {
		return false, err
	}
	if message == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(message)
	if err != nil {
		return false, err
	}

	return true, nil
}

func RefineMessageImages(message *Message, origin string) error {
	text := message.Text
	re := regexp.MustCompile(`data:image\/([a-zA-Z]*);base64,([^"]*)`)
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

			filePath := fmt.Sprintf(`%s\%s\%s\%s`, message.Organization, message.User, message.Chat, message.FileName)

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
		rawMessage := &model.RawMessage{
			Text:   message.Text,
			Author: message.Author,
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

func GetAnswer(provider string, question string) (string, error) {
	_, modelProviderObj, err := GetModelProviderFromContext("admin", provider)
	if err != nil {
		return "", err
	}

	history := []*model.RawMessage{}
	knowledge := []*model.RawMessage{}
	var writer MyWriter
	_, err = modelProviderObj.QueryText(question, &writer, history, "", knowledge)
	if err != nil {
		return "", err
	}

	res := writer.String()
	res = strings.Trim(res, "\"")
	return res, nil
}
