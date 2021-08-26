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

package sync

import (
	"fmt"
	"testing"

	"github.com/casbin/casnode/casdoor"
	"github.com/casbin/casnode/object"
)

func TestSyncUsers(t *testing.T) {
	initConfig()
	initAdapter()
	object.InitAdapter()
	casdoor.InitCasdoorAdapter()

	members := object.GetMembersOld()
	userMap := getUserMap()

	i := 0
	for _, member := range members {
		newUser := object.CreateCasdoorUserFromMember(member)
		user := userMap[GetId(newUser)]

		if user != nil {
			fmt.Printf("[%d] Update user, user: %v, member: %v\n", i, user, newUser)

			mergedUser := mergeUser(*newUser, *user)
			updateUser(mergedUser)

			i += 1
		} else {
			addUser(newUser)
			fmt.Printf("New user: %v\n", newUser)
		}
	}
}
