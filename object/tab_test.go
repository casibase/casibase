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

package object

import (
	"fmt"
	"testing"
)

func TestSyncTabsForTopics(t *testing.T) {
	InitConfig()
	InitAdapter()

	nodes := GetNodes()
	nodeTabMap := map[string]string{}
	for _, node := range nodes {
		nodeTabMap[node.Id] = node.TabId
	}

	topics := GetAllTopics()
	for i, topic := range topics {
		tabId := nodeTabMap[topic.NodeId]
		topic.TabId = tabId
		affected := updateTopicSimple(topic.Id, topic)
		if affected == false {
			panic(fmt.Errorf("TestSyncTabsForTopics() error, affected == false"))
		}
		fmt.Printf("[%d/%d]: Synced tab for topic: [%d, %s] as tab: %s\n", i+1, len(topics), topic.Id, topic.Author, topic.TabId)
	}
}
