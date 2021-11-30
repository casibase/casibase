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

	"github.com/casdoor/casdoor-go-sdk/auth"
)

func syncAvatarForUser(user *auth.User) string {
	uid := user.Ranking
	username := user.Name

	oldAvatarUrl := fmt.Sprintf("%suc_server/avatar.php?uid=%d", discuzxDomain, uid)

	var fileBytes []byte
	var newUrl string
	var fileExt string
	var err error
	times := 0
	for {
		fileBytes, newUrl, err = downloadFile(oldAvatarUrl)
		if oldAvatarUrl == newUrl {
			panic(fmt.Errorf("downloadFile() error: oldAvatarUrl == newUrl: %s", oldAvatarUrl))
		}

		if err != nil {
			if urlError, ok := err.(*url.Error); ok {
				if hostnameError, ok := urlError.Err.(x509.HostnameError); ok {
					times += 1
					fmt.Printf("[%d]: downloadFile() error: %s, times = %d, use default avatar\n", uid, hostnameError.Error(), times)
					if times >= 10 {
						panic(err)
					}

					oldAvatarUrl = fmt.Sprintf("%suc_server/avatar.php?uid=%d", discuzxDomain, 1)
					continue
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

	fileExt = path.Ext(newUrl)
	if fileExt != ".png" {
		fileBytes, fileExt, err = convertImageToPng(fileBytes)
		if err != nil {
			panic(err)
		}
	}

	avatarUrl := uploadDiscuzxAvatar(username, fileBytes, fileExt)
	return avatarUrl
}

func updateDefaultAvatarForUser(user *auth.User) string {
	uid := user.Ranking
	username := user.Name

	defaultAvatarUrl := getDefaultAvatarUrl(username)

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

	avatarUrl := uploadDiscuzxAvatar(username, fileBytes, fileExt)
	return avatarUrl
}
