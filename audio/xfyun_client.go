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

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

var ch string = "aaaaaaaaa`"

type Conn struct {
	c    *http.Client
	conf *Conf
}

type Client struct {
	conn *Conn
}

type RespInfo struct {
	Ok     int    `json:"ok"`
	ErrNo  int    `json:"err_no"`
	Failed string `json:"failed"`
	Data   string `json:"data"`
}

func New(appID, secretKey string) *Client {
	client := Client{}
	conf := getDefaultConf()
	conf.AppID = appID
	conf.SecretKey = secretKey

	conn := Conn{&http.Client{}, conf}
	client.conn = &conn

	return &client
}

func (c *Client) UploadAudio(filename, language string) (taskId string, err error) {
	filesize, sliceNum, err := c.conn.getSizeAndSiceNum(filename)
	if err != nil {
		return
	}

	taskId, err = c.initSliceUpload(filename, language, filesize, sliceNum)
	if err != nil {
		return
	}

	if err = c.performSliceUpload(filename, taskId, filesize, sliceNum); err != nil {
		return
	}

	if err = c.completeSliceUpload(taskId); err != nil {
		return
	}

	return
}

func (c *Client) initSliceUpload(filename, language string, filesize, sliceNum int64) (taskId string, err error) {
	var info RespInfo
	params := c.getBaseAuthParam("")
	params.Add("file_len", strconv.FormatInt(filesize, 10))
	params.Add("file_name", filename)
	params.Add("language", language)
	params.Add("slice_num", strconv.FormatInt(sliceNum, 10))

	resp, err := c.conn.httpDo(c.conn.conf.Domain+"/prepare", nil, params, nil)
	if err != nil {
		return
	}

	if err = json.Unmarshal([]byte(resp), &info); err != nil {
		return
	}

	if info.Ok == 0 {
		taskId = info.Data
	} else {
		err = fmt.Errorf("init slice upload failed: %s", info.Failed)
	}

	return
}

func (c *Client) performSliceUpload(filename, taskId string, filesize, sliceNum int64) (err error) {
	var info RespInfo
	fi, err := os.OpenFile(filename, os.O_RDONLY, os.ModePerm)
	if err != nil {
		return
	}
	defer fi.Close()

	b := make([]byte, c.conn.conf.PartSize)
	for i := int64(1); i <= sliceNum; i++ {
		fi.Seek((i-1)*c.conn.conf.PartSize, 0)
		if len(b) > int(filesize-(i-1)*c.conn.conf.PartSize) {
			b = make([]byte, filesize-(i-1)*c.conn.conf.PartSize)
		}
		fi.Read(b)

		params := c.getBaseAuthParam(taskId)
		params.Add("slice_id", c.getNextSliceId())
		resp, err := c.conn.postMulti(c.conn.conf.Domain+"/upload", filename, b, params)
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(resp), &info); err != nil {
			return err
		}

		if info.Ok != 0 {
			return fmt.Errorf("perform slice upload failed: %s", info.Failed)
		}
	}
	return nil
}

func (c *Client) completeSliceUpload(taskId string) (err error) {
	params := c.getBaseAuthParam(taskId)
	resp, err := c.conn.httpDo(c.conn.conf.Domain+"/merge", nil, params, nil)
	if err != nil {
		return
	}
	var info RespInfo
	if err = json.Unmarshal([]byte(resp), &info); err != nil {
		return
	}

	if info.Ok != 0 {
		return fmt.Errorf("complete slice upload failed: %s", info.Failed)
	}

	return nil
}

func (c *Client) doWorker(filename, taskId string, b []byte) (err error) {
	params := c.getBaseAuthParam(taskId)
	params.Add("slice_id", c.getNextSliceId())
	resp, err := c.conn.postMulti(c.conn.conf.Domain+"/upload", filename, b, params)
	if err != nil {
		return err
	}
	var info RespInfo
	if err := json.Unmarshal([]byte(resp), &info); err != nil {
		return err
	}

	if info.Ok != 0 {
		return fmt.Errorf("worker upload failed: %s", info.Failed)
	}

	return
}

func (c *Client) getProgress(taskId string) (*Response, error) {
	params := c.getBaseAuthParam(taskId)
	resp, err := c.conn.httpDo(c.conn.conf.Domain+"/getProgress", nil, params, nil)
	if err != nil {
		return nil, err
	}

	var info RespInfo
	if err = json.Unmarshal(resp, &info); err != nil {
		return nil, err
	}

	if info.Ok != 0 {
		return nil, fmt.Errorf("get progress failed: %s", info.Failed)
	}

	var res *Response
	res, err = parseResponse(info.Data)
	return res, err
}

func (c *Client) getResult(taskId string) ([]*Segment, error) {
	params := c.getBaseAuthParam(taskId)
	resp, err := c.conn.httpDo(c.conn.conf.Domain+"/getResult", nil, params, nil)
	if err != nil {
		return nil, err
	}

	var info RespInfo
	err = json.Unmarshal(resp, &info)
	if err != nil {
		return nil, err
	}

	if info.Ok != 0 {
		return nil, fmt.Errorf("get result failed: %s", info.Failed)
	}

	segments, err := parseSegmentResponse(info.Data)
	if err != nil {
		return nil, err
	}

	return segments, nil
}

func GetSegmentsFromAudio(audioUrl string) ([]*Segment, error) {
	client := New(xfyunAppId, xfyunSecretKey)

	taskId, err := client.UploadAudio(audioUrl, "cn")
	if err != nil {
		return nil, err
	}

	for {
		var resp *Response
		resp, err = client.getProgress(taskId)
		if err != nil && !strings.Contains(err.Error(), "请稍后重试") {
			return nil, err
		}

		if resp.Status == 3 {
			time.Sleep(2 * time.Second)
			continue
		}

		var segments []*Segment
		segments, err = client.getResult(taskId)
		if err != nil {
			return nil, err
		}

		return segments, err
	}
}
