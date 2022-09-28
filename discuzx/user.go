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

import (
	"fmt"
	"strconv"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func getUserFromMember(memberEx *MemberEx) *casdoorsdk.User {
	user := &casdoorsdk.User{
		Owner:       CasdoorOrganization,
		Name:        memberEx.Member.Username,
		CreatedTime: getTimeFromUnixSeconds(memberEx.Member.Regdate),
		Id:          strconv.Itoa(memberEx.Member.Uid),
		Type:        "normal-user",
		// Password:          memberEx.UcenterMember.Password,
		// PasswordSalt:      memberEx.UcenterMember.Salt,
		// DisplayName:       displayName,
		Avatar:          "",
		PermanentAvatar: "*",
		Email:           memberEx.Member.Email,
		// Phone:             memberEx.Profile.Mobile,
		// Location:          memberEx.Profile.Residecity,
		Address: []string{},
		// Affiliation:       memberEx.Profile.Occupation,
		// Title:             memberEx.Profile.Position,
		// IdCardType:        idCardType,
		// IdCard:            idCard,
		// Homepage:          memberEx.Profile.Site,
		// Bio:               memberEx.Profile.Bio,
		// Tag:               memberEx.Profile.Interest,
		Region:   "CN",
		Language: "zh",
		// Gender:            gender,
		// Birthday:          birthday,
		// Education:         memberEx.Profile.Education,
		Score:             memberEx.Member.Credits,
		Ranking:           memberEx.Member.Uid,
		IsOnline:          false,
		IsAdmin:           false,
		IsGlobalAdmin:     false,
		IsForbidden:       false,
		IsDeleted:         false,
		SignupApplication: CasdoorApplication,
		// CreatedIp:         memberEx.UcenterMember.Regip,
		// LastSigninTime:    getTimeFromUnixSeconds(memberEx.UcenterMember.Lastlogintime),
		LastSigninIp: "",
		Properties:   map[string]string{},
	}

	if memberEx.UcenterMember == nil {
		fmt.Printf("[%d, %s] memberEx.UcenterMember == nil\n", memberEx.Member.Uid, memberEx.Member.Username)
	} else {
		user.Password = memberEx.UcenterMember.Password
		user.PasswordSalt = memberEx.UcenterMember.Salt
		user.CreatedIp = memberEx.UcenterMember.Regip
		user.LastSigninTime = getTimeFromUnixSeconds(memberEx.UcenterMember.Lastlogintime)
	}

	if memberEx.Profile == nil {
		fmt.Printf("[%d, %s] memberEx.Profile == nil\n", memberEx.Member.Uid, memberEx.Member.Username)
	} else {
		displayName := memberEx.Profile.Realname
		if displayName == "" {
			displayName = memberEx.Member.Username
		}

		idCardType := ""
		idCard := ""
		if memberEx.Profile.Idcard != "" {
			idCardType = "IdCard"
			idCard = memberEx.Profile.Idcard
		}

		gender := "Male"
		if memberEx.Profile.Gender == 2 {
			gender = "Female"
		}

		birthday := ""
		if memberEx.Profile.Birthyear != 0 && memberEx.Profile.Birthmonth != 0 && memberEx.Profile.Birthday != 0 {
			birthday = fmt.Sprintf("%02d-%02d-%02d", memberEx.Profile.Birthyear, memberEx.Profile.Birthmonth, memberEx.Profile.Birthday)
		}

		address := []string{}
		if memberEx.Profile.Resideprovince != "" {
			address = append(address, memberEx.Profile.Resideprovince)
			if memberEx.Profile.Residecity != "" {
				address = append(address, memberEx.Profile.Residecity)
				if memberEx.Profile.Residedist != "" {
					address = append(address, memberEx.Profile.Residedist)
					if memberEx.Profile.Residecommunity != "" {
						address = append(address, memberEx.Profile.Residecommunity)
					}
				}
			}
		}
		user.Address = address

		user.DisplayName = displayName
		user.IdCardType = idCardType
		user.IdCard = idCard
		user.Gender = gender
		user.Birthday = birthday

		user.Phone = memberEx.Profile.Mobile
		user.Location = memberEx.Profile.Residecity
		user.Affiliation = memberEx.Profile.Occupation
		user.Title = memberEx.Profile.Position
		user.Homepage = memberEx.Profile.Site
		user.Bio = memberEx.Profile.Bio
		user.Tag = memberEx.Profile.Interest
		user.Education = memberEx.Profile.Education
	}

	return user
}
