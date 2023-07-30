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

package casdoor

import (
	"fmt"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func ListResources(prefix string) ([]*casdoorsdk.Resource, error) {
	prefix = util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), prefix)

	result := make([]*casdoorsdk.Resource, 0)
	err := adapter.Engine.Where("name like ?", prefix+"%").Find(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func GetResource(key string) (*casdoorsdk.Resource, error) {
	id := fmt.Sprintf("/resource/%s/%s/casibase/%s", Organization, Application, key)
	resource := casdoorsdk.Resource{Owner: Organization, Name: id}
	existed, err := adapter.Engine.Get(&resource)
	if err != nil {
		return nil, err
	}

	if existed {
		return &resource, nil
	} else {
		return nil, fmt.Errorf("resource %s not found", key)
	}
}
