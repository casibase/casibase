// Copyright 2022 The casbin Authors. All Rights Reserved.
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
