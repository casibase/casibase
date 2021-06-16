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

type Poster struct {
	Id          string `xorm:"varchar(50) notnull pk" json:"id"`
	Advertiser  string `xorm:"varchar(40)" json:"advertiser"`
	Link        string `xorm:"varchar(500)" json:"link"`
	PictureLink string `xorm:"varchar(500)" json:"picture_link"`
	State       string `xorm:"varchar(10)" json:"state"`
}

func AddPoster(poster Poster) bool {
	affected, err := adapter.Engine.Insert(poster)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetPoster(id string) *Poster {
	poster := Poster{Id: id}
	existed, err := adapter.Engine.Get(&poster)
	if err != nil {
		panic(err)
	}

	if existed {
		return &poster
	} else {
		return nil
	}
}

func UpdatePoster(id string, poster Poster) bool {
	if GetPoster(id) == nil {
		return AddPoster(poster)
	}

	affected, err := adapter.Engine.Id(id).AllCols().Update(poster)
	if err != nil {
		panic(err)
	}

	return affected != 0
}
