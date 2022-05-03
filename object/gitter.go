package object

import (
	"encoding/json"
	"errors"
	"fmt"
	"runtime"
	"strconv"
	"time"

	"github.com/astaxie/beego"
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

func AutoSyncGitter() {
	if AutoSyncPeriodSecond < 30 {
		return
	}
	for {
		time.Sleep(time.Duration(AutoSyncPeriodSecond) * time.Second)
		SyncGitter()
	}
	//SyncGitter()
}

func SyncGitter() {
	defer func() {
		if err := recover(); err != nil {
			handleErr(err.(error))
		}
	}()

	// Get your own token At https://developer.gitter.im/
	api := gitter.New(beego.AppConfig.String("gitterApiAccessToken"))

	tab := GetTab("gitter")
	if tab == nil {
		tab = &Tab{
			Id:          "gitter",
			Name:        "gitter",
			Sorter:      1,
			CreatedTime: util.GetCurrentTime(),
			HomePage:    false,
		}
		_, err := adapter.Engine.Insert(&tab)
		if err != nil {
			panic(err)
		}
	}

	plane := GetPlane("gitter")
	if plane == nil {
		plane = &Plane{
			Id:          "gitter",
			Name:        "gitter",
			Sorter:      1,
			CreatedTime: util.GetCurrentTime(),
			Visible:     false,
		}
		AddPlane(plane)
	}

	// get room id by room url
	rooms, err := api.GetRooms()
	if err != nil {
		panic(err)
	}
	roomUrls := beego.AppConfig.Strings("gitterRooms")
	fmt.Println("gitter room urls:", roomUrls)

	topicDuration := beego.AppConfig.Strings("gitterRoomsTopicDurationHour")

	for roomIdx, url := range roomUrls {
		room := gitter.Room{}
		for _, v := range rooms { // find RoomId by url
			if "https://gitter.im/"+v.URI == url {
				room = v
				break
			}
		}
		if room.Name == "" {
			panic(errors.New("room is not exist"))
		}

		if GetNode(room.Name) == nil {
			node := Node{
				Id:          room.Name,
				Name:        room.Name,
				CreatedTime: util.GetCurrentTime(),
				Desc:        room.Topic,
				TabId:       tab.Id,
				PlaneId:     "gitter",
				Sorter:      1,
				IsHidden:    true,
			}
			_ = AddNode(&node)
		}
		// Get NodeInfo
		node := GetNode(room.Name)

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

		// initialize value
		var (
			lastMsg      = gitter.Message{}
			lastTopic    = topicGitter{MemberMsgMap: map[string]int{}}
			currentTopic = topicGitter{MemberMsgMap: map[string]int{}}
		)

		topics := node.GetAllTopicsByNode()
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
				duration, err := strconv.Atoi(topicDuration[roomIdx])
				if err != nil {
					panic(err)
				}
				if d > time.Hour*time.Duration(duration) && !mentioned { // if duration > `TopicDuration` and not @user last replied
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
							NodeId:      node.Id,
							NodeName:    node.Name,
							TabId:       node.TabId,
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
