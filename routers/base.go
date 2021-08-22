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
	"github.com/beego/beego/v2/adapter/context"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

func getSessionClaims(ctx *context.Context) *auth.Claims {
	s := ctx.Input.CruSession.Get(nil, "user")
	if s == nil {
		return nil
	}

	claims := &auth.Claims{}
	err := util.JsonToStruct(s.(string), claims)
	if err != nil {
		panic(err)
	}

	return claims
}

func setSessionClaims(ctx *context.Context, claims *auth.Claims) {
	if claims == nil {
		err := ctx.Input.CruSession.Delete(nil, "user")
		if err != nil {
			panic(err)
		}

		return
	}

	s := util.StructToJson(claims)
	err := ctx.Input.CruSession.Set(nil, "user", s)
	if err != nil {
		panic(err)
	}

	// https://github.com/beego/beego/issues/3445#issuecomment-455411915
	ctx.Input.CruSession.SessionRelease(nil, ctx.ResponseWriter)
}
