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

type Note struct {
	Id         int    `xorm:"int notnull pk autoincr"`
	User       string `xorm:"varchar(1000)"`
	Name       string `xorm:"varchar(1000)"`
	Field      string `xorm:"varchar(100)"`
	Content    string `xorm:"mediumtext"`
	Parent     string `xorm:"varchar(1000)"`
	Deleted    bool   `xorm:"bool"`
	EditorType string `xorm:"varchar(40)"`
}

func AddNote(note *Note) bool {
	affected, err := adapter.Engine.Insert(note)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetNote(id int) *Note {
	note := Note{Id: id}
	existed, err := adapter.Engine.Where("deleted = ?", 0).Get(&note)
	if err != nil {
		panic(err)
	}

	if existed {
		return &note
	}
	return nil
}

func UpdateNote(id int, note *Note) bool {
	if GetNote(id) == nil {
		return false
	}

	_, err := adapter.Engine.Id(id).AllCols().Update(note)
	if err != nil {
		panic(err)
	}

	return true
}

func GetNotesByParent(user string, parent string) []Note {
	var notes []Note
	err := adapter.Engine.Where("user = ?", user).And("parent = ?", parent).And("deleted = ?", 0).Find(&notes)
	if err != nil {
		panic(err)
	}
	return notes
}

func DeleteNote(id int) bool {
	note := Note{Id: id}
	note.Deleted = true

	return UpdateNote(id, &note)
}
