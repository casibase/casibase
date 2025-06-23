// Copyright 2025 The casbin Authors. All Rights Reserved.
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

package object

import (
	"time"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func UploadFileToStorageSafe(user string, tag string, parent string, fullFilePath string, fileBytes []byte) (string, error) {
	var fileUrl string
	var err error
	times := 0
	for {
		fileUrl, _, err = casdoorsdk.UploadResource(user, tag, parent, fullFilePath, fileBytes)
		if err != nil {
			times += 1
			time.Sleep(3 * time.Second)
			if times >= 10 {
				return "", err
			}
		} else {
			break
		}
	}
	return fileUrl, nil
}
