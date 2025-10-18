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

package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/beego/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/object"
)

const (
	PERMISSION_CASDOOR_ENFORCE_ENABLE = "permission.casdoorEnforceEnable"
	PERMISSION_CASDOOR_ENFORCEID = "permission.casdoorEnforceId"
)

// GetPermissions
// @Title GetPermissions
// @Tag Permission API
// @Description get permissions
// @Success 200 {array} casdoorsdk.Permission The Response object
// @router /get-permissions [get]
func (c *ApiController) GetPermissions() {
	permissions, err := casdoorsdk.GetPermissions()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permissions)
}

// GetPermission
// @Title GetPermission
// @Tag Permission API
// @Description get permission
// @Param id query string true "The id(owner/name) of permission"
// @Success 200 {object} casdoorsdk.Permission The Response object
// @router /get-permission [get]
func (c *ApiController) GetPermission() {
	id := c.Input().Get("id")
	_, name := util.GetOwnerAndNameFromId(id)

	permission, err := casdoorsdk.GetPermission(name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permission)
}

// UpdatePermission
// @Title UpdatePermission
// @Tag Permission API
// @Description update permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /update-permission [post]
func (c *ApiController) UpdatePermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	success, err := casdoorsdk.UpdatePermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddPermission
// @Title AddPermission
// @Tag Permission API
// @Description add permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /add-permission [post]
func (c *ApiController) AddPermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoorsdk.AddPermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeletePermission
// @Title DeletePermission
// @Tag Permission API
// @Description delete permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-permission [post]
func (c *ApiController) DeletePermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoorsdk.DeletePermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}


// checkCasdoorPermission 调用 Casdoor Enforce API 检查权限
// 根据模型定义，请求格式为 [subject, object, action]
// userId 可以是用户名或用户 tag（优先使用 tag）
func checkCasdoorPermission(userId string, resource string, action string) (bool, error) {
	casdoorEndpoint := conf.GetConfigString("casdoorEndpoint")
	clientId := conf.GetConfigString("clientId")
	clientSecret := conf.GetConfigString("clientSecret")

	// 从配置文件读取 enforcerId，如果没有配置则使用默认值
	enforcerId , _:= object.GET_DYNAMIC_CONFIG_VALUE_BY_KEY(PERMISSION_CASDOOR_ENFORCEID, beego.AppConfig.DefaultString("enforcerId", "casibase/enforcer_l38pva"))

	// 构造用户ID（不添加组织前缀，使用原始值）
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

// CheckPagePermission
// @Title CheckPagePermission
// @Tag Permission API
// @Description check if user has permission to access a page
// @Param pagePath query string true "The page path to check, e.g., /multi-center"
// @Success 200 {object} controllers.Response The Response object
// @router /check-page-permission [get]
func (c *ApiController) CheckPagePermission() {
	pagePath := c.Input().Get("pagePath")

	if pagePath == "" {
		c.ResponseError("pagePath parameter is required")
		return
	}

	// 获取当前登录用户
	user := c.GetSessionUser()
	if user == nil {
		c.ResponseError("User not logged in")
		return
	}
	
	// 优先使用 Tag 进行权限判断，如果 Tag 为空则使用 Name
	// 这样可以基于用户组/角色统一管理权限，例如 tag="user" 的所有用户共享相同权限
	userId := user.Tag
	if userId == "" {
		userId = user.Name
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

	// 如果未启用 Casdoor Enforce，默认允许访问
	if !enableCasdoorEnforce {
		c.ResponseOk(map[string]interface{}{
			"allowed":  true,
			"userId":   userId,
			"pagePath": pagePath,
		})
		return
	}

	// 使用 GET 方法检查页面访问权限
	allowed, err := checkCasdoorPermission(userId, pagePath, "GET")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 返回权限检查结果
	c.ResponseOk(map[string]interface{}{
		"allowed":  allowed,
		"userId":   userId,
		"pagePath": pagePath,
	})
}

