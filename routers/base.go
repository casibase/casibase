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
	"github.com/astaxie/beego/context"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

func responseError(ctx *context.Context, error string, data ...interface{}) {
	resp := Response{Status: "error", Msg: error}
	switch len(data) {
	case 2:
		resp.Data2 = data[1]
		fallthrough
	case 1:
		resp.Data = data[0]
	}

	err := ctx.Output.JSON(resp, true, false)
	if err != nil {
		panic(err)
	}
}

func getSessionClaims(ctx *context.Context) *casdoorsdk.Claims {
	s := ctx.Input.CruSession.Get("user")
	if s == nil {
		return nil
	}

	claims := s.(casdoorsdk.Claims)
	return &claims
}

func setSessionClaims(ctx *context.Context, claims *casdoorsdk.Claims) {
	if claims == nil {
		err := ctx.Input.CruSession.Delete("user")
		if err != nil {
			panic(err)
		}

		return
	}

	err := ctx.Input.CruSession.Set("user", *claims)
	if err != nil {
		panic(err)
	}

	// https://github.com/beego/beego/issues/3445#issuecomment-455411915
	ctx.Input.CruSession.SessionRelease(ctx.ResponseWriter)
}
