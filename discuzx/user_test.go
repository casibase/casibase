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
	"testing"

	"github.com/casbin/casnode/casdoor"
	"github.com/casbin/casnode/controllers"
	"github.com/casbin/casnode/object"
)

func TestAddUsers(t *testing.T) {
	object.InitConfig()
	InitAdapter()
	object.InitAdapter()
	casdoor.InitCasdoorAdapter()
	controllers.InitAuthConfig()

	membersEx := getMembersEx()

	sem := make(chan int, 20)
	for i, memberEx := range membersEx {
		sem <- 1
		go func(i int, memberEx *MemberEx) {
			addUser(memberEx)
			fmt.Printf("[%d/%d]: Added user: [%d, %s] to Casdoor\n", i, len(membersEx), memberEx.Member.Uid, memberEx.Member.Username)
			<-sem
		}(i, memberEx)
	}
}
