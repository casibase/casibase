// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

type Service struct {
	No             int    `json:"no"`
	Name           string `json:"name"`
	Path           string `json:"path"`
	Port           int    `json:"port"`
	ProcessId      int    `json:"processId"`
	ExpectedStatus string `json:"expectedStatus"`
	Status         string `json:"status"`
	SubStatus      string `json:"subStatus"`
	Message        string `json:"message"`
}

type Patch struct {
	Name           string `json:"name"`
	Category       string `json:"category"`
	Title          string `json:"title"`
	Url            string `json:"url"`
	Size           string `json:"size"`
	ExpectedStatus string `json:"expectedStatus"`
	Status         string `json:"status"`
	InstallTime    string `json:"installTime"`
	Message        string `json:"message"`
}

type RemoteApp struct {
	No            int    `json:"no"`
	RemoteAppName string `xorm:"varchar(100)" json:"remoteAppName"`
	RemoteAppDir  string `xorm:"varchar(100)" json:"remoteAppDir"`
	RemoteAppArgs string `xorm:"varchar(100)" json:"remoteAppArgs"`
}

type Node struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"mediumtext" json:"description"`

	Category string `xorm:"varchar(100)" json:"category"`
	Type     string `xorm:"varchar(100)" json:"type"`
	Tag      string `xorm:"varchar(100)" json:"tag"`

	MachineName string `xorm:"varchar(100)" json:"machineName"`
	Os          string `xorm:"varchar(100)" json:"os"`

	PublicIp  string `xorm:"varchar(100)" json:"publicIp"`
	PrivateIp string `xorm:"varchar(100)" json:"privateIp"`

	Size    string `xorm:"varchar(100)" json:"size"`
	CpuSize string `xorm:"varchar(100)" json:"cpuSize"`
	MemSize string `xorm:"varchar(100)" json:"memSize"`

	RemoteProtocol string `xorm:"varchar(100)" json:"remoteProtocol"`
	RemotePort     int    `json:"remotePort"`
	RemoteUsername string `xorm:"varchar(100)" json:"remoteUsername"`
	RemotePassword string `xorm:"varchar(100)" json:"remotePassword"`

	AutoQuery   bool `json:"autoQuery"`
	IsPermanent bool `json:"isPermanent"`

	Language string `xorm:"varchar(100)" json:"language"`

	EnableRemoteApp bool         `json:"enableRemoteApp"`
	RemoteApps      []*RemoteApp `json:"remoteApps"`
	Services        []*Service   `json:"services"`
	Patches         []*Patch     `json:"patches"`
}

func GetNodeCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Node{})
}

func GetNodes(owner string) ([]*Node, error) {
	nodes := []*Node{}
	err := adapter.engine.Desc("created_time").Find(&nodes, &Node{Owner: owner})
	if err != nil {
		return nodes, err
	}

	return nodes, nil
}

func GetPaginationNodes(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Node, error) {
	nodes := []*Node{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&nodes)
	if err != nil {
		return nodes, err
	}

	return nodes, nil
}

func getNode(owner string, name string) (*Node, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	node := Node{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&node)
	if err != nil {
		return &node, err
	}

	if existed {
		return &node, nil
	} else {
		return nil, nil
	}
}

func GetNode(id string) (*Node, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getNode(owner, name)
}

func GetMaskedNode(node *Node, errs ...error) (*Node, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if node == nil {
		return nil, nil
	}

	if node.RemotePassword != "" {
		node.RemotePassword = "***"
	}
	return node, nil
}

func GetMaskedNodes(nodes []*Node, errs ...error) ([]*Node, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, node := range nodes {
		node, err = GetMaskedNode(node)
		if err != nil {
			return nil, err
		}
	}

	return nodes, nil
}

func UpdateNode(id string, node *Node) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getNode(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	if node.RemotePassword == "***" {
		node.RemotePassword = p.RemotePassword
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(node)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddNode(node *Node) (bool, error) {
	affected, err := adapter.engine.Insert(node)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteNode(node *Node) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{node.Owner, node.Name}).Delete(&Node{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (node *Node) getId() string {
	return fmt.Sprintf("%s/%s", node.Owner, node.Name)
}
