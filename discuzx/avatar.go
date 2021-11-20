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
	"io"
	"io/ioutil"
	"net/http"
	"path"

	"github.com/casbin/casnode/service"
)

func getRedirectUrl(url string) string {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		panic(err)
	}

	newUrl := ""
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		newUrl = req.URL.String()
		return http.ErrUseLastResponse
	}

	_, err = client.Do(req)
	if err != nil {
		panic(err)
	}

	if newUrl == "" {
		newUrl = url
	}

	return newUrl
}

func downloadImage(url string) ([]byte, string, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	bs, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	newUrl := resp.Request.URL.String()
	if url == newUrl {
		panic(fmt.Errorf("downloadImage() error: url == newUrl: %s", url))
	}

	fileExt := path.Ext(newUrl)
	return bs, fileExt, nil
}

func uploadDiscuzxAvatar(username string, fileBytes []byte, fileExt string) string {
	memberId := fmt.Sprintf("%s/%s", CasdoorOrganization, username)
	fileUrl := service.UploadFileToStorage(memberId, "syncAvatar", "uploadDiscuzxAvatar", fmt.Sprintf("avatar/%s%s", memberId, fileExt), fileBytes)
	return fileUrl
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