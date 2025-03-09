// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"strings"

	"github.com/beego/beego"
	"github.com/beego/beego/context"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/controllers"
)

func AuthzFilter(ctx *context.Context) {
	method := ctx.Request.Method
	urlPath := ctx.Request.URL.Path

	adminDomain := beego.AppConfig.String("adminDomain")
	if adminDomain != "" && ctx.Request.Host == adminDomain {
		return
	}

	if conf.IsDemoMode() {
		if !isAllowedInDemoMode(method, urlPath) {
			controllers.DenyRequest(ctx)
		}
	}
}

func isAllowedInDemoMode(method string, urlPath string) bool {
	if method != "POST" {
		return true
	}

	if strings.HasPrefix(urlPath, "/api/signin") || urlPath == "/api/signout" || urlPath == "/api/add-message" || urlPath == "/api/update-message" || urlPath == "/api/delete-welcome-message" || urlPath == "/api/add-node-tunnel" || urlPath == "/api/start-session" || urlPath == "/api/stop-session" {
		return true
	}

	return false
}
