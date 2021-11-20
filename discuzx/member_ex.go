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

type MemberEx struct {
	*Member
	*Profile
	*UcenterMember
}

func getMembersEx() []*MemberEx {
	members := getMembers()
	profileMap := getProfileMap()
	ucenterMemberMap := getUcenterMemberMap()

	membersEx := []*MemberEx{}
	for _, member := range members {
		memberEx := &MemberEx{
			Member:        member,
			Profile:       profileMap[member.Uid],
			UcenterMember: ucenterMemberMap[member.Uid],
		}
		membersEx = append(membersEx, memberEx)
	}
	return membersEx
}

func getMemberEx(id int) *MemberEx {
	member := getMember(id)
	profile := getProfile(id)
	ucenterMember := getUcenterMember(id)
	return &MemberEx{
		Member:        member,
		Profile:       profile,
		UcenterMember: ucenterMember,
	}
}

func getMemberExMap() map[int]*MemberEx {
	membersEx := getMembersEx()

	m := map[int]*MemberEx{}
	for _, memberEx := range membersEx {
		m[memberEx.Member.Uid] = memberEx
	}
	return m
}
