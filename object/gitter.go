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
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/astaxie/beego/logs"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/sromku/go-gitter"
)

const (
	topicDuration = "4" // Hours
	apiLIMIT      = 10  // request frequency
)

type topicGitter struct {
	Topic        Topic
	Massages     []gitter.Message
	MemberMsgMap map[string]int
}

var (
	roomSyncMsgHeadMap = map[string]string{}
	roomSyncMsgTailMap = map[string]string{}
	lastMsgMap         = map[string]gitter.Message{}
	lastTopicMap       = map[string]topicGitter{}
	currentTopicMap    = map[string]topicGitter{}
)

func AutoSyncGitter() {
	if AutoSyncPeriodSecond < 30 {
		return
	}

	SyncAllGitterRooms()
	for {
		time.Sleep(time.Duration(AutoSyncPeriodSecond) * time.Second)
		SyncAllGitterRooms()
	}
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

	topics := n.GetAllTopicsByNode()
	topicNum := len(topics)

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		messages := []gitter.Message{}

		// get sync index, it is the last sync message id
		headIdx, ok := roomSyncMsgHeadMap[room.ID]
		if !ok { // get all msg if idx is not exist
			for _, topic := range topics {
				if topic.GitterMessageId != "" {
					// get reply
					replies := GetRepliesOfTopic(topic.Id)
					// get sync msg idx
					num := len(replies)
					if num == 0 {
						headIdx = topic.GitterMessageId
						break
					}

					flag := false
					for i := num - 1; i >= 0; i-- {
						if replies[i].GitterMessageId != "" {
							headIdx = replies[i].GitterMessageId
							flag = true
							break
						}
					}
					if flag {
						break
					}
				}
			}
		}

		// the api limits the number of messages to 50
		messages, err = api.GetMessages(room.ID, &gitter.Pagination{
			AfterID: headIdx,
		})
		if err != nil {
			panic(err)
		}
		if len(messages) == 0 {
			roomSyncMsgHeadMap[room.ID] = headIdx
			return
		}

		for i := 0; i < apiLIMIT; i++ { // restrict request frequency
			msgs, err := api.GetMessages(room.ID, &gitter.Pagination{
				AfterID: messages[len(messages)-1].ID,
			})
			if err != nil {
				panic(err)
			}
			if len(msgs) == 0 {
				break
			}
			messages = append(messages, msgs...)
		}

		fmt.Printf("sync msg for room(msgNum:%d): %s\n", len(messages), room.Name)
		createTopicWithMessages(messages, room, n, topics, true)
	}()

	// tail
	go func() {
		defer wg.Done()
		messages := []gitter.Message{}

		tailIdx, ok := roomSyncMsgTailMap[room.ID]
		if !ok {
			for i := topicNum - 1; i >= 0; i-- {
				topic := topics[i]
				if topic.GitterMessageId != "" {
					tailIdx = topic.GitterMessageId
					break
				}
			}
		}

		t := time.Time{}
		tExist := true // if t is not exist, sync all msg
		if n.GitterSyncFromTime == "" {
			tExist = false
		} else {
			t, err = time.Parse(time.RFC3339, n.GitterSyncFromTime)
			if err != nil {
				panic(err)
			}
		}

		if tailIdx != "" {
			tailMsg, err := api.GetMessage(room.ID, tailIdx)
			if err != nil {
				panic(err)
			}

			if tExist {
				if tailMsg.Sent.Before(t) { // if msg is before the start time, end sync tail
					return
				}
			}
		} else {
			messages, err = api.GetMessages(room.ID, nil)
			if len(messages) != 0 {
				tailIdx = messages[0].ID
			}
		}

		messages, err = api.GetMessages(room.ID, &gitter.Pagination{
			BeforeID: tailIdx,
		})
		if err != nil {
			panic(err)
		}
		if len(messages) == 0 {
			roomSyncMsgTailMap[room.ID] = tailIdx
			return
		}

		for i := 0; i < apiLIMIT; i++ { // restrict request frequency
			msgs, err := api.GetMessages(room.ID, &gitter.Pagination{
				BeforeID: messages[0].ID,
			})
			if err != nil {
				panic(err)
			}
			num := len(msgs)
			if num == 0 {
				break
			}

			// if msg is before the start time, end sync tail
			if tExist {
				if msgs[0].Sent.Before(t) {
					for i := num - 1; i > 0; i-- {
						if msgs[i].Sent.Before(t) {
							if i == num-1 {
								msgs = []gitter.Message{}
							} else {
								msgs = msgs[i+1:]
							}
							break
						}
					}
					messages = append(msgs, messages...)
					break
				}
			}
			messages = append(msgs, messages...)
		}

		fmt.Printf("sync msg for room(msgNum:%d): %s\n", len(messages), room.Name)
		createTopicWithMessages(messages, room, n, topics, false)
	}()
	wg.Wait()
}

