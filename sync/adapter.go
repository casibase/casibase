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

package sync

import (
	"github.com/astaxie/beego"
	"github.com/casbin/casnode/object"
	"github.com/casdoor/casdoor-go-sdk/auth"
	_ "github.com/go-sql-driver/mysql" // db = mysql
	"xorm.io/core"
	//_ "github.com/lib/pq"              // db = postgres
)

var adapter *object.Adapter

var CasdoorOrganization = beego.AppConfig.String("casdoorOrganization")

func initConfig() {
	err := beego.LoadAppConfig("ini", "../conf/app.conf")
	if err != nil {
		panic(err)
	}

	initAdapter()
}

func initAdapter() {
	adapter = object.NewAdapter(beego.AppConfig.String("driverName"), beego.AppConfig.String("dataSourceName"), beego.AppConfig.String("casdoorDbName"))
}

func getUser(name string) *auth.User {
	owner := CasdoorOrganization
	user := auth.User{Owner: owner, Name: name}
	existed, err := adapter.Engine.Get(&user)
	if err != nil {
		panic(err)
	}

	if existed {
		return &user
	} else {
		return nil
	}
}

func addUser(user *auth.User) bool {
	affected, err := adapter.Engine.Insert(user)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func updateUser(user *auth.User) bool {
	affected, err := adapter.Engine.ID(core.PK{user.Owner, user.Name}).AllCols().Update(user)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func getUserMap() map[string]*auth.User {
	m := map[string]*auth.User{}
	users := object.GetUsers()
	for _, user := range users {
		m[user.Name] = user
	}
	return m
}

func mergeUser(newUser auth.User, user auth.User) *auth.User {
	res := user

	if res.UpdatedTime == "" {
		res.UpdatedTime = newUser.UpdatedTime
	}
	if res.Avatar == "" {
		res.Avatar = newUser.Avatar
	}

	res.Title = newUser.Title
	res.Homepage = newUser.Homepage
	res.Bio = newUser.Bio
	res.Tag = newUser.Tag
	res.Score = newUser.Score
	res.Ranking = newUser.Ranking
	res.IsOnline = newUser.IsOnline
	res.IsAdmin = newUser.IsAdmin

	if res.QQ == "" {
		res.QQ = newUser.QQ
		res.Properties["oauth_QQ_displayName"] = newUser.Properties["oauth_QQ_displayName"]
		res.Properties["oauth_QQ_id"] = newUser.Properties["oauth_QQ_id"]
		res.Properties["oauth_QQ_verifiedTime"] = newUser.Properties["oauth_QQ_verifiedTime"]
	}
	if res.WeChat == "" {
		res.WeChat = newUser.WeChat
		res.Properties["oauth_WeChat_displayName"] = newUser.Properties["oauth_WeChat_displayName"]
		res.Properties["oauth_WeChat_id"] = newUser.Properties["oauth_WeChat_id"]
		res.Properties["oauth_WeChat_verifiedTime"] = newUser.Properties["oauth_WeChat_verifiedTime"]
	}

	res.Properties["checkinDate"] = newUser.Properties["checkinDate"]
	res.Properties["emailVerifiedTime"] = newUser.Properties["emailVerifiedTime"]
	res.Properties["phoneVerifiedTime"] = newUser.Properties["phoneVerifiedTime"]
	res.Properties["editorType"] = newUser.Properties["editorType"]
	res.Properties["fileQuota"] = newUser.Properties["fileQuota"]
	res.Properties["renameQuota"] = newUser.Properties["renameQuota"]

	return &res
}
