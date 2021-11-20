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

type Member struct {
	Uid              int
	Email            string
	Username         string
	Password         string
	Status           int
	Emailstatus      int
	Avatarstatus     int
	Videophotostatus int
	Adminid          int
	Groupid          int
	Groupexpiry      int
	Extgroupids      string
	Regdate          int
	Credits          int
	Allowadmincp     int
}

func getMembers() []*Member {
	members := []*Member{}
	err := adapter.Engine.Table("pre_common_member").Find(&members)
	if err != nil {
		panic(err)
	}

	return members
}

func getMember(id int) *Member {
	member := Member{Uid: id}
	existed, err := adapter.Engine.Table("pre_common_member").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func getMemberMap() map[int]*Member {
	members := getMembers()

	m := map[int]*Member{}
	for _, member := range members {
		m[member.Uid] = member
	}
	return m
}
