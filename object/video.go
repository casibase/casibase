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
	"fmt"
	"strings"
	"time"

	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/video"
	"xorm.io/core"
)

type Label struct {
	Id        string  `xorm:"varchar(100)" json:"id"`
	User      string  `xorm:"varchar(100)" json:"user"`
	Type      string  `xorm:"varchar(100)" json:"type"`
	StartTime float64 `json:"startTime"`
	EndTime   float64 `json:"endTime"`
	Text      string  `xorm:"varchar(100)" json:"text"`
	Speaker   string  `xorm:"varchar(100)" json:"speaker"`
	Tag1      string  `xorm:"varchar(100)" json:"tag1"`
	Tag2      string  `xorm:"varchar(100)" json:"tag2"`
	Tag3      string  `xorm:"varchar(100)" json:"tag3"`
}

type Remark struct {
	Timestamp string `xorm:"varchar(100)" json:"timestamp"`
	User      string `xorm:"varchar(100)" json:"user"`
	Score     string `xorm:"varchar(100)" json:"score"`
	Text      string `xorm:"varchar(100)" json:"text"`
	IsPublic  bool   `json:"isPublic"`
}

type Video struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(500)" json:"displayName"`

	Description    string         `xorm:"mediumtext" json:"description"`
	Tag            string         `xorm:"varchar(100)" json:"tag"`
	Type           string         `xorm:"varchar(100)" json:"type"`
	VideoId        string         `xorm:"varchar(100)" json:"videoId"`
	VideoLength    string         `xorm:"varchar(100)" json:"videoLength"`
	CoverUrl       string         `xorm:"varchar(200)" json:"coverUrl"`
	AudioUrl       string         `xorm:"varchar(200)" json:"audioUrl"`
	EditMode       string         `xorm:"varchar(100)" json:"editMode"`
	Labels         []*Label       `xorm:"mediumtext" json:"labels"`
	Segments       []*Label       `xorm:"mediumtext" json:"segments"`
	LabelCount     int            `xorm:"-" json:"labelCount"`
	SegmentCount   int            `xorm:"-" json:"segmentCount"`
	WordCountMap   map[string]int `xorm:"mediumtext" json:"wordCountMap"`
	DataUrls       []string       `xorm:"mediumtext" json:"dataUrls"`
	DataUrl        string         `xorm:"varchar(200)" json:"dataUrl"`
	TagOnPause     bool           `json:"tagOnPause"`
	Remarks        []*Remark      `xorm:"mediumtext" json:"remarks"`
	Remarks2       []*Remark      `xorm:"mediumtext" json:"remarks2"`
	ExcellentCount int            `json:"excellentCount"`
	State          string         `xorm:"varchar(100)" json:"state"`
	ReviewState    string         `xorm:"varchar(100)" json:"reviewState"`
	IsPublic       bool           `json:"isPublic"`

	School   string   `xorm:"varchar(100)" json:"school"`
	Stage    string   `xorm:"varchar(100)" json:"stage"`
	Grade    string   `xorm:"varchar(100)" json:"grade"`
	Unit     string   `xorm:"varchar(100)" json:"unit"`
	Lesson   string   `xorm:"varchar(100)" json:"lesson"`
	Class    string   `xorm:"varchar(100)" json:"class"`
	Subject  string   `xorm:"varchar(100)" json:"subject"`
	Topic    string   `xorm:"varchar(100)" json:"topic"`
	Grade2   string   `xorm:"varchar(100)" json:"grade2"`
	Keywords []string `xorm:"varchar(200)" json:"keywords"`
	Template string   `xorm:"varchar(200)" json:"template"`

	Task1 string `xorm:"varchar(100)" json:"task1"`
	Task2 string `xorm:"varchar(100)" json:"task2"`
	Task3 string `xorm:"varchar(100)" json:"task3"`

	PlayAuth string `xorm:"-" json:"playAuth"`
}

func GetGlobalVideos() ([]*Video, error) {
	videos := []*Video{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&videos)
	if err != nil {
		return videos, err
	}

	return videos, nil
}

func GetVideos(owner string) ([]*Video, error) {
	videos := []*Video{}
	err := adapter.engine.Desc("created_time").Find(&videos, &Video{Owner: owner})
	if err != nil {
		return videos, err
	}

	for _, v := range videos {
		err = v.refineVideoAndCoverUrl()
		if err != nil {
			return videos, err
		}
	}

	return videos, nil
}

func getVideo(owner string, name string) (*Video, error) {
	v := Video{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&v)
	if err != nil {
		return &v, err
	}

	if existed {
		if v.VideoId != "" {
			err = SetDefaultVodClient()
			if err != nil {
				return nil, err
			}

			maxRetries := 30
			for i := 0; i < maxRetries; i++ {
				v.PlayAuth, err = video.GetVideoPlayAuth(v.VideoId)
				if err == nil {
					return &v, nil
				}

				if !strings.Contains(err.Error(), "and AuditStatus is Init.") {
					return nil, err
				}

				fmt.Printf("GetVideoPlayAuth() error, video: %s, try time: %d, error: %v\n", name, i, err)
				time.Sleep(2 * time.Second)
			}

			return nil, err
		}
		return &v, nil
	} else {
		return nil, nil
	}
}

func GetVideo(id string) (*Video, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getVideo(owner, name)
}

func UpdateVideo(id string, video *Video) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getVideo(owner, name)
	if err != nil {
		return false, err
	}
	if video == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(video)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddVideo(video *Video) (bool, error) {
	affected, err := adapter.engine.Insert(video)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteVideo(video *Video) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{video.Owner, video.Name}).Delete(&Video{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (video *Video) GetId() string {
	return fmt.Sprintf("%s/%s", video.Owner, video.Name)
}

func (video *Video) Populate() error {
	// store, err := GetDefaultStore("admin")
	// if err != nil {
	//	return err
	// }
	// if store == nil {
	//	return nil
	// }
	//
	// dataUrls, err := store.GetVideoData()
	// if err != nil {
	//	return err
	// }
	// video.DataUrls = dataUrls

	err := video.PopulateWordCountMap()
	if err != nil {
		return err
	}

	if video.EditMode == "" {
		if len(video.Segments) == 0 {
			video.EditMode = "Labeling"
		} else {
			video.EditMode = "Text Recognition"
		}
	}

	return nil
}

func (v *Video) refineVideoAndCoverUrl() error {
	excellentCount := 0
	for _, remark := range v.Remarks {
		if remark.Score == "Excellent" {
			excellentCount++
		}
	}
	v.ExcellentCount = excellentCount

	if v.VideoId == "" || v.CoverUrl != "" {
		return nil
	}

	err := SetDefaultVodClient()
	if err != nil {
		return err
	}

	coverUrl := video.GetVideoCoverUrl(v.VideoId)
	v.CoverUrl = coverUrl

	_, err = UpdateVideo(v.GetId(), v)
	if err != nil {
		return err
	}

	return nil
}

func GetVideoCount(owner string, field string, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Video{})
}

func GetPaginationVideos(owner string, offset int, limit int, field string, value string, sortField string, sortOrder string) ([]*Video, error) {
	videos := []*Video{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&videos)
	if err != nil {
		return videos, err
	}

	for _, v := range videos {
		err = v.refineVideoAndCoverUrl()
		if err != nil {
			return videos, err
		}
	}

	return videos, nil
}
