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
	"fmt"

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
	Text        string `xorm:"mediumtext" json:"text"`
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
	owner, name := util.GetOwnerAndNameFromId(id)
	return getGraph(owner, name)
}

func UpdateGraph(id string, graph *Graph) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getGraph(owner, name)
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
