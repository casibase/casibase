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

package util

import (
	"fmt"
	"os"

	"github.com/ua-parser/uap-go/uaparser"
)

var Parser *uaparser.Parser

func InitParser() {
	var err error
	Parser, err = uaparser.New("../data/regexes.yaml")
	if _, ok := err.(*os.PathError); ok {
		Parser, err = uaparser.New("data/regexes.yaml")
	}
	if _, ok := err.(*os.PathError); ok {
		Parser, err = uaparser.New("../../data/regexes.yaml")
	}
	if err != nil {
		panic(err)
	}
}

func GetDescFromUserAgent(userAgent string) string {
	client := Parser.Parse(userAgent)
	return fmt.Sprintf("%s | %s | %s", client.UserAgent.ToString(), client.Os.ToString(), client.Device.ToString())
}
