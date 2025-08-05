// Copyright 2024 The Casibase Authors.. All Rights Reserved.
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
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"github.com/beego/beego/context"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/util"
)

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

func GetSessionUser(ctx *context.Context) *casdoorsdk.User {
	s := ctx.Input.Session("user")
	if s == nil {
		return nil
	}

	claims := s.(casdoorsdk.Claims)
	return &claims.User
}

func getUsername(ctx *context.Context) (username string) {
	user := GetSessionUser(ctx)
	if user != nil {
		username = util.GetIdFromOwnerAndName(user.Owner, user.Name)
	} else {
		username, _ = getUsernameByClientIdSecret(ctx)
	}
	return
}

func requestDeny(ctx *context.Context) {
	ctx.ResponseWriter.WriteHeader(http.StatusForbidden)

	response := &Response{
		Status: "error",
		Msg:    "Unauthorized operation",
	}

	err := ctx.Output.JSON(response, false, false)
	if err != nil {
		return
	}
}

func responseError(ctx *context.Context, error string, data ...interface{}) {
	// ctx.ResponseWriter.WriteHeader(http.StatusForbidden)

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

func setSessionUser(ctx *context.Context, userId string) {
	owner, name := util.GetOwnerAndNameFromId(userId)
	claims := casdoorsdk.Claims{
		User: casdoorsdk.User{
			Owner:   owner,
			Name:    name,
			IsAdmin: true,
		},
	}
	err := ctx.Input.CruSession.Set("user", claims)
	if err != nil {
		panic(err)
	}

	// https://github.com/beego/beego/issues/3445#issuecomment-455411915
	ctx.Input.CruSession.SessionRelease(ctx.ResponseWriter)
}

func getUsernameByClientIdSecret(ctx *context.Context) (string, error) {
	clientId, clientSecret, ok := ctx.Request.BasicAuth()
	if !ok {
		clientId = ctx.Input.Query("clientId")
		clientSecret = ctx.Input.Query("clientSecret")
	}

	if clientId == "" || clientSecret == "" {
		return "", nil
	}

	applicationName := conf.GetConfigString("casdoorApplication")
	if clientSecret != conf.GetConfigString("clientSecret") {
		return "", fmt.Errorf("Incorrect client secret for application: %s", applicationName)
	}

	return util.GetIdFromOwnerAndName("app", applicationName), nil
}

func getUsernameByAccessToken(accessTokenInput string) (string, error) {
	applicationName := conf.GetConfigString("casdoorApplication")
	clientSecret := conf.GetConfigString("clientSecret")
	clientId := conf.GetConfigString("clientId")
	accessToken := getMd5HexDigest(clientId + ":" + clientSecret)
	if accessTokenInput != accessToken {
		return "", fmt.Errorf("Incorrect access token for application: %s", applicationName)
	}

	return util.GetIdFromOwnerAndName("app", applicationName), nil
}

func parseBearerToken(ctx *context.Context) string {
	header := ctx.Request.Header.Get("Authorization")
	tokens := strings.Split(header, " ")
	if len(tokens) != 2 {
		return ""
	}

	prefix := tokens[0]
	if prefix != "Bearer" {
		return ""
	}

	return tokens[1]
}

func getMd5HexDigest(s string) string {
	hash := md5.Sum([]byte(s))
	res := hex.EncodeToString(hash[:])
	return res
}
