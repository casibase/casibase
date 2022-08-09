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
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"

	"github.com/casbin/casnode/util"
)

type BasicInfo struct {
	Id    string `xorm:"varchar(100) notnull pk"`
	Value string `xorm:"mediumtext"`
}

var (
	fileDate, version                 string
	onlineMemberNum, highestOnlineNum int
)

func InitForumBasicInfo() {
	GetForumVersion()
	GetHighestOnlineNum()
	UpdateOnlineMemberNum()
	if AutoSyncPeriodSecond >= 30 {
		fmt.Println("Auto sync from google group enabled.")
		go AutoSyncGoogleGroup()
		fmt.Println("Auto sync from gitter room enabled.")
		go AutoSyncGitter()
	} else {
		fmt.Println("Auto sync from google group disabled.")
		fmt.Println("Auto sync from gitter room disabled.")
	}
}

func GetForumVersion() string {
	pwd, _ := os.Getwd()

	fileInfos, err := ioutil.ReadDir(pwd + "/.git/refs/heads")
	for _, v := range fileInfos {
		if v.Name() == "master" {
			if v.ModTime().String() == fileDate {
				return version
			} else {
				fileDate = v.ModTime().String()
				break
			}
		}
	}

	content, err := ioutil.ReadFile(pwd + "/.git/refs/heads/master")
	if err != nil {
		return ""
	}

	// Convert to full length
	temp := string(content)
	version = strings.ReplaceAll(temp, "\n", "")

	return version
}

func GetHighestOnlineNum() int {
	if highestOnlineNum != 0 {
		return highestOnlineNum
	}

	info := BasicInfo{Id: "HighestOnlineNum"}
	existed, err := adapter.Engine.Get(&info)
	if err != nil {
		panic(err)
	}

	if existed {
		highestOnlineNum = util.ParseInt(info.Value)
		return highestOnlineNum
	} else {
		info := BasicInfo{
			Id:    "HighestOnlineNum",
			Value: "0",
		}

		_, err := adapter.Engine.Insert(&info)
		if err != nil {
			panic(err)
		}

		return 0
	}
}

func UpdateHighestOnlineNum(num int) bool {
	highestOnlineNum = num
	info := new(BasicInfo)
	info.Value = util.IntToString(num)
	affected, err := adapter.Engine.Where("id = ?", "HighestOnlineNum").Cols("value").Update(info)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetCronJobs() []*CronJob {
	info := BasicInfo{Id: "CronJobs"}
	existed, err := adapter.Engine.Get(&info)
	if err != nil {
		panic(err)
	}

	if existed {
		var jobs []*CronJob
		err := json.Unmarshal([]byte(info.Value), &jobs)
		if err != nil {
			panic(err)
		}
		return jobs
	} else {
		jobs, err := json.Marshal(DefaultCronJobs)
		if err != nil {
			panic(err)
		}
		info := BasicInfo{
			Id:    "CronJobs",
			Value: string(jobs),
		}

		_, err = adapter.Engine.Insert(&info)
		if err != nil {
			panic(err)
		}

		return DefaultCronJobs
	}
}

func GetCronUpdateJobs() []*UpdateJob {
	info := BasicInfo{Id: "CronUpdateJobs"}
	existed, err := adapter.Engine.Get(&info)
	if err != nil {
		panic(err)
	}

	if existed {
		var posts []*UpdateJob
		err := json.Unmarshal([]byte(info.Value), &posts)
		if err != nil {
			panic(err)
		}
		return posts
	} else {
		posts, err := json.Marshal(DefaultCronUpdates)
		if err != nil {
			panic(err)
		}
		info := BasicInfo{
			Id:    "CronUpdateJobs",
			Value: string(posts),
		}

		_, err = adapter.Engine.Insert(&info)
		if err != nil {
			panic(err)
		}

		return DefaultCronUpdates
	}
}

func GetLatestSyncedRecordId() int {
	info := BasicInfo{Id: "LatestSyncedRecordId"}
	existed, err := adapter.Engine.Get(&info)
	if err != nil {
		panic(err)
	}

	if existed {
		return util.ParseInt(info.Value)
	} else {
		info := BasicInfo{
			Id:    "LatestSyncedRecordId",
			Value: "0",
		}

		_, err := adapter.Engine.Insert(&info)
		if err != nil {
			panic(err)
		}

		return 0
	}
}

func UpdateLatestSyncedRecordId(id int) bool {
	info := new(BasicInfo)
	info.Value = util.IntToString(id)
	affected, err := adapter.Engine.Where("id = ?", "LatestSyncedRecordId").Cols("value").Update(info)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// GetOnlineMemberNum returns online member num.
func GetOnlineMemberNum() int {
	if onlineMemberNum == 0 {
		UpdateOnlineMemberNum()
		return onlineMemberNum
	}
	if onlineMemberNum > highestOnlineNum {
		UpdateHighestOnlineNum(onlineMemberNum)
	}
	return onlineMemberNum
}

// UpdateOnlineMemberNum updates online member num and updates highest online member num at the same time.
func UpdateOnlineMemberNum() {
	onlineMemberNum = GetOnlineUserCount()
	if onlineMemberNum > highestOnlineNum {
		UpdateHighestOnlineNum(onlineMemberNum)
	}
}

var recognizeHtmlTags *regexp.Regexp

func RemoveHtmlTags(text string) string {
	if recognizeHtmlTags == nil {
		recognizeHtmlTags = regexp.MustCompile("<[^>]+>")
	}
	return recognizeHtmlTags.ReplaceAllString(text, "")
}
