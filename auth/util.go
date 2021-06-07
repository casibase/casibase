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

package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

func getBytes(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return bytes, nil
}

func modifyUser(method string, user User) (bool, error) {
	user.Owner = authConfig.OrganizationName

	url := fmt.Sprintf("%s/api/%s?id=%s/%s&clientId=%s&clientSecret=%s", authConfig.Endpoint, method, user.Owner, user.Name, authConfig.ClientId, authConfig.ClientSecret)
	userByte, err := json.Marshal(user)
	if err != nil {
		panic(err)
	}

	resp, err := http.Post(url, "text/plain;charset=UTF-8", bytes.NewReader(userByte))
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	respByte, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	var response Response
	err = json.Unmarshal(respByte, &response)
	if err != nil {
		return false, err
	}

	if response.Data == "Affected" {
		return true, nil
	}
	return false, nil
}
