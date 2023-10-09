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

package routers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/controllers"
	"github.com/casibase/casibase/util"
)

const (
	headerAllowOrigin  = "Access-Control-Allow-Origin"
	headerAllowMethods = "Access-Control-Allow-Methods"
	headerAllowHeaders = "Access-Control-Allow-Headers"
)

func TransparentStatic(ctx *context.Context) {
	urlPath := ctx.Request.URL.Path
	if strings.HasPrefix(urlPath, "/api/") {
		return
	}

	landingFolder := beego.AppConfig.String("landingFolder")
	if landingFolder != "" {
		if urlPath == "" || urlPath == "/" || urlPath == "/about" {
			http.ServeFile(ctx.ResponseWriter, ctx.Request, fmt.Sprintf("../%s/web/build/index.html", landingFolder))
			return
		}

		landingPath := fmt.Sprintf("../%s/web/build%s", landingFolder, urlPath)
		if util.FileExist(landingPath) {
			http.ServeFile(ctx.ResponseWriter, ctx.Request, landingPath)
			return
		}
	}

	if strings.HasPrefix(urlPath, "/storage") {
		ctx.Output.Header(headerAllowOrigin, "*")
		ctx.Output.Header(headerAllowMethods, "POST, GET, OPTIONS, DELETE")
		ctx.Output.Header(headerAllowHeaders, "Content-Type, Authorization")

		urlPath = strings.TrimPrefix(urlPath, "/storage/")
		urlPath = strings.Replace(urlPath, "|", ":", 1)
		http.ServeFile(ctx.ResponseWriter, ctx.Request, urlPath)
		return
	}

	path := "web/build"
	if urlPath == "/" {
		path += "/index.html"
	} else {
		path += urlPath
	}

	if util.FileExist(path) {
		http.ServeFile(ctx.ResponseWriter, ctx.Request, path)
	} else {
		http.ServeFile(ctx.ResponseWriter, ctx.Request, "web/build/index.html")
	}
}

func ApiFilter(ctx *context.Context) {
	method := ctx.Request.Method
	urlPath := getUrlPath(ctx.Request.URL.Path)

	if conf.IsDemoMode() {
		if !isAllowedInDemoMode(method, urlPath) {
			controllers.DenyRequest(ctx)
		}
	}
}

func getUrlPath(urlPath string) string {
	if strings.HasPrefix(urlPath, "/cas") && (strings.HasSuffix(urlPath, "/serviceValidate") || strings.HasSuffix(urlPath, "/proxy") || strings.HasSuffix(urlPath, "/proxyValidate") || strings.HasSuffix(urlPath, "/validate") || strings.HasSuffix(urlPath, "/p3/serviceValidate") || strings.HasSuffix(urlPath, "/p3/proxyValidate") || strings.HasSuffix(urlPath, "/samlValidate")) {
		return "/cas"
	}

	if strings.HasPrefix(urlPath, "/api/login/oauth") {
		return "/api/login/oauth"
	}

	if strings.HasPrefix(urlPath, "/api/webauthn") {
		return "/api/webauthn"
	}

	return urlPath
}

func isAllowedInDemoMode(method string, urlPath string) bool {
	if method == "POST" && !(strings.HasPrefix(urlPath, "/api/signin") || urlPath == "/api/signout") {
		return false
	}

	return true
}
