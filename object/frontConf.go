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

package object

type FrontConf struct {
	Id    string `xorm:"varchar(100) notnull pk"`
	Value string `xorm:"mediumtext"`
	Field string `xorm:"varchar(100)`
}

var (
	VisualConfs = []*FrontConf{
		{Id: "forumName", Value: "Casnode", Field: "visualConf"},
		{Id: "logoImage", Value: "https://cdn.casbin.com/forum/static/img/logo.png", Field: "visualConf"},
		{Id: "footerLogoImage", Value: "https://cdn.casbin.com/forum/static/img/logo-footer.png", Field: "visualConf"},
		{Id: "footerLogoUrl", Value: "https://www.digitalocean.com/", Field: "visualConf"},
		{Id: "signinBoxStrong", Value: "Casbin = way to authorization", Field: "visualConf"},
		{Id: "signinBoxSpan", Value: "A place for Casbin developers and users", Field: "visualConf"},
		{Id: "footerDeclaration", Value: "World is powered by code", Field: "visualConf"},
		{Id: "footerAdvise", Value: "♥ Do have faith in what you're doing.", Field: "visualConf"},
	}
	AuthConfs = []*FrontConf{
		{Id: "serverUrl", Value: "http://localhost:7001", Field: "authConf"},
		{Id: "clientId", Value: "014ae4bd048734ca2dea", Field: "authConf"},
		{Id: "appName", Value: "app-casbin-forum", Field: "authConf"},
		{Id: "organizationName", Value: "casbin-forum", Field: "authConf"},
	}
)

func InitFrontConf() {
	conf := GetFrontConfs()
	if len(conf) > 0 {
		return
	}

	conf = append(VisualConfs,AuthConfs...)

	_, err := adapter.Engine.Insert(&conf)
	if err != nil {
		panic(err)
	}
}

func GetFrontConfByField(field string) []*FrontConf {
	confs := []*FrontConf{}
	err := adapter.Engine.Where("field = ?", field).Find(&confs)
	if err != nil {
		panic(err)
	}

	return confs
}

func GetFrontConfs() []*FrontConf {
	confs := []*FrontConf{}
	err := adapter.Engine.Find(&confs)
	if err != nil {
		panic(err)
	}

	return confs
}

func UpdateFrontConf(confs []*FrontConf) bool {
	var err error
	for _, v := range confs {
		_, err = adapter.Engine.Id(v.Id).Cols("value").Update(v)
		if err != nil {
			panic(err)
		}
	}

	return true
}
