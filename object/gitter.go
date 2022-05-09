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

package object

import (
	"encoding/json"
	"errors"
	"fmt"
	"runtime"
	"strconv"
	"time"

	"github.com/astaxie/beego/logs"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
	"github.com/sromku/go-gitter"
)

type topicGitter struct {
	Topic        Topic
	Massages     []gitter.Message
	MemberMsgMap map[string]int
}

var roomSyncMsgMap = map[string]string{}

// initialize value
var (
	lastMsg      = gitter.Message{}
	lastTopic    = topicGitter{MemberMsgMap: map[string]int{}}
	currentTopic = topicGitter{MemberMsgMap: map[string]int{}}
)

func AutoSyncGitter() {
	if AutoSyncPeriodSecond < 30 {
		return
	}
	for {
		time.Sleep(time.Duration(AutoSyncPeriodSecond) * time.Second)
		SyncAllGitterRooms()
	}
	//SyncAllGitterRooms()
}

func SyncAllGitterRooms() {
	fmt.Println("Sync from gitter room started...")
	var nodes []Node
	err := adapter.Engine.Find(&nodes)
	if err != nil {
		panic(err)
	}
	for _, node := range nodes {
		node.SyncGitter()
	}
}

func (n Node) SyncGitter() {
	if n.GitterRoomURL == "" || n.GitterApiToken == "" {
		return
	}

	defer func() {
		if err := recover(); err != nil {
			handleErr(err.(error))
		}
	}()

	// Get your own token At https://developer.gitter.im/
	api := gitter.New(n.GitterApiToken)

	// get room id by room url
	rooms, err := api.GetRooms()
	if err != nil {
		panic(err)
	}
	fmt.Println("gitter room urls:", n.GitterRoomURL)

	room := gitter.Room{}
	for _, v := range rooms { // find RoomId by url
		if "https://gitter.im/"+v.URI == n.GitterRoomURL {
			room = v
			break
		}
	}
	if room.Name == "" {
		panic(errors.New("room is not exist"))
	}

	messages := []gitter.Message{}
	// get sync index, it is the last sync message id
	idx, ok := roomSyncMsgMap[room.ID]
	if !ok { // get all msg if idx is not exist
		messages, err = api.GetMessages(room.ID, nil) // the api limits the number of messages to 100
		if err != nil {
			panic(err)
		}
		for {
			msgs, err := api.GetMessages(room.ID, &gitter.Pagination{
				BeforeID: messages[0].ID,
			})
			if err != nil {
				panic(err)
			}
			if len(msgs) == 0 {
				break
			}
			messages = append(msgs, messages...)
		}
		fmt.Printf("sync msg for room(msgNum:%d): %s\n", len(messages), room.Name)
	} else { // get msg after sync index
		messages, err = api.GetMessages(room.ID, &gitter.Pagination{
			AfterID: idx,
		})
	}

	topics := n.GetAllTopicsByNode()
	GetTopicExist := func(topicTitle string) Topic {
		for _, topic := range topics {
			if topic.Title == topicTitle {
				return topic
			}
		}
		return Topic{}
	}

	for _, msg := range messages {
		func() {
			defer func() {
				if err := recover(); err != nil {
					handleErr(err.(error))
				}
			}()

			// add index to sync message
			roomSyncMsgMap[room.ID] = msg.ID
			// create if user is not exist
			user, err := auth.GetUser(msg.From.Username)
			//fmt.Println("user:", user)
			if err != nil {
				panic(err)
			}
			if user.Id == "" { // add user
				newUser := auth.User{
					Name:              msg.From.Username,
					CreatedTime:       util.GetCurrentTime(),
					UpdatedTime:       util.GetCurrentTime(),
					DisplayName:       msg.From.DisplayName,
					Avatar:            msg.From.AvatarURLMedium,
					SignupApplication: CasdoorApplication,
				}
				fmt.Println("add user: ", newUser.Name)
				_, err := auth.AddUser(&newUser)
				if err != nil {
					panic(err)
				}
			}

			var mentioned = false // if @user
			for _, mention := range msg.Mentions {
				if mention.ScreenName == lastMsg.From.Username {
					mentioned = true
					break
				}
			}

			d := msg.Sent.Sub(lastMsg.Sent)
			dur, err := strconv.Atoi("4")
			//dur, err := strconv.Atoi(topicDuration[roomIdx])
			if err != nil {
				panic(err)
			}
			if d > time.Hour*time.Duration(dur) && !mentioned { // if dur > `TopicDuration` and not @user last replied
				author := msg.From.Username
				tmpStr := []rune(msg.Text)
				if len(tmpStr) > 200 { // limit length
					tmpStr = tmpStr[:200]
				}
				title := string(tmpStr)
				content := msg.Text
				msgTime := msg.Sent

				topic := GetTopicExist(title)
				if topic.Id == 0 { // not exist
					// add topic
					topic = Topic{
						Author:      author,
						NodeId:      n.Id,
						NodeName:    n.Name,
						TabId:       n.TabId,
						Title:       title,
						CreatedTime: msgTime.String(),
						Content:     content,
						IsHidden:    false,
					}

					_, topicID := AddTopic(&topic)
					topic.Id = topicID
				}

				// deep copy
				data, _ := json.Marshal(currentTopic)
				_ = json.Unmarshal(data, &lastTopic)

				// new currentTopic
				currentTopic = topicGitter{Topic: topic, MemberMsgMap: map[string]int{}}
				currentTopic.Massages = append(currentTopic.Massages, msg)
				currentTopic.MemberMsgMap[author]++
			} else {
				// add reply to lastTopic
				reply := Reply{
					Author:      msg.From.Username,
					TopicId:     currentTopic.Topic.Id,
					CreatedTime: msg.Sent.String(),
					Content:     msg.Text,
				}
				_, _ = AddReply(&reply)

				ChangeTopicReplyCount(reply.TopicId, 1)
				ChangeTopicLastReplyUser(currentTopic.Topic.Id, msg.From.Username, msg.Sent.String())

				currentTopic.Massages = append(currentTopic.Massages, msg)
				currentTopic.MemberMsgMap[msg.From.Username]++
			}

			// deep copy
			data, _ := json.Marshal(msg)
			_ = json.Unmarshal(data, &lastMsg)
		}()
	}
}

func handleErr(err error) {
	var stack string
	logs.Critical("Handler crashed with error:", err)
	for i := 1; ; i++ {
		_, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		logs.Critical(fmt.Sprintf("%s:%d", file, line))
		stack = stack + fmt.Sprintln(fmt.Sprintf("%s:%d", file, line))
	}
}
