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

type UcenterMember struct {
	Uid           int
	Username      string
	Password      string
	Email         string
	Regip         string
	Regdate       int
	Lastloginip   int
	Lastlogintime int
	Salt          string
}

func getUcenterMembers() []*UcenterMember {
	ucenterMembers := []*UcenterMember{}
	err := adapter.Engine.Table("pre_ucenter_members").Find(&ucenterMembers)
	if err != nil {
		panic(err)
	}

	return ucenterMembers
}

func getUcenterMember(id int) *UcenterMember {
	ucenterMember := UcenterMember{Uid: id}
	existed, err := adapter.Engine.Table("pre_ucenter_members").Get(&ucenterMember)
	if err != nil {
		panic(err)
	}

	if existed {
		return &ucenterMember
	} else {
		return nil
	}
}

func getUcenterMemberMap() map[int]*UcenterMember {
	ucenterMembers := getUcenterMembers()

	m := map[int]*UcenterMember{}
	for _, ucenterMember := range ucenterMembers {
		m[ucenterMember.Uid] = ucenterMember
	}
	return m
}
