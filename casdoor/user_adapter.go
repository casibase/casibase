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

import (
	"fmt"
	"time"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"xorm.io/core"
)

func getUsers() []*casdoorsdk.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	users := []*casdoorsdk.User{}
	err := adapter.Engine.Desc("created_time").Find(&users, &casdoorsdk.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return users
}

func getSortedUsers(sorter string, limit int) []*casdoorsdk.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	users := []*casdoorsdk.User{}
	err := adapter.Engine.Desc(sorter).Limit(limit, 0).Find(&users, &casdoorsdk.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return users
}

func getUserCount() int {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	count, err := adapter.Engine.Count(&casdoorsdk.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func getOnlineUserCount() int {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	count, err := adapter.Engine.Where("is_online = ?", 1).Count(&casdoorsdk.User{Owner: owner})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetUser(name string) *casdoorsdk.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	if owner == "" || name == "" {
		return nil
	}

	user := casdoorsdk.User{Owner: owner, Name: name}
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

func getUserByEmail(email string) *casdoorsdk.User {
	owner := CasdoorOrganization

	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	if owner == "" || email == "" {
		return nil
	}

	user := casdoorsdk.User{Owner: owner, Email: email}
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

func AddUser(user *casdoorsdk.User) bool {
	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	affected, err := adapter.Engine.Insert(user)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddUsers(users []*casdoorsdk.User) bool {
	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	if len(users) == 0 {
		return false
	}

	affected, err := adapter.Engine.Insert(users)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddUsersInBatch(users []*casdoorsdk.User) bool {
	batchSize := 1000

	if len(users) == 0 {
		return false
	}

	affected := false
	for i := 0; i < (len(users)-1)/batchSize+1; i++ {
		start := i * batchSize
		end := (i + 1) * batchSize
		if end > len(users) {
			end = len(users)
		}

		tmp := users[start:end]
		fmt.Printf("Add users: [%d - %d].\n", start, end)
		if AddUsers(tmp) {
			affected = true
		}
	}

	return affected
}

func updateUser(owner string, name string, user *casdoorsdk.User) (bool, error) {
	affected, err := adapter.Engine.ID(core.PK{owner, name}).AllCols().Update(user)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func UpdateUser(owner string, name string, user *casdoorsdk.User) bool {
	if adapter == nil {
		panic("casdoor adapter is nil")
	}

	var affected bool
	var err error
	times := 0
	for {
		affected, err = updateUser(owner, name, user)
		if err != nil {
			times += 1
			time.Sleep(3 * time.Second)
			if times >= 10 {
				panic(err)
			}
		} else {
			break
		}
	}
	return affected
}
