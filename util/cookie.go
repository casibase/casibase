// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package util

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/beego/beego/context"

	"github.com/casibase/casibase/conf"
)

func AppendWebConfigCookie(ctx *context.Context) error {
	webConfig := conf.GetWebConfig()

	jsonWebConfig, err := json.Marshal(webConfig)
	if err != nil {
		return err
	}

	return SetCookieWithAttributes(ctx, "jsonWebConfig", string(jsonWebConfig))
}

func SetCookieWithAttributes(ctx *context.Context, name string, value string) error {
	encodedValue := url.QueryEscape(value)

	cookie := &http.Cookie{
		Name:     name,
		Value:    encodedValue,
		Path:     "/",
		HttpOnly: false,
	}

	isHTTPS := ctx.Request.TLS != nil || ctx.Request.Header.Get("X-Forwarded-Proto") == "https"
	if isHTTPS {
		cookie.SameSite = http.SameSiteNoneMode
		cookie.Secure = true
	} else {
		cookie.SameSite = http.SameSiteLaxMode
		cookie.Secure = false
	}

	http.SetCookie(ctx.ResponseWriter, cookie)
	return nil
}
