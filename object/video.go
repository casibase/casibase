package object

import (
	"fmt"

	"github.com/casbin/casibase/util"
	"github.com/casbin/casibase/video"
	"xorm.io/core"
)

type Label struct {
	Id        string  `xorm:"varchar(100)" json:"id"`
	StartTime float64 `json:"startTime"`
	EndTime   float64 `json:"endTime"`
	Text      string  `xorm:"varchar(100)" json:"text"`
}

type Video struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(500)" json:"displayName"`

	VideoId    string   `xorm:"varchar(100)" json:"videoId"`
	CoverUrl   string   `xorm:"varchar(200)" json:"coverUrl"`
	Labels     []*Label `xorm:"mediumtext" json:"labels"`
	DataUrls   []string `xorm:"mediumtext" json:"dataUrls"`
	DataUrl    string   `xorm:"varchar(200)" json:"dataUrl"`
	TagOnPause bool     `json:"tagOnPause"`

	PlayAuth string `xorm:"-" json:"playAuth"`
}

func GetGlobalVideos() []*Video {
	videos := []*Video{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&videos)
	if err != nil {
		panic(err)
	}

	return videos
}

func GetVideos(owner string) []*Video {
	videos := []*Video{}
	err := adapter.engine.Desc("created_time").Find(&videos, &Video{Owner: owner})
	if err != nil {
		panic(err)
	}

	return videos
}

func getVideo(owner string, name string) *Video {
	v := Video{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&v)
	if err != nil {
		panic(err)
	}

	if existed {
		if v.VideoId != "" {
			v.PlayAuth = video.GetVideoPlayAuth(v.VideoId)
		}
		return &v
	} else {
		return nil
	}
}

func GetVideo(id string) *Video {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getVideo(owner, name)
}

func UpdateVideo(id string, video *Video) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	if getVideo(owner, name) == nil {
		return false
	}

	_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(video)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddVideo(video *Video) bool {
	affected, err := adapter.engine.Insert(video)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteVideo(video *Video) bool {
	affected, err := adapter.engine.ID(core.PK{video.Owner, video.Name}).Delete(&Video{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func (video *Video) GetId() string {
	return fmt.Sprintf("%s/%s", video.Owner, video.Name)
}

func (video *Video) Populate() {
	store := getStore("admin", "default")
	video.DataUrls = store.GetVideoData()
}
