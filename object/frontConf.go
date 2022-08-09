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
	Id    string   `xorm:"varchar(100) notnull pk" json:"id"`
	Value string   `xorm:"mediumtext" json:"value"`
	Field string   `xorm:"varchar(100)" json:"field"`
	Tags  []string `xorm:"varchar(200)" json:"tags"`
}

var Confs = []*FrontConf{
	{Id: "forumName", Value: "Casnode", Field: "visualConf", Tags: nil},
	{Id: "logoImage", Value: "https://cdn.casbin.com/forum/static/img/logo.png", Field: "visualConf", Tags: nil},
	{Id: "footerLogoImage", Value: "https://cdn.casbin.com/forum/static/img/logo-footer.png", Field: "visualConf", Tags: nil},
	{Id: "footerLogoUrl", Value: "https://www.digitalocean.com/", Field: "visualConf", Tags: nil},
	{Id: "signinBoxStrong", Value: "Casbin = way to authorization", Field: "visualConf", Tags: nil},
	{Id: "signinBoxSpan", Value: "A place for Casbin developers and users", Field: "visualConf", Tags: nil},
	{Id: "footerDeclaration", Value: "World is powered by code", Field: "visualConf", Tags: nil},
	{Id: "footerAdvise", Value: "♥ Do have faith in what you're doing.", Field: "visualConf", Tags: nil},
	{Id: "faq", Value: "Not yet", Field: "", Tags: nil},
	{Id: "mission", Value: "Not yet", Field: "", Tags: nil},
	{Id: "advertise", Value: "Not yet", Field: "", Tags: nil},
	{Id: "thanks", Value: "Not yet", Field: "", Tags: nil},
}

func InitFrontConf() {
	var confs []*FrontConf
	err := adapter.Engine.Find(&confs)
	if err != nil {
		panic(err)
	}
	if len(confs) > 0 {
		return
	}
	confs = Confs
	_, err = adapter.Engine.Insert(&confs)
	if err != nil {
		panic(err)
	}
}

func GetFrontConfById(id string) *FrontConf {
	var confs []*FrontConf
	err := adapter.Engine.Where("id = ?", id).Find(&confs)
	if err != nil {
		panic(err)
	}

	if len(confs) == 0 {
		return nil
	} else {
		return confs[0]
	}
}

func GetFrontConfsByField(field string) []*FrontConf {
	var confs []*FrontConf
	err := adapter.Engine.Where("field = ?", field).Find(&confs)
	if err != nil {
		panic(err)
	}

	return confs
}

func UpdateFrontConfs(confs []*FrontConf) bool {
	var err error
	for _, conf := range confs {
		_, err = adapter.Engine.Where("id = ?", conf.Id).Update(conf)
		if err != nil {
			panic(err)
		}
	}

	return true
}

func UpdateFrontConfById(id string, value string, tags []string) (int64, error) {
	return adapter.Engine.Id(id).Cols("value", "tags").Update(&FrontConf{Value: value, Tags: tags})
}

func UpdateFrontConfsByField(confs []*FrontConf, field string) error {
	for _, conf := range confs {
		if conf.Field == field {
			_, err := adapter.Engine.Id(conf.Id).Cols("value").Update(conf)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
