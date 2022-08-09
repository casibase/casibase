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
	"sync"
)

var randomAvatarCount = 244

var (
	randomAvatarMap      map[string][]byte
	randomAvatarMapMutex sync.RWMutex
)

func initRandomAvatars() {
	randomAvatarMap = map[string][]byte{}
	randomAvatarMapMutex = sync.RWMutex{}

	var wg sync.WaitGroup
	wg.Add(randomAvatarCount)

	sem := make(chan int, 100)
	for i := 1; i <= randomAvatarCount; i++ {
		sem <- 1
		go func(i int) {
			defer wg.Done()

			avatarUrl := fmt.Sprintf("%s%d.png", avatarPoolBaseUrl, i)
			fileBytes, _, err := downloadFile(avatarUrl)
			if err != nil {
				panic(err)
			}
			randomAvatarMapMutex.Lock()
			randomAvatarMap[avatarUrl] = fileBytes
			randomAvatarMapMutex.Unlock()
			fmt.Printf("[%d/%d]: Initialized random avatar: %s\n", i, randomAvatarCount, avatarUrl)
			<-sem
		}(i)
	}

	wg.Wait()
}

func getRandomAvatar(avatarUrl string) []byte {
	fileBytes, ok := randomAvatarMap[avatarUrl]
	if !ok {
		panic(fmt.Sprintf("getRandomAvatar() error, key not found: %s", avatarUrl))
	}
	return fileBytes
}
