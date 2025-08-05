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

package routers

import (
	"github.com/beego/beego/context"
)

func AutoSigninFilter(ctx *context.Context) {
	// HTTP Bearer token like "Authorization: Bearer 123"
	accessToken := ctx.Input.Query("accessToken")
	if accessToken == "" {
		accessToken = ctx.Input.Query("access_token")
	}
	if accessToken == "" {
		accessToken = parseBearerToken(ctx)
	}
	if accessToken != "" {
		userId, err := getUsernameByAccessToken(accessToken)
		if err != nil {
			responseError(ctx, err.Error())
			return
		}

		if userId != "" {
			setSessionUser(ctx, userId)
			return
		}
	}

	// HTTP Basic token like "Authorization: Basic 123"
	userId, err := getUsernameByClientIdSecret(ctx)
	if err != nil {
		responseError(ctx, err.Error())
		return
	}
	if userId != "" {
		setSessionUser(ctx, userId)
		return
	}
}
