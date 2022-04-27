package object

import (
	"encoding/json"
	"fmt"
	"github.com/casdoor/casdoor-go-sdk/auth"
	"github.com/issue9/assert"
	"github.com/sromku/go-gitter"
	"testing"
	"time"
)

// TODO: room数量url和token的配置，时间间隔的设计
// 分片时间：从上几个topic中进行抽样。
// 分片逻辑：1、人员 2、回复时间间隔 3、新来的 4、是否有@
// 留存同步位置，留存同步时间、留存上几次的topic
const (
	// Get your own token At https://developer.gitter.im/
	GitterToken   = "b5850c2a084bb7c2e564d1252ff1e3e9b64aada7"
	RoomURL       = "https://gitter.im/casbin/casnode"
	TopicDuration = time.Hour * 24
)

type topicGitter struct {
	Topic        Topic
	Massages     []gitter.Message
	MemberMsgMap map[string]int
}

var roomSyncMsgMap = map[string]int{}

func TestGitter(t *testing.T) {
	InitConfig()
	InitAdapter()

	api := gitter.New(GitterToken)

	// get room id by room url
	id, err := api.GetRoomId(RoomURL)
	if err != nil {
		t.Error(err)
	}

	room, err := api.GetRoom(id)
	fmt.Println("room.Name: ", room.Name)
	if err != nil {
		t.Error(err)
	}
	if GetNode(room.Name) != nil {
		node := Node{Desc: room.Topic}
		res := UpdateNode(room.Name, &node)
		assert.Equal(t, res, true)
	} else {
		// TODO: node字段
		node := Node{
			Id:                room.Name,
			Name:              room.Name,
			CreatedTime:       time.Now().String(),
			Desc:              room.Topic,
			Extra:             "",
			Image:             "",
			BackgroundImage:   "",
			HeaderImage:       "",
			BackgroundColor:   "",
			BackgroundRepeat:  "",
			TabId:             "",
			ParentNode:        "",
			PlaneId:           "",
			Sorter:            0,
			Ranking:           0,
			Hot:               0,
			Moderators:        nil,
			MailingList:       "",
			GoogleGroupCookie: "",
			IsHidden:          false,
		}
		res := AddNode(&node)
		assert.Equal(t, res, true)
	}
	// Get NodeInfo
	node := GetNode(room.Name)

	messages, err := api.GetMessages(room.ID, nil)
	if err != nil {
		t.Error(err)
	}
	// get sync index
	idx, ok := roomSyncMsgMap[room.ID]
	if !ok {
		fmt.Printf("sync msg for room(msgNum:%d): %s", len(messages), room.Name)
	}

	var (
		lastMsg      = gitter.Message{}
		lastTopic    = topicGitter{}
		currentTopic = topicGitter{}
	)

	for i, msg := range messages[idx:] {
		// add index to sync message
		roomSyncMsgMap[room.ID] = i
		// create if user is not exist
		user, err := auth.GetUser(msg.From.DisplayName)
		assert.NotError(t, err)
		if user == nil { // add user
			// TODO: user字段
			newUser := auth.User{
				Owner:             "",
				Name:              msg.From.Username,
				CreatedTime:       "",
				UpdatedTime:       "",
				Id:                "",
				Type:              "",
				Password:          "",
				PasswordSalt:      "",
				DisplayName:       msg.From.DisplayName,
				Avatar:            msg.From.AvatarURLMedium,
				PermanentAvatar:   "",
				Email:             "",
				Phone:             "",
				Location:          "",
				Address:           nil,
				Affiliation:       "",
				Title:             "",
				IdCardType:        "",
				IdCard:            "",
				Homepage:          "",
				Bio:               "",
				Tag:               "",
				Region:            "",
				Language:          "",
				Gender:            "",
				Birthday:          "",
				Education:         "",
				Score:             0,
				Karma:             0,
				Ranking:           0,
				IsDefaultAvatar:   false,
				IsOnline:          false,
				IsAdmin:           false,
				IsGlobalAdmin:     false,
				IsForbidden:       false,
				IsDeleted:         false,
				SignupApplication: "",
				Hash:              "",
				PreHash:           "",
				CreatedIp:         "",
				LastSigninTime:    "",
				LastSigninIp:      "",
				Github:            "",
				Google:            "",
				QQ:                "",
				WeChat:            "",
				Facebook:          "",
				DingTalk:          "",
				Weibo:             "",
				Gitee:             "",
				LinkedIn:          "",
				Wecom:             "",
				Lark:              "",
				Gitlab:            "",
				Ldap:              "",
				Properties:        nil,
			}
			res, err := auth.AddUser(&newUser)
			assert.NotError(t, err)
			assert.Equal(t, res, true)
		}

		if i != 0 { // TODO: 是否需要判0
			var mentioned = false // if @user
			for _, mention := range msg.Mentions {
				if mention.ScreenName == lastMsg.From.Username {
					mentioned = true
					break
				}
			}

			d := msg.Sent.Sub(lastMsg.Sent)
			if d > TopicDuration && !mentioned { // if duration > `TopicDuration` and not @user last replied
				author := msg.From.Username
				title := msg.Text
				msgTime := msg.Sent

				topic := Topic{
					Id:              0,
					Author:          author,
					NodeId:          node.Id,
					NodeName:        node.Name,
					TabId:           node.TabId,
					Title:           title,
					CreatedTime:     msgTime.String(),
					Tags:            nil,
					ReplyCount:      0,
					UpCount:         0,
					DownCount:       0,
					HitCount:        0,
					Hot:             0,
					FavoriteCount:   0,
					SubscribeCount:  0,
					HomePageTopTime: "",
					TabTopTime:      "",
					NodeTopTime:     "",
					LastReplyUser:   "",
					LastReplyTime:   "",
					Deleted:         false,
					EditorType:      "",
					Content:         "",
					UrlPath:         "",
					IsHidden:        false,
					Ip:              "",
					State:           "",
				}

				res, topicID := AddTopic(&topic)
				assert.Equal(t, res, true)
				topic.Id = topicID

				// deep copy
				data, _ := json.Marshal(currentTopic)
				_ = json.Unmarshal(data, &lastTopic)

				currentTopic = topicGitter{Topic: topic}
				currentTopic.Massages = append(lastTopic.Massages, msg)
				currentTopic.MemberMsgMap[author]++
			} else {
				// add reply to lastTopic
				reply := Reply{
					Author:      msg.From.DisplayName,
					TopicId:     lastTopic.Topic.Id,
					ParentId:    0,
					CreatedTime: msg.Sent.String(),
					Deleted:     false,
					IsHidden:    false,
					ThanksNum:   0,
					EditorType:  "",
					Content:     msg.Text,
					Ip:          "",
					State:       "",
				}
				res, replyID := AddReply(&reply)
				fmt.Println("replyID: ", replyID)
				assert.Equal(t, res, true)
				//TODO: 对topic做相应的更改

				currentTopic.Massages = append(lastTopic.Massages, msg)
				currentTopic.MemberMsgMap[msg.From.Username]++
			}

			// deep copy
			data, _ := json.Marshal(msg)
			_ = json.Unmarshal(data, &lastMsg)

		} else { // 直接添加topic
			author := msg.From.Username
			title := msg.Text
			msgTime := msg.Sent
			mentions := msg.Mentions
			var mentionUsers []string
			for _, mention := range mentions {
				mentionUsers = append(mentionUsers, mention.ScreenName)
			}

			// TODO: topic字段
			topic := Topic{
				Id:              0,
				Author:          author, // TODO: 用户不存在时创建用户
				NodeId:          node.Id,
				NodeName:        node.Name,
				TabId:           node.TabId,
				Title:           title,
				CreatedTime:     msgTime.String(),
				Tags:            nil,
				ReplyCount:      0,
				UpCount:         0,
				DownCount:       0,
				HitCount:        0,
				Hot:             0,
				FavoriteCount:   0,
				SubscribeCount:  0,
				HomePageTopTime: "",
				TabTopTime:      "",
				NodeTopTime:     "",
				LastReplyUser:   "",
				LastReplyTime:   "",
				Deleted:         false,
				EditorType:      "",
				Content:         "",
				UrlPath:         "",
				IsHidden:        false,
				Ip:              "",
				State:           "",
			}
			res, topicID := AddTopic(&topic)
			assert.Equal(t, res, true)
			topic.Id = topicID

			currentTopic = topicGitter{Topic: topic}
			currentTopic.Massages = append(lastTopic.Massages, msg)
			currentTopic.MemberMsgMap[msg.From.Username]++
		}

		// TODO: 添加topic后，判断上一个topic的发言频率前五的人员与本次的重合率，大于一半表示同一个topic
	}
}
