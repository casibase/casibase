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

package object

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type GraphNode struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Value  int    `json:"val"`
	Color  string `json:"color"`
	Tag    string `json:"tag"`
	Weight int    `json:"weight"`
}

type Graph struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Category    string `xorm:"varchar(100)" json:"category"`
	Layout      string `xorm:"varchar(100)" json:"layout"`
	Density     int    `xorm:"int" json:"density"`
	Store       string `xorm:"varchar(100)" json:"store"`
	StartTime   string `xorm:"varchar(100)" json:"startTime"`
	EndTime     string `xorm:"varchar(100)" json:"endTime"`
	Text        string `xorm:"mediumtext" json:"text"`
	ErrorText   string `xorm:"mediumtext" json:"errorText"`
}

func GetMaskedGraph(graph *Graph, isMaskEnabled bool) *Graph {
	if !isMaskEnabled {
		return graph
	}

	if graph == nil {
		return nil
	}

	return graph
}

func GetMaskedGraphs(graphs []*Graph, isMaskEnabled bool) []*Graph {
	if !isMaskEnabled {
		return graphs
	}

	for _, graph := range graphs {
		graph = GetMaskedGraph(graph, isMaskEnabled)
	}
	return graphs
}

func GetGlobalGraphs() ([]*Graph, error) {
	graphs := []*Graph{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&graphs)
	if err != nil {
		return graphs, err
	}

	return graphs, nil
}

func GetGraphs(owner string) ([]*Graph, error) {
	graphs := []*Graph{}
	err := adapter.engine.Desc("created_time").Find(&graphs, &Graph{Owner: owner})
	if err != nil {
		return graphs, err
	}

	return graphs, nil
}

func getGraph(owner string, name string) (*Graph, error) {
	graph := Graph{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&graph)
	if err != nil {
		return &graph, err
	}

	if existed {
		return &graph, nil
	} else {
		return nil, nil
	}
}

func GetGraph(id string) (*Graph, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, err
	}
	return getGraph(owner, name)
}

func UpdateGraph(id string, graph *Graph) (bool, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return false, err
	}
	_, err = getGraph(owner, name)
	if err != nil {
		return false, err
	}
	if graph == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(graph)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddGraph(graph *Graph) (bool, error) {
	affected, err := adapter.engine.Insert(graph)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteGraph(graph *Graph) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{graph.Owner, graph.Name}).Delete(&Graph{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (graph *Graph) GetId() string {
	return fmt.Sprintf("%s/%s", graph.Owner, graph.Name)
}

func GetGraphCount(owner string, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Graph{})
}

func GetPaginationGraphs(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Graph, error) {
	graphs := []*Graph{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&graphs)
	if err != nil {
		return graphs, err
	}

	return graphs, nil
}

func FilterChatsByTimeRange(chats []*Chat, startTime, endTime string) []*Chat {
	if startTime == "" && endTime == "" {
		return chats
	}
	
	filtered := make([]*Chat, 0)
	for _, chat := range chats {
		if startTime != "" && chat.CreatedTime < startTime {
			continue
		}
		if endTime != "" && chat.CreatedTime > endTime {
			continue
		}
		filtered = append(filtered, chat)
	}
	
	return filtered
}

func GetMessagesForChats(chats []*Chat) ([]*Message, error) {
	if len(chats) == 0 {
		return []*Message{}, nil
	}
	
	chatNames := make([]string, 0, len(chats))
	for _, chat := range chats {
		chatNames = append(chatNames, chat.Name)
	}
	
	messages := []*Message{}
	err := adapter.engine.In("chat", chatNames).Asc("created_time").Find(&messages)
	if err != nil {
		return nil, err
	}
	
	return messages, nil
}

func GenerateWordCloudData(messages []*Message) (string, error) {
	wordFreq := make(map[string]int)
	
	// Regular expression to extract words (including Chinese characters)
	wordRegex := regexp.MustCompile(`[\p{L}\p{N}]+`)
	
	for _, message := range messages {
		// Extract words from message text
		text := strings.ToLower(message.Text)
		words := wordRegex.FindAllString(text, -1)
		
		for _, word := range words {
			// Filter out stop words (both English and Chinese) and short words
			if len(word) > 2 && !stopWords[word] && !stopWordsZh[word] {
				// Check if word contains any letter (to avoid pure numbers)
				hasLetter := false
				for _, r := range word {
					if unicode.IsLetter(r) {
						hasLetter = true
						break
					}
				}
				if hasLetter {
					wordFreq[word]++
				}
			}
		}
	}
	
	// Convert to format expected by word cloud: array of {name, value}
	type WordData struct {
		Name  string `json:"name"`
		Value int    `json:"value"`
	}
	
	wordList := make([]WordData, 0, len(wordFreq))
	for word, count := range wordFreq {
		wordList = append(wordList, WordData{Name: word, Value: count})
	}
	
	// Convert to JSON
	jsonData, err := json.Marshal(wordList)
	if err != nil {
		return "", err
	}
	
	return string(jsonData), nil
}
