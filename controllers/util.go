// Copyright 2023 The casbin Authors. All Rights Reserved.
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

package controllers

import (
	"fmt"
	"strings"

	"github.com/astaxie/beego/context"
)

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

func (c *ApiController) ResponseOk(data ...interface{}) {
	resp := Response{Status: "ok"}
	switch len(data) {
	case 2:
		resp.Data2 = data[1]
		fallthrough
	case 1:
		resp.Data = data[0]
	}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) ResponseError(error string, data ...interface{}) {
	resp := Response{Status: "error", Msg: error}
	switch len(data) {
	case 2:
		resp.Data2 = data[1]
		fallthrough
	case 1:
		resp.Data = data[0]
	}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) RequireSignedIn() (string, bool) {
	userId := c.GetSessionUsername()
	if userId == "" {
		c.ResponseError("Please sign in first")
		return "", false
	}
	return userId, true
}

func (c *ApiController) RequireAdmin() bool {
	user := c.GetSessionUser()
	if user == nil || !user.IsAdmin {
		c.ResponseError("this operation requires admin privilege")
		return true
	}

	return false
}

func DenyRequest(ctx *context.Context) {
	responseError(ctx, "Unauthorized operation")
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

type RefinedWriter struct {
	context.Response
	writerCleaner Cleaner
	buf           []byte
}

func (w *RefinedWriter) Write(p []byte) (n int, err error) {
	data := strings.TrimRight(strings.TrimLeft(string(p), "event: message\ndata: "), "\n\n")
	if w.writerCleaner.cleaned == false && w.writerCleaner.dataTimes < w.writerCleaner.bufferSize {
		w.writerCleaner.AddData(data)
		if w.writerCleaner.dataTimes == w.writerCleaner.bufferSize {
			cleanedData := w.writerCleaner.GetCleanedData()
			w.buf = append(w.buf, []byte(cleanedData)...)
			return w.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", cleanedData)))
		}
		return 0, nil
	}

	w.buf = append(w.buf, []byte(data)...)
	return w.ResponseWriter.Write(p)
}

func (w *RefinedWriter) String() string {
	return string(w.buf)
}

type Cleaner struct {
	dataTimes  int      // Number of times data is added
	buffer     []string // Buffer of tokens
	bufferSize int      // Size of the buffer
	cleaned    bool     // Whether the data has been cleaned
}

func NewCleaner(bufferSize int) *Cleaner {
	return &Cleaner{
		dataTimes:  0,
		buffer:     make([]string, 0, bufferSize),
		bufferSize: bufferSize,
		cleaned:    false,
	}
}

func (c *Cleaner) AddData(data string) {
	c.buffer = append(c.buffer, data)
	c.dataTimes++
}

func (c *Cleaner) GetCleanedData() string {
	c.cleaned = true
	return cleanString(strings.Join(c.buffer, ""))
}

func cleanString(data string) string {
	keywords := []string{
		"Answer:",
		"answer:",
		"A:",
		"Question:",
		"question:",
		"Q:",
		"?\n",
		"？\n",
		"\n?",
		"\n？",
		"? ",
		"\n",
		"回答：",
		"答案：",
		"答：",
		"回答:",
		"答案:",
		"答:",
		"?",
		"？",
		"-",
		"——",
	}

	for _, keyword := range keywords {
		data = strings.ReplaceAll(data, keyword, "")
	}

	return data
}
