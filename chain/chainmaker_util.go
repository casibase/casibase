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

package chain

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

type ChainmakerResponse struct {
	TxId      string `json:"tx_id"`
	Result    string `json:"result"`
	Block     string `json:"block"`
	BlockHash string `json:"block_hash"`
}

func SendChainmakerRequest(info *ChainChainmakerClient, method string) (*ChainmakerResponse, error) {
	jsonData, err := json.Marshal(info)
	if err != nil {
		return nil, err
	}

	serverUrl := info.ChainConfig.ChainmakerEndpoint
	if serverUrl == "" {
		return nil, fmt.Errorf("chainmakerEndpoint is not configured")
	}

	if !strings.HasPrefix(serverUrl, "http://") && !strings.HasPrefix(serverUrl, "https://") {
		serverUrl = "http://" + serverUrl
	}

	serverUrl = strings.TrimRight(serverUrl, "/")

	url := fmt.Sprintf("%s/api/%s", serverUrl, method)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	type Response struct {
		Status string      `json:"status"`
		Msg    string      `json:"msg"`
		Data   interface{} `json:"data"`
		Data2  interface{} `json:"data2"`
	}

	var response Response
	err = json.Unmarshal(body, &response)
	if err != nil {
		return nil, err
	}
	if response.Status == "error" {
		return nil, fmt.Errorf("%s", response.Msg)
	}

	dataJson, err := json.Marshal(response.Data)
	if err != nil {
		return nil, err
	}
	var chainmakerResp ChainmakerResponse
	err = json.Unmarshal(dataJson, &chainmakerResp)
	if err != nil {
		return nil, err
	}
	return &chainmakerResp, nil
}

func normalizeChainData(data string) (string, error) {
	var originChainData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &originChainData); err != nil {
		return "", fmt.Errorf("parse json data error: %v", err)
	}

	normalizedData, err := json.Marshal(originChainData)
	if err != nil {
		return "", fmt.Errorf("marshal normalized data error: %v", err)
	}
	return string(normalizedData), nil
}
