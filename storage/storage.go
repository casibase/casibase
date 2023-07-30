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
	"time"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/casdoor"
	"github.com/casbin/casibase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Object struct {
	Key          string
	LastModified *time.Time
	Size         int64
}

func ListObjects(bucketName string, prefix string) ([]*Object, error) {
	resources, err := casdoor.ListResources(prefix)
	if err != nil {
		return nil, err
	}

	res := []*Object{}
	for _, resource := range resources {
		created, _ := time.Parse(time.RFC3339, resource.CreatedTime)
		res = append(res, &Object{
			Key:          util.GetNameFromIdNoCheck(resource.Name),
			LastModified: &created,
		})
	}
	return res, nil
}

func GetObject(bucketName string, key string) (io.ReadCloser, error) {
	res, err := casdoor.GetResource(key)
	if err != nil {
		return nil, err
	}

	response, err := http.Get(res.Url)
	if err != nil {
		return nil, err
	}

	return response.Body, nil
}

func PutObject(bucketName string, key string, fileBuffer *bytes.Buffer) error {
	_, _, err := casdoorsdk.UploadResource("Casibase", "Casibase", "Casibase",
		fmt.Sprintf("/resource/%s/%s/%s", casdoor.Organization, casdoor.Application, key), fileBuffer.Bytes())
	if err != nil {
		return err
	}
	return nil
}

func DeleteObject(bucketName string, key string) error {
	_, err := casdoorsdk.DeleteResource(util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), key))
	if err != nil {
		return err
	}
	return nil
}
