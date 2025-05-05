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

package conf

import (
	"encoding/json"
	"os"
	"runtime"
	"strconv"
	"strings"

	"github.com/beego/beego"
)

type WebConfig struct {
	AuthConfig struct {
		ServerUrl        string `json:"serverUrl"`
		ClientId         string `json:"clientId"`
		AppName          string `json:"appName"`
		OrganizationName string `json:"organizationName"`
		RedirectPath     string `json:"redirectPath"`
	} `json:"authConfig"`
	EnableExtraPages   bool     `json:"enableExtraPages"`
	ShortcutPageItems  []string `json:"shortcutPageItems"`
	UsageEndpoints     []string `json:"usageEndpoints"`
	IframeUrl          string   `json:"iframeUrl"`
	ForceLanguage      string   `json:"forceLanguage"`
	DefaultLanguage    string   `json:"defaultLanguage"`
	HtmlTitle          string   `json:"htmlTitle"`
	FaviconUrl         string   `json:"faviconUrl"`
	LogoUrl            string   `json:"logoUrl"`
	FooterHtml         string   `json:"footerHtml"`
	AppUrl             string   `json:"appUrl"`
	ShowGithubCorner   bool     `json:"showGithubCorner"`
	IsDemoMode         bool     `json:"isDemoMode"`
	DisablePreviewMode bool     `json:"disablePreviewMode"`
	ThemeDefault       struct {
		ThemeType    string `json:"themeType"`
		ColorPrimary string `json:"colorPrimary"`
		BorderRadius int    `json:"borderRadius"`
		IsCompact    bool   `json:"isCompact"`
	} `json:"themeDefault"`
	AvatarErrorUrl string `json:"avatarErrorUrl"`
}

func init() {
	// this array contains the beego configuration items that may be modified via env
	presetConfigItems := []string{"httpport", "appname"}
	for _, key := range presetConfigItems {
		if value, ok := os.LookupEnv(key); ok {
			err := beego.AppConfig.Set(key, value)
			if err != nil {
				panic(err)
			}
		}
	}
}

func GetConfigString(key string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}

	res := beego.AppConfig.String(key)
	if res == "" {
		if key == "staticBaseUrl" {
			res = "https://cdn.casibase.org"
		} else if key == "logConfig" {
			res = "{\"filename\": \"logs/casibase.log\", \"maxdays\":99999, \"perm\":\"0770\"}"
		} else if key == "avatarErrorUrl" {
			res = "https://cdn.casibase.org/gravatar/error.png"
		}
	}

	return res
}

func GetConfigBool(key string) bool {
	value := GetConfigString(key)
	if value == "true" {
		return true
	} else {
		return false
	}
}

func GetConfigInt(key string) int {
	value := GetConfigString(key)
	num, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return num
}

func GetConfigDataSourceName() string {
	dataSourceName := GetConfigString("dataSourceName")

	runningInDocker := os.Getenv("RUNNING_IN_DOCKER")
	if runningInDocker == "true" {
		// https://stackoverflow.com/questions/48546124/what-is-linux-equivalent-of-host-docker-internal
		if runtime.GOOS == "linux" {
			dataSourceName = strings.ReplaceAll(dataSourceName, "localhost", "172.17.0.1")
		} else {
			dataSourceName = strings.ReplaceAll(dataSourceName, "localhost", "host.docker.internal")
		}
	}

	return dataSourceName
}

func GetLanguage(language string) string {
	if language == "" || language == "*" {
		return "en"
	}

	if len(language) != 2 || language == "nu" {
		return "en"
	} else {
		return language
	}
}

func IsDemoMode() bool {
	return strings.ToLower(GetConfigString("isDemoMode")) == "true"
}

func GetConfigBatchSize() int {
	res, err := strconv.Atoi(GetConfigString("batchSize"))
	if err != nil {
		res = 100
	}
	return res
}

func GetStringArray(key string) []string {
	strValue := GetConfigString(key)
	if strValue == "" {
		return []string{}
	}

	var strArray []string
	if err := json.Unmarshal([]byte(strValue), &strArray); err == nil {
		return strArray
	}

	return strings.Split(strValue, ",")
}

func GetWebConfig() *WebConfig {
	config := &WebConfig{}

	config.AuthConfig.ServerUrl = GetConfigString("casdoorEndpoint")
	config.AuthConfig.ClientId = GetConfigString("clientId")
	config.AuthConfig.AppName = GetConfigString("casdoorApplication")
	config.AuthConfig.OrganizationName = GetConfigString("casdoorOrganization")
	config.AuthConfig.RedirectPath = GetConfigString("redirectPath")

	config.EnableExtraPages = GetConfigBool("enableExtraPages")
	config.ShortcutPageItems = GetStringArray("shortcutPageItems")
	config.UsageEndpoints = GetStringArray("usageEndpoints")
	config.IframeUrl = GetConfigString("iframeUrl")
	config.ForceLanguage = GetConfigString("forceLanguage")
	config.DefaultLanguage = GetLanguage(GetConfigString("defaultLanguage"))
	config.HtmlTitle = GetConfigString("htmlTitle")
	config.FaviconUrl = GetConfigString("faviconUrl")
	config.LogoUrl = GetConfigString("logoUrl")
	config.FooterHtml = GetConfigString("footerHtml")
	config.AppUrl = GetConfigString("appUrl")
	config.ShowGithubCorner = GetConfigBool("showGithubCorner")
	config.IsDemoMode = GetConfigBool("isDemoMode")
	config.DisablePreviewMode = GetConfigBool("disablePreviewMode")

	config.ThemeDefault.ThemeType = GetConfigString("defaultThemeType")
	config.ThemeDefault.ColorPrimary = GetConfigString("defaultColorPrimary")
	config.ThemeDefault.BorderRadius = GetConfigInt("defaultBorderRadius")
	config.ThemeDefault.IsCompact = GetConfigBool("defaultIsCompact")

	config.AvatarErrorUrl = GetConfigString("avatarErrorUrl")

	return config
}
