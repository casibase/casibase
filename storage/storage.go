// Copyright 2023 The casbin Authors. All Rights Reserved.
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

package storage

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	"github.com/casbin/casibase/casdoor"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Object struct {
	Key          string
	LastModified string
	Size         int64
	Url          string
}

func ListObjects(provider string, prefix string) ([]*Object, error) {
	if provider == "" {
		return nil, fmt.Errorf("storage provider is empty")
	}

	resources, err := casdoor.ListResources(provider, prefix)
	if err != nil {
		return nil, err
	}

	res := []*Object{}
	for _, resource := range resources {
		res = append(res, &Object{
			Key:          resource.Name,
			LastModified: resource.CreatedTime,
			Size:         int64(resource.FileSize),
			Url:          resource.Url,
		})
	}
	return res, nil
}

func GetObject(provider string, key string) (io.ReadCloser, error) {
	if provider == "" {
		return nil, fmt.Errorf("storage provider is empty")
	}

	res, err := casdoor.GetResource(provider, key)
	if err != nil {
		return nil, err
	}

	response, err := http.Get(res.Url)
	if err != nil {
		return nil, err
	}

	return response.Body, nil
}

func PutObject(provider string, user string, parent string, key string, fileBuffer *bytes.Buffer) error {
	if provider == "" {
		return fmt.Errorf("storage provider is empty")
	}

	_, _, err := casdoorsdk.UploadResource(user, "Casibase", parent, fmt.Sprintf("Direct/%s/%s", provider, key), fileBuffer.Bytes())
	if err != nil {
		return err
	}
	return nil
}

func DeleteObject(provider string, key string) error {
	if provider == "" {
		return fmt.Errorf("storage provider is empty")
	}

	_, err := casdoorsdk.DeleteResource(fmt.Sprintf("Direct/%s/%s", provider, key))
	if err != nil {
		return err
	}
	return nil
}
