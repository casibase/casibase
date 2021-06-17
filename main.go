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
	"os"

	beego "github.com/beego/beego/v2/adapter"
	"github.com/beego/beego/v2/adapter/plugins/cors"
	_ "github.com/beego/beego/v2/adapter/session/mysql"
	"github.com/casbin/casnode/controllers"
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/routers"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

func main() {
	object.InitAdapter()
	controllers.InitHttpClient()
	object.HttpClient = controllers.HttpClient
	service.InitOSS()
	util.InitSegmenter()
	object.InitForumBasicInfo()

	beego.InsertFilter("*", beego.BeforeRouter, cors.Allow(&cors.Options{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "PUT", "PATCH"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	//beego.DelStaticPath("/static")
	beego.SetStaticPath("/static", "web/build/static")
	beego.SetStaticPath("/swagger", "swagger")
	beego.BConfig.WebConfig.DirectoryIndex = true

	// https://studygolang.com/articles/2303
	beego.InsertFilter("/", beego.BeforeRouter, routers.BotFilter)
	beego.InsertFilter("/*", beego.BeforeRouter, routers.BotFilter)
	beego.InsertFilter("/", beego.BeforeRouter, routers.TransparentStatic) // must has this for default page
	beego.InsertFilter("/*", beego.BeforeRouter, routers.TransparentStatic)

	beego.BConfig.WebConfig.Session.SessionProvider = "file"
	beego.BConfig.WebConfig.Session.SessionProviderConfig = "./tmp"
	beego.BConfig.WebConfig.Session.SessionGCMaxLifetime = 3600 * 24 * 365
	//beego.BConfig.WebConfig.Session.SessionProvider = "mysql"
	//beego.BConfig.WebConfig.Session.SessionProviderConfig = beego.AppConfig.String("dataSourceName") + beego.AppConfig.String("dbName")
	//beego.BConfig.WebConfig.Session.SessionGCMaxLifetime = 3600 * 24 * 365

	port := beego.AppConfig.String("httpport")
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	//controllers.InitBeegoSession()
	object.InitTimer()

	beego.Run("0.0.0.0:" + port)
}
