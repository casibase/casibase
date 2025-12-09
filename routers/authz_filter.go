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
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/beego/beego"
	"github.com/beego/beego/context"
	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/controllers"
	"github.com/casibase/casibase/object"
)

const (
	PERMISSION_CASDOOR_ENFORCE_ENABLE = "permission.casdoorEnforceEnable"
	PERMISSION_CASDOOR_ENDPOINT = "permission.casdoorEndpoint"
	PERMISSION_CASDOOR_ENFORCEID = "permission.casdoorEnforceId"
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

// checkCasdoorPermission 调用 Casdoor Enforce API 检查权限
// 根据模型定义，请求格式为 [subject, object, action]
// userId 可以是用户名或用户 tag（优先使用 tag）
func checkCasdoorPermission(userId string, resource string, action string) (bool, error) {
	casdoorEndpoint,_ := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(PERMISSION_CASDOOR_ENDPOINT, conf.GetConfigString("casdoorEndpoint"))
	clientId := conf.GetConfigString("clientId")
	clientSecret := conf.GetConfigString("clientSecret")
	
	// 从配置文件读取 enforcerId，如果没有配置则使用默认值
	enforcerId , _:= object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(PERMISSION_CASDOOR_ENFORCEID, beego.AppConfig.DefaultString("enforcerId", "casibase/enforcer_l38pva"))

	// logs.Info("Casdoor Endpoint:", casdoorEndpoint)
	// logs.Info("Client ID:", clientId)
	// logs.Info("Client Secret:", clientSecret)
	// logs.Info("Enforcer ID:", enforcerId)
	// logs.Info("Authz Filter:", "Casdoor Endpoint:", casdoorEndpoint, "Client ID:", clientId, "Client Secret:", clientSecret, "Enforcer ID:", enforcerId)
	
	// 构造 subject（用户标识或 tag）
	subject := userId
	
	// 构造资源路径（使用相对路径，不包含 http://）
	object := resource
	if strings.HasPrefix(resource, "http://") || strings.HasPrefix(resource, "https://") {
		// 如果传入的是完整URL，提取路径部分
		object = strings.TrimPrefix(resource, "http://")
		object = strings.TrimPrefix(object, "https://")
		// 移除主机部分，只保留路径
		parts := strings.SplitN(object, "/", 2)
		if len(parts) > 1 {
			object = "/" + parts[1]
		}
	}
	
	// 将 HTTP 方法转换为大写作为 action
	act := strings.ToUpper(action)
	
	// 构造请求体，顺序为 [subject, object, action]
	requestBody := []string{subject, object, act}
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return false, fmt.Errorf("failed to marshal request: %v", err)
	}
	
	// 发送请求到 Casdoor
	url := fmt.Sprintf("%s/api/enforce?enforcerId=%s", casdoorEndpoint, enforcerId)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return false, fmt.Errorf("failed to create request: %v", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(clientId, clientSecret)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("failed to call enforce API: %v", err)
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read response: %v", err)
	}
	
	// 解析响应
	var result struct {
		Status string   `json:"status"`
		Msg    string   `json:"msg"`
		Data   []bool   `json:"data"`
		Data2  []string `json:"data2"`
	}
	
	err = json.Unmarshal(body, &result)
	if err != nil {
		return false, fmt.Errorf("failed to parse response: %v", err)
	}
	
	if result.Status == "error" {
		return false, fmt.Errorf("enforce API error: %s", result.Msg)
	}
	
	if len(result.Data) > 0 {
		return result.Data[0], nil
	}
	
	return false, nil
}

func permissionFilter(ctx *context.Context) {
	path := ctx.Request.URL.Path
	controllerName := strings.TrimPrefix(path, "/api/")

	if !strings.HasPrefix(path, "/api/") {
		return
	}

	// 检查是否启用 Casdoor 权限验证
	enableCasdoorEnforceFromConfig,_ := beego.AppConfig.Bool("enableCasdoorEnforce")
	var defaultVal string
	if enableCasdoorEnforceFromConfig {
		defaultVal = "true"
	} else {
		defaultVal = "false"
	}
	enableCasdoorEnforceStr, _ := object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(PERMISSION_CASDOOR_ENFORCE_ENABLE, defaultVal)
	enableCasdoorEnforce := enableCasdoorEnforceStr == "true"
	
	// 免除权限检查的路径（登录、注册等公共接口）
	authExemptedPaths := []string{
		"signin", "signout", "get-account", "signup", "login",
	}
	
	for _, exemptPath := range authExemptedPaths {
		if controllerName == exemptPath {
			return
		}
	}
	
	// 获取当前用户
	user := GetSessionUser(ctx)
	var userId string
	
	if user != nil {
		// Session 用户：优先使用 Tag 进行权限判断，如果 Tag 为空则使用 Name
		// 这样可以基于用户组/角色统一管理权限，例如 tag="user" 的所有用户共享相同权限
		if user.Tag != "" {
			userId = user.Tag
		} else {
			userId = user.Name
		}
	} else {
		// 尝试通过 BasicAuth 获取用户
		username := getUsername(ctx)
		if username == "" {
			// 未登录用户
			responseError(ctx, "Please login first")
			return
		}
		// BasicAuth 认证的应用
		userId = username
	}
	
	// 如果启用了 Casdoor Enforce 权限检查
	if enableCasdoorEnforce {
		method := ctx.Request.Method
		allowed, err := checkCasdoorPermission(userId, path, method)
		
		if err != nil {
			logs.Error("Casdoor permission check error for user=%s, path=%s, method=%s: %v", userId, path, method, err)
			// 权限检查出错时，回退到管理员检查
			isAdmin := user != nil && (user.IsAdmin || user.Type == "chat-admin")
			if !isAdmin {
				responseError(ctx, fmt.Sprintf("Permission check failed: %v", err))
				return
			}
			logs.Info("Permission check failed but user is admin, allowing access")
		} else if !allowed {
			logs.Warn("Permission denied for user=%s, path=%s, method=%s by Casdoor policy", userId, path, method)
			responseError(ctx, "Permission denied: You don't have access to this resource")
			return
		} else {
			logs.Info("Permission granted for user=%s, path=%s, method=%s", userId, path, method)
		}
		
		// 权限验证通过，允许访问
		return
	}
	
	// 如果未启用 Casdoor Enforce，使用原有的权限检查逻辑
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
		"get-chats", "get-forms", "get-global-videos", "get-videos", "get-video", "get-messages",
		"delete-welcome-message", "get-message-answer", "get-answer",
		"get-storage-providers", "get-store", "get-providers", "get-global-stores",
		"update-chat", "add-chat", "delete-chat", "update-message", "add-message",
		"get-chat", "get-message",
	}

	for _, exemptPath := range exemptedPaths {
		if controllerName == exemptPath {
			return
		}
	}

	isAdmin := user != nil && (user.IsAdmin || user.Type == "chat-admin")
	if !isAdmin {
		responseError(ctx, "auth:this operation requires admin privilege")
		return
	}
}
