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

package casdoor

import "github.com/casdoor/casdoor-go-sdk/auth"

func GetUsers() []*auth.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	users := []*auth.User{}
	err := adapter.Engine.Desc("created_time").Find(&users, &auth.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return users
}

func GetSortedUsers(sortColName string, limit int) []*auth.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	users := []*auth.User{}
	err := adapter.Engine.Desc(sortColName).Limit(25, 0).Find(&users, &auth.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return users
}

func GetUserCount() int {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	count, err := adapter.Engine.Count(&auth.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetOnlineUserCount() int {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	count, err := adapter.Engine.Where("is_online = ?", 1).Count(&auth.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetUser(name string) *auth.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	if owner == "" || name == "" {
		return nil
	}

	user := auth.User{Owner: owner, Name: name}
	existed, err := adapter.Engine.Get(&user)
	if err != nil {
		panic(err)
	}

	if existed {
		return &user
	} else {
		return nil
	}
}

func GetUserByEmail(email string) *auth.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	if owner == "" || email == "" {
		return nil
	}

	user := auth.User{Owner: owner, Email: email}
	existed, err := adapter.Engine.Get(&user)
	if err != nil {
		panic(err)
	}

	if existed {
		return &user
	} else {
		return nil
	}
}
