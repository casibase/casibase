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

package discuzx

type Field struct {
	Fid         int
	Description string
	Icon        string
	Moderators  string
	Rules       string
}

func getFields() []*Field {
	fields := []*Field{}
	err := adapter.Engine.Table("pre_forum_forumfield").Find(&fields)
	if err != nil {
		panic(err)
	}

	return fields
}

func getField(id int) *Field {
	field := Field{Fid: id}
	existed, err := adapter.Engine.Table("pre_forum_forumfield").Get(&field)
	if err != nil {
		panic(err)
	}

	if existed {
		return &field
	} else {
		return nil
	}
}

func getFieldMap() map[int]*Field {
	fields := getFields()

	m := map[int]*Field{}
	for _, field := range fields {
		m[field.Fid] = field
	}
	return m
}
