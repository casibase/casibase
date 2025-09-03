package object

import (
	"fmt"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type KnowledgeGraph struct {
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
	Nodes []KnowledgeGraphNode `json:"nodes"`
	Links []KnowledgeGraphLink `json:"links"`
}

type KnowledgeGraphNode struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Category  int       `json:"category"`
	Value     int       `json:"value"`
	ItemStyle ItemStyle `json:"itemStyle"`
}

type KnowledgeGraphLink struct {
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

func GetGlobalKnowledgeGraphs() ([]*KnowledgeGraph, error) {
	knowledgeGraphs := []*KnowledgeGraph{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&knowledgeGraphs)
	if err != nil {
		return knowledgeGraphs, err
	}

	return knowledgeGraphs, nil
}

func GetKnowledgeGraphs(owner string) ([]*KnowledgeGraph, error) {
	knowledgeGraphs := []*KnowledgeGraph{}
	err := adapter.engine.Desc("updated_time").Find(&knowledgeGraphs, &KnowledgeGraph{Owner: owner})
	if err != nil {
		return knowledgeGraphs, err
	}

	return knowledgeGraphs, nil
}

func GetKnowledgeGraphCount(owner string, field string, value string, store string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	if store != "" {
		session = session.And("store = ?", store)
	}
	return session.Count(&KnowledgeGraph{})
}

func GetPaginationKnowledgeGraphs(owner string, offset, limit int, field, value, sortField, sortOrder, store string) ([]*KnowledgeGraph, error) {
	knowledgeGraphs := []*KnowledgeGraph{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	if store != "" {
		session = session.And("store = ?", store)
	}
	err := session.Find(&knowledgeGraphs)
	if err != nil {
		return knowledgeGraphs, err
	}

	return knowledgeGraphs, nil
}

func getKnowledgeGraph(owner string, name string) (*KnowledgeGraph, error) {
	knowledgeGraph := KnowledgeGraph{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&knowledgeGraph)
	if err != nil {
		return &knowledgeGraph, err
	}

	if existed {
		return &knowledgeGraph, nil
	} else {
		return nil, nil
	}
}

func GetKnowledgeGraph(id string) (*KnowledgeGraph, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getKnowledgeGraph(owner, name)
}

func UpdateKnowledgeGraph(id string, knowledgeGraph *KnowledgeGraph) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(knowledgeGraph)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddKnowledgeGraph(knowledgeGraph *KnowledgeGraph) (bool, error) {
	affected, err := adapter.engine.Insert(knowledgeGraph)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteKnowledgeGraph(knowledgeGraph *KnowledgeGraph) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{knowledgeGraph.Owner, knowledgeGraph.Name}).Delete(&KnowledgeGraph{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (knowledgeGraph *KnowledgeGraph) GetId() string {
	return fmt.Sprintf("%s/%s", knowledgeGraph.Owner, knowledgeGraph.Name)
}
