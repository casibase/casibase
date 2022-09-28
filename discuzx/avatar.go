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
	"crypto/x509"
	"fmt"
	"net/url"
	"path"

	"github.com/casbin/casnode/casdoor"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

var discuzxDefaultAvatarUrl string

func init() {
	discuzxDefaultAvatarUrl = fmt.Sprintf("%suc_server/images/noavatar_middle.gif", discuzxDomain)
}

func syncAvatarForUser(user *casdoorsdk.User) string {
	uid := user.Ranking
	username := user.Name

	oldAvatarUrl := fmt.Sprintf("%suc_server/avatar.php?uid=%d", discuzxDomain, uid)
	newAvatarUrl := getRedirectUrl(oldAvatarUrl)
	if oldAvatarUrl == newAvatarUrl || newAvatarUrl == "" {
		panic(fmt.Errorf("getRedirectUrl() error: oldAvatarUrl == newAvatarUrl, oldAvatarUrl = %s, newAvatarUrl = %s", oldAvatarUrl, newAvatarUrl))
	}

	var fileBytes []byte
	var fileExt string

	if newAvatarUrl == discuzxDefaultAvatarUrl {
		randomAvatarUrl := getRandomAvatarUrl(username)
		fileBytes = getRandomAvatar(randomAvatarUrl)
		fileExt = ".png"

		user.IsDefaultAvatar = true
		go casdoor.UpdateUser(user.Owner, user.Name, user)
	} else {
		var err error
		times := 0
		for {
			fileBytes, _, err = downloadFile(newAvatarUrl)
			if err != nil {
				if urlError, ok := err.(*url.Error); ok {
					if hostnameError, ok := urlError.Err.(x509.HostnameError); ok {
						times += 1
						fmt.Printf("[%d]: downloadFile() error: %s, times = %d, use random avatar\n", uid, hostnameError.Error(), times)
						if times >= 10 {
							panic(err)
						}

						randomAvatarUrl := getRandomAvatarUrl(username)
						fileBytes = getRandomAvatar(randomAvatarUrl)
						fileExt = ".png"

						user.IsDefaultAvatar = true
						go casdoor.UpdateUser(user.Owner, user.Name, user)
						break
					}
				}

				times += 1
				fmt.Printf("[%d]: downloadFile() error: %s, times = %d\n", uid, err.Error(), times)
				if times >= 10 {
					panic(err)
				}
			} else {
				break
			}
		}

		if fileExt == "" {
			fileExt = path.Ext(newAvatarUrl)
		}
		if fileExt != ".png" {
			fileBytes, fileExt, err = convertImageToPng(fileBytes)
			if err != nil {
				panic(err)
			}
		}
	}

	avatarUrl, err := uploadDiscuzxAvatar(username, fileBytes, fileExt)
	if err != nil {
		panic(err)
	}

	return avatarUrl
}

func updateDefaultAvatarForUser(user *casdoorsdk.User) string {
	uid := user.Ranking
	username := user.Name

	defaultAvatarUrl := getRandomAvatarUrl(username)

	var fileBytes []byte
	var newUrl string
	var fileExt string
	var err error
	times := 0
	for {
		fileBytes, newUrl, err = downloadFile(defaultAvatarUrl)

		if err != nil {
			times += 1
			fmt.Printf("[%d]: downloadFile() error: %s, times = %d\n", uid, err.Error(), times)
			if times >= 10 {
				panic(err)
			}
		} else {
			break
		}
	}

	fileExt = path.Ext(newUrl)

	avatarUrl, err := uploadDiscuzxAvatar(username, fileBytes, fileExt)
	if err != nil {
		panic(err)
	}

	return avatarUrl
}
