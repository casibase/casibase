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
	"regexp"
	"sync"

	"github.com/casbin/casbin-forum/service"
	"github.com/casbin/casbin-forum/util"
)

// NotificationType 1-6 means: reply(topic), mentioned(reply), mentioned(topic), favorite(topic), thanks(topic), thanks(reply)
// Status 1-3 means: unread, have read, deleted
type Notification struct {
	Id               int    `xorm:"int notnull pk autoincr" json:"id"`
	NotificationType int    `xorm:"int" json:"notificationType"`
	ObjectId         int    `xorm:"int" json:"objectId"`
	CreatedTime      string `xorm:"varchar(40)" json:"createdTime"`
	SenderId         string `xorm:"varchar(100)" json:"senderId"`
	ReceiverId       string `xorm:"varchar(100)" json:"receiverId"`
	Status           int    `xorm:"tinyint" json:"-"`
	//Deleted        bool   `xorm:"bool" json:"-"`
}

func AddNotification(notification *Notification) bool {
	affected, err := adapter.engine.Insert(notification)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteNotification(id string) bool {
	notification := new(Notification)
	notification.Status = 3
	affected, err := adapter.engine.Id(id).Update(notification)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetNotificationCount() int {
	count, err := adapter.engine.Count(&Notification{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetNotifications(memberId string, limit int, offset int) []*NotificationResponse {
	notifications := []*Notification{}
	err := adapter.engine.Desc("created_time").Where("receiver_id = ?", memberId).And("status != ?", 3).Limit(limit, offset).Find(&notifications, &Notification{ReceiverId: memberId})
	if err != nil {
		panic(err)
	}

	var wg sync.WaitGroup
	errChan := make(chan error, 10)
	res := make([]*NotificationResponse, len(notifications))
	for k, v := range notifications {
		wg.Add(1)
		v := v
		k := k
		go func() {
			defer wg.Done()
			tempNotification := NotificationResponse{
				Notification: v,
				Avatar:       GetMemberAvatar(v.SenderId),
			}
			switch v.NotificationType {
			case 1:
				replyInfo := GetReply(v.ObjectId)
				tempNotification.Title = GetReplyTopicTitle(replyInfo.TopicId)
				tempNotification.Content = replyInfo.Content
				tempNotification.ObjectId = replyInfo.TopicId
			case 2:
				replyInfo := GetReply(v.ObjectId)
				tempNotification.Title = GetReplyTopicTitle(replyInfo.TopicId)
				tempNotification.Content = replyInfo.Content
				tempNotification.ObjectId = replyInfo.TopicId
			case 3:
				tempNotification.Title = GetTopicTitle(v.ObjectId)
			case 4:
				tempNotification.Title = GetTopicTitle(v.ObjectId)
			case 5:
				tempNotification.Title = GetTopicTitle(v.ObjectId)
			case 6:
				replyInfo := GetReply(v.ObjectId)
				tempNotification.Title = GetReplyTopicTitle(replyInfo.TopicId)
				tempNotification.Content = replyInfo.Content
			}
			res[k] = &tempNotification
		}()
	}
	wg.Wait()
	close(errChan)
	if len(errChan) != 0 {
		for v := range errChan {
			panic(v)
		}
	}

	return res
}

func GetNotificationNum(memberId string) int {
	var total int64
	var err error

	notification := new(Notification)
	total, err = adapter.engine.Where("receiver_id = ?", memberId).And("status != ?", 3).Count(notification)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetUnreadNotificationNum(memberId string) int {
	var total int64
	var err error

	notification := new(Notification)
	total, err = adapter.engine.Where("receiver_id = ?", memberId).And("status = ?", 1).Count(notification)
	if err != nil {
		panic(err)
	}

	return int(total)
}

/*
func GetNotificationId() int {
	num := GetNotificationCount()

	res := num + 1

	return res
}
*/

func UpdateReadStatus(id string) bool {
	notification := new(Notification)
	notification.Status = 2
	affected, err := adapter.engine.Where("receiver_id = ?", id).Cols("status").Update(notification)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddReplyNotification(senderId, content string, objectId, topicId int) {
	memberMap := make(map[string]bool)

	receiverId := GetTopicAuthor(topicId)
	memberMap[receiverId] = true

	reg := regexp.MustCompile("@(.*?)[ \n\t]")
	reg2 := regexp.MustCompile("@([^ \n\t]*?)[^ \n\t]$")
	regResult := reg.FindAllStringSubmatch(content, -1)
	regResult2 := reg2.FindAllStringSubmatch(content, -1)

	for _, v := range regResult {
		if senderId != v[1] && !memberMap[v[1]] {
			memberMap[v[1]] = true
		}
	}

	for _, v := range regResult2 {
		v[1] += content[len(content)-1:]
		if senderId != v[1] && !memberMap[v[1]] {
			memberMap[v[1]] = true
		}
	}

	var wg sync.WaitGroup

	if senderId != receiverId {
		notification := Notification{
			//Id:               memberMap[receiverId],
			NotificationType: 1,
			ObjectId:         objectId,
			CreatedTime:      util.GetCurrentTime(),
			SenderId:         senderId,
			ReceiverId:       receiverId,
			Status:           1,
		}
		_ = AddNotification(&notification)
		// send remind email
		email := GetMemberMail(receiverId)
		reminder := GetMemberEmailReminder(receiverId)
		if email != "" && reminder {
			topicIdStr := util.IntToString(topicId)
			err := service.SendRemindMail(GetTopicTitle(topicId), content, topicIdStr, email, Domain)
			if err != nil {
				panic(err)
			}
		}
	}

	delete(memberMap, receiverId)
	for k, _ := range memberMap {
		wg.Add(1)
		k := k
		go func() {
			defer wg.Done()
			notification := Notification{
				NotificationType: 2,
				ObjectId:         objectId,
				CreatedTime:      util.GetCurrentTime(),
				SenderId:         senderId,
				ReceiverId:       k,
				Status:           1,
			}
			_ = AddNotification(&notification)
			// send remind email
			email := GetMemberMail(receiverId)
			reminder := GetMemberEmailReminder(receiverId)
			if email != "" && reminder {
				topicIdStr := util.IntToString(topicId)
				err := service.SendRemindMail(GetTopicTitle(topicId), content, topicIdStr, email, Domain)
				if err != nil {
					panic(err)
				}
			}
		}()
	}
	wg.Wait()
}

func AddTopicNotification(objectId int, author, content string) {
	var wg sync.WaitGroup
	memberMap := make(map[string]bool)
	reg := regexp.MustCompile("@(.*?)[ \n\t]")
	reg2 := regexp.MustCompile("@([^ \n\t]*?)[^ \n\t]$")
	regResult := reg.FindAllStringSubmatch(content, -1)
	regResult2 := reg2.FindAllStringSubmatch(content, -1)

	for _, v := range regResult {
		if author != v[1] && !memberMap[v[1]] {
			memberMap[v[1]] = true
		}
	}

	for _, v := range regResult2 {
		v[1] += content[len(content)-1:]
		if author != v[1] && !memberMap[v[1]] {
			memberMap[v[1]] = true
		}
	}

	for k, _ := range memberMap {
		wg.Add(1)
		k := k
		go func() {
			defer wg.Done()
			notification := Notification{
				NotificationType: 3,
				ObjectId:         objectId,
				CreatedTime:      util.GetCurrentTime(),
				SenderId:         author,
				ReceiverId:       k,
				Status:           1,
			}
			_ = AddNotification(&notification)
			// send remind email
			email := GetMemberMail(k)
			reminder := GetMemberEmailReminder(k)
			if email != "" && reminder {
				topicIdStr := util.IntToString(objectId)
				err := service.SendRemindMail(GetTopicTitle(objectId), content, topicIdStr, email, Domain)
				if err != nil {
					panic(err)
				}
			}
		}()
	}
	wg.Wait()
}
