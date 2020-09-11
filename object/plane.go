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

type Plane struct {
	Id              string `xorm:"varchar(50) notnull pk" json:"id"`
	Name            string `xorm:"varchar(50)" json:"name"`
	Sorter          int    `xorm:"int" json:"-"`
	Image           string `xorm:"varchar(200)" json:"image"`
	BackgroundColor string `xorm:"varchar(20)" json:"backgroundColor"`
	Color           string `xorm:"varchar(20)" json:"color"`
	Visible         bool   `xorm:"bool" json:"-"`
}

func GetPlanes() []*Plane {
	planes := []*Plane{}
	err := adapter.engine.Asc("sorter").Where("visible = ?", 1).Find(&planes)
	if err != nil {
		panic(err)
	}

	return planes
}

func GetAllPlanes() []*Plane {
	planes := []*Plane{}
	err := adapter.engine.Asc("sorter").Find(&planes)
	if err != nil {
		panic(err)
	}

	return planes
}

func GetPlane(id string) *Plane {
	plane := Plane{Id: id}
	existed, err := adapter.engine.Get(&plane)
	if err != nil {
		panic(err)
	}

	if existed {
		return &plane
	} else {
		return nil
	}
}

func AddPlane(plane *Plane) bool {
	affected, err := adapter.engine.Insert(plane)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func UpdatePlaneInfo(id, field, value string) bool {
	affected, err := adapter.engine.Table(new(Plane)).ID(id).Update(map[string]interface{}{field: value})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetPlaneList() []*PlaneWithNodes {
	planes := GetPlanes()

	res := []*PlaneWithNodes{}
	for _, v := range planes {
		temp := &PlaneWithNodes{
			Plane: v,
			Nodes: GetNodeFromPlane(v.Id),
		}
		res = append(res, temp)
	}

	return res
}
