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
	"bytes"
	"fmt"
	"image/gif"
	"image/jpeg"
	"image/png"
	"net/http"
	"net/url"

	"github.com/casbin/casnode/service"
)

func uploadDiscuzxAvatar(username string, fileBytes []byte, fileExt string) (string, error) {
	username = url.QueryEscape(username)
	memberId := fmt.Sprintf("%s/%s", CasdoorOrganization, username)
	fileUrl, err := service.UploadFileToStorageSafe(memberId, "avatar", "uploadDiscuzxAvatar", fmt.Sprintf("avatar/%s%s", memberId, fileExt), fileBytes, "", "")
	return fileUrl, err
}

func convertImageToPng(imageBytes []byte) ([]byte, string, error) {
	// Converting jpeg images to png with Golang
	// https://medium.com/@daetam/converting-jpeg-to-png-with-golang-85905105cf47

	contentType := http.DetectContentType(imageBytes)

	switch contentType {
	case "image/png":
		return imageBytes, ".png", nil
	case "image/jpeg":
		img, err := jpeg.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, "", err
		}

		buf := new(bytes.Buffer)
		err = png.Encode(buf, img)
		if err != nil {
			return nil, "", err
		}

		return buf.Bytes(), ".png", nil
	case "image/gif":
		img, err := gif.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, "", err
		}

		buf := new(bytes.Buffer)
		err = png.Encode(buf, img)
		if err != nil {
			return nil, "", err
		}

		return buf.Bytes(), ".png", nil
	default:
		return nil, "", fmt.Errorf("convertImageToPng() error: unsupported contentType: %s", contentType)
	}
}
