package object

import (
	"fmt"

	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Graph struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	Organization string   `xorm:"varchar(100)" json:"organization"`
	DisplayName  string   `xorm:"varchar(100)" json:"displayName"`
	Store        string   `xorm:"varchar(100)" json:"store"`
	Chats        []string `xorm:"varchar(500)" json:"chats"`
	Users        []string `xorm:"varchar(500)" json:"users"`
	Description  string   `xorm:"varchar(500)" json:"description"`
	GraphType    string   `xorm:"varchar(50)" json:"graphType"`

	GraphData string `xorm:"mediumtext" json:"graphData"`
	Analysis  string `xorm:"mediumtext" json:"analysis"`
}

type GraphData struct {
	Nodes []GraphNode `json:"nodes"`
	Links []GraphLink `json:"links"`
}

type GraphNode struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Category  int       `json:"category"`
	Value     int       `json:"value"`
	ItemStyle ItemStyle `json:"itemStyle"`
}

type GraphLink struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Value  int    `json:"value"`
}

type ItemStyle struct {
	Color string `json:"color"`
}

type Analysis struct {
	TotalNodes          int               `json:"totalNodes"`
	TotalLinks          int               `json:"totalLinks"`
	UserCount           int               `json:"userCount"`
	TopicCount          int               `json:"topicCount"`
	EntityCount         int               `json:"entityCount"`
	AvgConnections      float64           `json:"avgConnections"`
	MostActiveNodes     []ActiveNode      `json:"mostActiveNodes"`
	TopicWeights        []TopicWeight     `json:"topicWeights"`
	EntityFrequencies   []EntityFrequency `json:"entityFrequencies"`
	Density             float64           `json:"density"`
	GiantComponentRatio float64           `json:"giantComponentRatio"`
}

type ActiveNode struct {
	Name        string `json:"name"`
	Connections int    `json:"connections"`
}

type TopicWeight struct {
	Name   string `json:"name"`
	Weight int    `json:"weight"`
}

type EntityFrequency struct {
	Name      string `json:"name"`
	Frequency int    `json:"frequency"`
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
	err := adapter.engine.Desc("updated_time").Find(&graphs, &Graph{Owner: owner})
	if err != nil {
		return graphs, err
	}

	return graphs, nil
}

func GetGraphCount(owner string, field string, value string, store string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	if store != "" {
		session = session.And("store = ?", store)
	}
	return session.Count(&Graph{})
}

func GetPaginationGraphs(owner string, offset, limit int, field, value, sortField, sortOrder, store string) ([]*Graph, error) {
	graphs := []*Graph{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	if store != "" {
		session = session.And("store = ?", store)
	}
	err := session.Find(&graphs)
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
	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(graph)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
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
