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
	"github.com/casdoor/casdoor-go-sdk/auth"
)

func TestAvatar(t *testing.T) {
	object.InitConfig()
	InitAdapter()
	object.InitAdapter()
	casdoor.InitCasdoorAdapter()

	url := "https://casbin.org/img/casbin.svg"
	downloadImage(url)
}

func TestSyncAvatars(t *testing.T) {
	object.InitConfig()
	InitAdapter()
	object.InitAdapter()
	casdoor.InitCasdoorAdapter()
	controllers.InitAuthConfig()

	users := casdoor.GetUsers()

	sem := make(chan int, 10)
	for i, user := range users {
		sem <- 1
		go func(i int, user *auth.User) {
			if user.Avatar == "" {
				avatarUrl := syncAvatarForUser(user)
				fmt.Printf("[%d/%d]: Synced avatar for user: [%d, %s] as URL: %s\n", i, len(users), user.Ranking, user.Name, avatarUrl)
			}
			<-sem
		}(i, user)
	}
}
