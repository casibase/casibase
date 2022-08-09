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

package main

import (
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/plugins/cors"
	_ "github.com/astaxie/beego/session/redis"
	"github.com/casbin/casnode/casdoor"
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/routers"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

func main() {
	object.InitAdapter()
	object.InitHttpClient()
	casdoor.InitCasdoorAdapter()
	service.InitDictionary()
	util.InitSegmenter()
	object.InitForumBasicInfo()
	object.InitFrontConf()
	object.InitTimer()

	beego.InsertFilter("*", beego.BeforeRouter, cors.Allow(&cors.Options{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "PUT", "PATCH"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// beego.DelStaticPath("/static")
	beego.SetStaticPath("/static", "web/build/static")
	beego.SetStaticPath("/swagger", "swagger")
	beego.BConfig.WebConfig.DirectoryIndex = true

	// https://studygolang.com/articles/2303
	beego.InsertFilter("*", beego.BeforeRouter, routers.BotFilter)
	beego.InsertFilter("*", beego.BeforeRouter, routers.Static)
	beego.InsertFilter("*", beego.BeforeRouter, routers.AutoSigninFilter)

	if beego.AppConfig.String("redisEndpoint") == "" {
		beego.BConfig.WebConfig.Session.SessionProvider = "file"
		beego.BConfig.WebConfig.Session.SessionProviderConfig = "./tmp"
	} else {
		beego.BConfig.WebConfig.Session.SessionProvider = "redis"
		beego.BConfig.WebConfig.Session.SessionProviderConfig = beego.AppConfig.String("redisEndpoint")
	}
	beego.BConfig.WebConfig.Session.SessionGCMaxLifetime = 3600 * 24 * 30

	beego.Run()
}
