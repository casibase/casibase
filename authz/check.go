// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package authz

import (
	"github.com/astaxie/beego"
	"github.com/casbin/casbin/v2"
	xormadapter "github.com/casbin/xorm-adapter/v2"
)

var Enforcer *casbin.Enforcer

func Init() {
	var err error

	a, err := xormadapter.NewAdapter("mysql", beego.AppConfig.String("dataSourceName")+beego.AppConfig.String("databaseName"), true)
	if err != nil {
		panic(err)
	}

	Enforcer, err = casbin.NewEnforcer("conf/rbac_model.conf", a)
	if err != nil {
		panic(err)
	}

	Enforcer.LoadPolicy()
}

func IsRootMod(memberId string) bool {
	ret, err := Enforcer.HasRoleForUser(User(memberId), Role("root_mod"))
	if err != nil {
		panic(err)
	}
	return ret
}

func IsNodeMod(memberId string, nodeId string) bool {
	ret, err := Enforcer.HasRoleForUser(User(memberId), Role("mod"+nodeId))
	if err != nil {
		panic(err)
	}
	return ret
}
