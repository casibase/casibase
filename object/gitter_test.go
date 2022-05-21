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
	"fmt"
	"testing"

	"github.com/issue9/assert"
	"github.com/sromku/go-gitter"
)

func TestRemoveSyncGitterData(t *testing.T) {
	InitConfig()
	InitAdapter()

	// delete all sync gitter data
	var nodes []Node
	err := adapter.Engine.Find(&nodes)
	if err != nil {
		panic(err)
	}
	for _, node := range nodes {
		if node.GitterRoomURL == "" || node.GitterApiToken == "" {
			continue
		}

		api := gitter.New(node.GitterApiToken)
		rooms, err := api.GetRooms()
		if err != nil {
			panic(err)
		}
		url := node.GitterRoomURL
		room := gitter.Room{}
		for _, v := range rooms { // find RoomId by url
			if "https://gitter.im/"+v.URI == url {
				room = v
				break
			}
		}
		assert.NotEqual(t, room.Name, "")
		adapter.Engine.ShowSQL(true)
		_, err = adapter.Engine.
			Query("DELETE t.*,r.* FROM topic as t LEFT JOIN reply as r ON t.id = r.topic_id WHERE t.gitter_message_id is not null AND t.node_id = ?", node.Id)

		if err != nil {
			panic(err)
		}
		fmt.Printf("INFO: delete sync gitter data of room: %s\n", room.Name)
	}
}
