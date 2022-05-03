package object

import (
	"testing"

	"github.com/astaxie/beego"
	"github.com/issue9/assert"
	"github.com/sromku/go-gitter"
)

func TestRemoveSyncGitterData(t *testing.T) {
	InitConfig()
	InitAdapter()

	// delete all sync gitter data
	api := gitter.New(beego.AppConfig.String("gitterApiAccessToken"))
	rooms, err := api.GetRooms()
	roomUrls := beego.AppConfig.Strings("gitterRooms")

	for _, url := range roomUrls {
		room := gitter.Room{}
		if err != nil {
			panic(err)
		}
		for _, v := range rooms { // find RoomId by url
			if "https://gitter.im/"+v.URI == url {
				room = v
				break
			}
		}
		assert.NotEqual(t, room.Name, "")

		node := GetNode(room.Name)
		if node == nil {
			continue
		}
		node.DeleteAllTopicsHard()
	}
}
