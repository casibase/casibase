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

type Board struct {
	Owner       string `xorm:"varchar(100)" json:"owner"`
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Title       string `xorm:"varchar(100)" json:"title"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Desc        string `xorm:"varchar(500)" json:"desc"`
}

func GetBoards() []*Board {
	boards := []*Board{}
	err := adapter.engine.Asc("created_time").Find(&boards)
	if err != nil {
		panic(err)
	}

	return boards
}

func GetBoard(id string) *Board {
	board := Board{Id: id}
	existed, err := adapter.engine.Get(&board)
	if err != nil {
		panic(err)
	}

	if existed {
		return &board
	} else {
		return nil
	}
}

func UpdateBoard(id string, board *Board) bool {
	if GetBoard(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).AllCols().Update(board)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddBoard(board *Board) bool {
	affected, err := adapter.engine.Insert(board)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteBoard(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Board{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
