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

package routers

import (
	"net/url"

	"github.com/beego/beego/v2/adapter/context"
	"github.com/casbin/casnode/controllers"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

func returnRequest(ctx *context.Context, msg string) {
	w := ctx.ResponseWriter
	w.WriteHeader(200)
	resp := &controllers.Response{Status: "error", Msg: msg}
	_, err := w.Write([]byte(util.StructToJson(resp)))
	if err != nil {
		panic(err)
	}
}

func AutoSigninFilter(ctx *context.Context) {
	query := ctx.Request.URL.RawQuery
	queryMap, err := url.ParseQuery(query)
	if err != nil {
		panic(err)
	}

	// "/page?access_token=123"
	accessToken := queryMap.Get("accessToken")
	if accessToken == "signout" {
		// sign out
		setSessionUser(ctx, nil)
		return
	}

	var claims *auth.Claims = nil
	if accessToken != "" {
		claims, err = auth.ParseJwtToken(accessToken)
		if err != nil {
			returnRequest(ctx, "Invalid JWT token")
			return
		}

		setSessionUser(ctx, claims)
		return
	}

	if claims != nil {
		ok, _ := auth.CheckUserPassword(claims.User)
		if ok {
			setSessionUser(ctx, claims)
		}
	}
}
