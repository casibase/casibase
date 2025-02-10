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
	"bytes"
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"math"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
)

func (c *Conn) postMulti(uri, filename string, content []byte, params url.Values) ([]byte, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("content", filename+params.Get("slice_id"))
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(part, bytes.NewBuffer(content))

	for key, val := range params {
		_ = writer.WriteField(key, val[0])
	}
	err = writer.Close()
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequest("POST", uri, body)
	request.Header.Set("Content-Type", writer.FormDataContentType())

	res, err := c.c.Do(request)
	if err != nil {
		return nil, err
	}

	return ioutil.ReadAll(res.Body)
}

func (c *Conn) httpDo(url string, body []byte, params url.Values, headers map[string]string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	if params != nil {
		req.URL.RawQuery = params.Encode()
	}
	if headers != nil {
		for key, val := range headers {
			req.Header.Add(key, val)
		}
	}
	resp, err := c.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return ioutil.ReadAll(resp.Body)
}

func (c *Conn) getSizeAndSiceNum(filename string) (filesize, num int64, err error) {
	filesize, err = fileSize(filename)
	if err != nil {
		return
	}
	num = int64(math.Ceil(float64(filesize) / float64(c.conf.PartSize)))
	return
}

func (c *Client) getBaseAuthParam(taskId string) url.Values {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	mac := hmac.New(sha1.New, []byte(c.conn.conf.SecretKey))
	strByte := []byte(c.conn.conf.AppID + ts)
	strMd5Byte := md5.Sum(strByte)
	strMd5 := fmt.Sprintf("%x", strMd5Byte)
	mac.Write([]byte(strMd5))
	signa := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	params := url.Values{}
	params.Add("app_id", c.conn.conf.AppID)
	params.Add("signa", signa)
	params.Add("ts", ts)
	if len(taskId) > 0 {
		params.Add("task_id", taskId)
	}

	return params
}

func (c *Client) getNextSliceId() string {
	j := len(ch) - 1
	for i := j; i >= 0; {
		cj := string(ch[i])
		if cj != "z" {
			ch = ch[:i] + string(ch[i]+1) + ch[i+1:]
			break
		} else {
			ch = string(ch[:i]) + "a" + ch[i+1:]
			i--
		}
	}
	return ch
}

func fileSize(filename string) (int64, error) {
	info, err := os.Stat(filename)
	if err != nil && os.IsNotExist(err) {
		return 0, err
	}
	return info.Size(), nil
}

type Response struct {
	Status int    `json:"status"`
	Desc   string `json:"desc"`
}

func parseResponse(s string) (*Response, error) {
	var res Response
	err := json.Unmarshal([]byte(s), &res)
	if err != nil {
		return nil, err
	}

	return &res, nil
}

type Segment struct {
	Bg      string `json:"bg"`
	Ed      string `json:"ed"`
	Onebest string `json:"onebest"`
	Speaker string `json:"speaker"`
}

func parseSegmentResponse(s string) ([]*Segment, error) {
	var res []*Segment
	err := json.Unmarshal([]byte(s), &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}