// main create topic func
func createTopicWithMessages(messages []gitter.Message, room gitter.Room, node Node, topics []Topic, asc bool) {
	GetTopicExist := func(topicTitle string) Topic {
		for _, topic := range topics {
			if topic.Title == topicTitle {
				return topic
			}
		}
		return Topic{}
	}

	// initialize value
	lastMsg, ok := lastMsgMap[room.ID]
	if !ok {
		lastMsg = gitter.Message{}
	}
	lastTopic := lastTopicMap[room.ID]
	if !ok {
		lastTopic = topicGitter{MemberMsgMap: map[string]int{}}
	}
	currentTopic, ok := currentTopicMap[room.ID]
	if !ok {
		currentTopic = topicGitter{MemberMsgMap: map[string]int{}}
	}

	for _, msg := range messages {
		func() {
			defer func() {
				if err := recover(); err != nil {
					handleErr(err.(error))
				}
			}()

			// create if user is not exist
			user, err := casdoorsdk.GetUser(msg.From.Username)
			// fmt.Println("user:", user)
			if err != nil {
				panic(err)
			}
			if user.Id == "" { // add user
				avatar := getGitterAvatarUrl(msg.From.Username, msg.From.AvatarURLMedium) // if error, avatar will be ""
				newUser := casdoorsdk.User{
					Name:              msg.From.Username,
					CreatedTime:       util.GetCurrentTime(),
					UpdatedTime:       util.GetCurrentTime(),
					DisplayName:       msg.From.DisplayName,
					Avatar:            avatar,
					SignupApplication: CasdoorApplication,
				}
				fmt.Println("add user: ", newUser.Name)
				_, err := casdoorsdk.AddUser(&newUser)
				if err != nil {
					panic(err)
				}
			}

			mentioned := false // if @user
			for _, mention := range msg.Mentions {
				if mention.ScreenName == lastMsg.From.Username {
					mentioned = true
					break
				}
			}

			// if @user and lastMsg is not @user, then create topic
			// if duration is more than 4 hour, then create topic

			d := msg.Sent.Sub(lastMsg.Sent)
			dur, err := strconv.Atoi(topicDuration)
			if err != nil {
				panic(err)
			}
			if d > time.Hour*time.Duration(dur) && !mentioned { // if dur > `TopicDuration` and not @user last replied
				tmpStr := []rune(msg.Text)
				if len(tmpStr) > 200 { // limit length
					tmpStr = tmpStr[:200]
				}
				title := string(tmpStr)

				topic := GetTopicExist(title)
				if topic.Id == 0 { // not exist
					// add topic
					topic = Topic{
						Author:          msg.From.Username,
						NodeId:          node.Id,
						NodeName:        node.Name,
						TabId:           node.TabId,
						Title:           title,
						CreatedTime:     util.Time2String(msg.Sent),
						LastReplyTime:   util.Time2String(msg.Sent),
						Tags:            service.Finalword(msg.Text),
						EditorType:      "markdown",
						Content:         msg.Text,
						GitterMessageId: msg.ID,
					}

					_, topicID := AddTopic(&topic)
					topic.Id = topicID
				}

				// deep copy
				data, _ := json.Marshal(currentTopic)
				_ = json.Unmarshal(data, &lastTopic)
				lastTopicMap[room.ID] = lastTopic

				// new currentTopic
				currentTopic = topicGitter{Topic: topic, MemberMsgMap: map[string]int{}}
				currentTopic.Massages = append(currentTopic.Massages, msg)
				currentTopic.MemberMsgMap[msg.From.Username]++
				currentTopicMap[room.ID] = currentTopic
			} else {
				// add reply to lastTopic
				reply := Reply{
					Author:          msg.From.Username,
					TopicId:         currentTopic.Topic.Id,
					CreatedTime:     util.Time2String(msg.Sent),
					Tags:            service.Finalword(msg.Text),
					EditorType:      "markdown",
					Content:         msg.Text,
					GitterMessageId: msg.ID,
				}
				_, _ = AddReply(&reply)

				ChangeTopicReplyCount(reply.TopicId, 1)
				ChangeTopicLastReplyUser(currentTopic.Topic.Id, msg.From.Username, util.Time2String(msg.Sent))

				currentTopic.Massages = append(currentTopic.Massages, msg)
				currentTopic.MemberMsgMap[msg.From.Username]++
				currentTopicMap[room.ID] = currentTopic
			}

			// deep copy
			data, _ := json.Marshal(msg)
			_ = json.Unmarshal(data, &lastMsg)

			// add index to sync message
			if asc {
				roomSyncMsgHeadMap[room.ID] = msg.ID
			} else {
				roomSyncMsgTailMap[room.ID] = messages[0].ID
			}
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

func getGitterAvatarUrl(username string, avatar string) string {
	var fileBytes []byte
	var fileExt string
	var err error
	times := 0
	for {
		fileBytes, _, err = downloadFile(avatar)

		if err != nil {
			times += 1
			fmt.Printf("[%d]: downloadFile() error: %s, times = %d\n", username, err.Error(), times)
			if times >= 10 {
				panic(err)
			}
		} else {
			break
		}
	}

	fileExt = ".png"

	avatarUrl, err := uploadGitterAvatar(username, fileBytes, fileExt)
	if err != nil {
		avatarUrl = ""
	}

	return avatarUrl
}

func uploadGitterAvatar(username string, fileBytes []byte, fileExt string) (string, error) {
	username = url.QueryEscape(username)
	memberId := fmt.Sprintf("%s/%s", CasdoorOrganization, username)
	fileUrl, err := service.UploadFileToStorageSafe(memberId, "avatar", "uploadGitterAvatar", fmt.Sprintf("avatar/%s%s", memberId, fileExt), fileBytes, "", "")
	return fileUrl, err
}

func downloadFile(url string) ([]byte, string, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	bs, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	newUrl := resp.Request.URL.String()
	return bs, newUrl, nil
}
