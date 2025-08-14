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

	adminDomain := conf.GetConfigString("adminDomain")
	if adminDomain != "" && ctx.Request.Host == adminDomain {
		return
	}

	if conf.IsDemoMode() {
		if !isAllowedInDemoMode(method, urlPath) {
			controllers.DenyRequest(ctx)
		}
	}
	permissionFilter(ctx)
}

func isAllowedInDemoMode(method string, urlPath string) bool {
	if method != "POST" {
		return true
	}

	if strings.HasPrefix(urlPath, "/api/signin") || urlPath == "/api/signout" || urlPath == "/api/add-chat" || urlPath == "/api/add-message" || urlPath == "/api/update-message" || urlPath == "/api/delete-welcome-message" || urlPath == "/api/generate-text-to-speech-audio" || urlPath == "/api/add-node-tunnel" || urlPath == "/api/start-connection" || urlPath == "/api/stop-connection" || urlPath == "/api/commit-record" || urlPath == "/api/commit-record-second" || urlPath == "/api/update-chat" || urlPath == "/api/delete-chat" {
		return true
	}

	return false
}

func permissionFilter(ctx *context.Context) {
	path := ctx.Request.URL.Path
	controllerName := strings.TrimPrefix(path, "/api/")

	if !strings.HasPrefix(path, "/api/") {
		return
	}

	disablePreviewMode, _ := beego.AppConfig.Bool("disablePreviewMode")

	isUpdateRequest := strings.HasPrefix(controllerName, "update-") || strings.HasPrefix(controllerName, "add-") || strings.HasPrefix(controllerName, "delete-") || strings.HasPrefix(controllerName, "refresh-") || strings.HasPrefix(controllerName, "deploy-")
	isGetRequest := strings.HasPrefix(controllerName, "get-")

	if !disablePreviewMode && isGetRequest {
		return
	}
	if !isGetRequest && !isUpdateRequest {
		return
	}

	exemptedPaths := []string{
		"get-account", "get-chats", "get-forms", "get-global-videos", "get-videos", "get-video", "get-messages",
		"delete-welcome-message", "get-message-answer", "get-answer",
		"get-storage-providers", "get-store", "get-providers", "get-global-stores",
		"update-chat", "add-chat", "delete-chat", "update-message", "add-message",
	}

	for _, exemptPath := range exemptedPaths {
		if controllerName == exemptPath {
			return
		}
	}

	user := GetSessionUser(ctx)

	isAdmin := user != nil && (user.IsAdmin || user.Type == "chat-admin")
	if !isAdmin {
		responseError(ctx, "this operation requires admin privilege")
		return
	}
}
