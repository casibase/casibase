// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package controllers

import (
	"github.com/casibase/casibase/object"
)

func (c *ApiController) generateChatGraphData(id string, graph *object.Graph) error {
	// Get filtered chats
	chats, err := object.GetChats("admin", graph.Store, "")
	if err != nil {
		return err
	}

	// Filter by time range if specified
	filteredChats := object.FilterChatsByTimeRange(chats, graph.StartTime, graph.EndTime)

	// Get messages for those chats
	messages, err := object.GetMessagesForChats(filteredChats)
	if err != nil {
		return err
	}

	// Generate word cloud data
	wordCloudData, err := object.GenerateWordCloudData(messages)
	if err != nil {
		return err
	}

	// Update graph with generated data
	graph.Text = wordCloudData
	_, err = object.UpdateGraph(id, graph)
	if err != nil {
		return err
	}

	return nil
}
