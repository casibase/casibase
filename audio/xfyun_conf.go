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

package audio

var (
	xfyunAppId     = ""
	xfyunSecretKey = ""
)

const (
	defaultPartSize   = 10 * 1024 * 1024
	defaultRetryTimes = 3
	defaultUA         = "raasr-go-sdk-v1.0.0"
	defaultDomain     = "https://raasr.xfyun.cn/api"
)

// Conf config struct
type Conf struct {
	AppID      string
	SecretKey  string
	PartSize   int64
	RetryTimes int
	Ch         string
	UA         string
	Domain     string
}

func getDefaultConf() *Conf {
	conf := Conf{}
	conf.PartSize = defaultPartSize
	conf.RetryTimes = defaultRetryTimes
	conf.UA = defaultUA
	conf.Domain = defaultDomain

	return &conf
}
