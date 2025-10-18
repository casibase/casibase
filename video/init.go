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

package video

import (
	openapi "github.com/alibabacloud-go/darabonba-openapi/client"
	"github.com/alibabacloud-go/tea/tea"
	vod20170321 "github.com/alibabacloud-go/vod-20170321/v2/client"
)

var VodClient *vod20170321.Client

func SetVodClient(region string, clientId string, clientSecret string) error {
	config := &openapi.Config{
		AccessKeyId:     tea.String(clientId),
		AccessKeySecret: tea.String(clientSecret),
		RegionId:        tea.String(region),
		Endpoint:        tea.String("vod." + region + ".aliyuncs.com"),
	}
	client, err := vod20170321.NewClient(config)
	if err != nil {
		return err
	}

	VodClient = client
	return nil
}
