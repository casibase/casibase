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
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/casdoor"
	"github.com/casbin/casibase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type casdoorClient struct {
	Storage
}

func NewCasdoorStorage() Storage {
	return &casdoorClient{}
}

func (s *casdoorClient) Get(key string) (io.ReadCloser, error) {
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

func (s *casdoorClient) Put(user, key string, bytes []byte) error {
	_, _, err := casdoorsdk.UploadResource(user, "Casibase", "Casibase",
		fmt.Sprintf("/resource/%s/%s/%s",
			casdoor.Organization, casdoor.Application, key),
		bytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *casdoorClient) Delete(key string) error {
	_, err := casdoorsdk.DeleteResource(util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), key))
	if err != nil {
		return err
	}
	return nil
}

func (s *casdoorClient) List(prefix string) ([]*Object, error) {
	res, err := casdoor.ListResources(prefix)
	if err != nil {
		return nil, err
	}

	result := make([]*Object, 0)
	for _, r := range res {
		created, _ := time.Parse(time.RFC3339, r.CreatedTime)
		result = append(result, &Object{
			Key:          util.GetNameFromIdNoCheck(r.Name),
			LastModified: &created,
			Storage:      s,
		})
	}

	return result, nil
}
