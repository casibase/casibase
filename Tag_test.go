// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package main

import (
	"testing"

	"github.com/astaxie/beego"
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
)

var adapter *object.Adapter

func TestTopicTag(t *testing.T) {
	topics := []*object.Topic{}
	adapter = object.NewAdapter(beego.AppConfig.String("driverName"), beego.AppConfig.String("dataSourceName"), beego.AppConfig.String("dbName"))
	err := adapter.Engine.Table("topic").Find(&topics)
	if err != nil {
		panic(err)
	}

	for _, topic := range topics {
		if len(topic.Tags) == 0 || topic.Tags == nil {
			topic.Tags = service.Finalword(topic.Content)
			_, err := adapter.Engine.Id(topic.Id).Update(topic)
			if err != nil {
				panic(err)
			}
		}
	}
}
