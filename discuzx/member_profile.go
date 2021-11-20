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

type Profile struct {
	Uid             int
	Realname        string
	Gender          int
	Birthyear       int
	Birthmonth      int
	Birthday        int
	Mobile          string
	Idcardtype      string
	Idcard          string
	Address         string
	Resideprovince  string
	Residecity      string
	Residedist      string
	Residecommunity string
	Education       string
	Occupation      string
	Position        string
	Site            string
	Bio             string
	Interest        string
}

func getProfiles() []*Profile {
	profiles := []*Profile{}
	err := adapter.Engine.Table("pre_common_member_profile").Find(&profiles)
	if err != nil {
		panic(err)
	}

	return profiles
}

func getProfile(id int) *Profile {
	profile := Profile{Uid: id}
	existed, err := adapter.Engine.Table("pre_common_member_profile").Get(&profile)
	if err != nil {
		panic(err)
	}

	if existed {
		return &profile
	} else {
		return nil
	}
}

func getProfileMap() map[int]*Profile {
	profiles := getProfiles()

	m := map[int]*Profile{}
	for _, profile := range profiles {
		m[profile.Uid] = profile
	}
	return m
}
