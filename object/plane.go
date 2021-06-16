// Copyright 2020 The casbin Authors. All Rights Reserved.
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

import "sync"

type Plane struct {
	Id              string `xorm:"varchar(50) notnull pk" json:"id"`
	Name            string `xorm:"varchar(50)" json:"name"`
	Sorter          int    `xorm:"int" json:"-"`
	CreatedTime     string `xorm:"varchar(40)" json:"createdTime"`
	Image           string `xorm:"varchar(200)" json:"image"`
	BackgroundColor string `xorm:"varchar(20)" json:"backgroundColor"`
	Color           string `xorm:"varchar(20)" json:"color"`
	Visible         bool   `xorm:"bool" json:"-"`
}

func GetPlanes() []*Plane {
	planes := []*Plane{}
	err := adapter.Engine.Asc("sorter").Where("visible = ?", 1).Find(&planes)
	if err != nil {
		panic(err)
	}

	return planes
}

func GetAllPlanes() []*AdminPlaneInfo {
	planes := []*Plane{}
	err := adapter.Engine.Asc("sorter").Find(&planes)
	if err != nil {
		panic(err)
	}

	res := []*AdminPlaneInfo{}
	for _, v := range planes {
		temp := AdminPlaneInfo{
			Plane:    *v,
			Sorter:   v.Sorter,
			Visible:  v.Visible,
			NodesNum: GetPlaneNodesNum(v.Id),
		}
		res = append(res, &temp)
	}
	return res
}

func GetPlane(id string) *Plane {
	plane := Plane{Id: id}
	existed, err := adapter.Engine.Get(&plane)
	if err != nil {
		panic(err)
	}

	if existed {
		return &plane
	} else {
		return nil
	}
}

func GetPlaneAdmin(id string) *AdminPlaneInfo {
	plane := Plane{Id: id}
	existed, err := adapter.Engine.Get(&plane)
	if err != nil {
		panic(err)
	}

	planeNode := GetNodeFromPlane(plane.Id)
	res := AdminPlaneInfo{
		Plane:    plane,
		Sorter:   plane.Sorter,
		Visible:  plane.Visible,
		NodesNum: len(planeNode),
		Nodes:    planeNode,
	}

	if existed {
		return &res
	} else {
		return nil
	}
}

func AddPlane(plane *Plane) bool {
	affected, err := adapter.Engine.Insert(plane)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func UpdatePlane(id string, plane *Plane) bool {
	if GetPlane(id) == nil {
		return false
	}

	affected, err := adapter.Engine.Id(id).AllCols().Update(plane)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetPlaneList() []*PlaneWithNodes {
	planes := GetPlanes()

	var wg sync.WaitGroup
	res := make([]*PlaneWithNodes, len(planes))
	for k, plane := range planes {
		plane := plane
		k := k
		wg.Add(1)
		go func() {
			defer wg.Done()
			temp := &PlaneWithNodes{
				Plane: plane,
				Nodes: GetNodeFromPlane(plane.Id),
			}
			res[k] = temp
		}()
	}
	wg.Wait()

	return res
}

func DeletePlane(id string) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Plane{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetPlaneNodesNum(id string) int {
	node := new(Node)
	total, err := adapter.Engine.Where("plane_id = ?", id).Count(node)
	if err != nil {
		panic(err)
	}

	return int(total)
}
