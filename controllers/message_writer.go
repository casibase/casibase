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
	"bytes"
	"fmt"
	"strings"

	"github.com/astaxie/beego/context"
)

type RefinedWriter struct {
	context.Response
	writerCleaner Cleaner
	buf           []byte
}

func newRefinedWriter(w context.Response) *RefinedWriter {
	return &RefinedWriter{w, *NewCleaner(6), []byte{}}
}

func (w *RefinedWriter) Write(p []byte) (n int, err error) {
	prefix := []byte("event: message\ndata: ")
	suffix := []byte("\n\n")
	data := string(bytes.TrimSuffix(bytes.TrimPrefix(p, prefix), suffix))
	if w.writerCleaner.cleaned == false && w.writerCleaner.dataTimes < w.writerCleaner.bufferSize {
		w.writerCleaner.AddData(data)
		if w.writerCleaner.dataTimes == w.writerCleaner.bufferSize {
			cleanedData := w.writerCleaner.GetCleanedData()
			w.buf = append(w.buf, []byte(cleanedData)...)
			fmt.Print(cleanedData)
			return w.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", cleanedData)))
		}
		return 0, nil
	}

	w.buf = append(w.buf, []byte(data)...)
	fmt.Print(data)
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
	data = strings.Replace(data, "?", "", -1)
	data = strings.Replace(data, "？", "", -1)

	data = strings.Replace(data, "-", "", -1)
	data = strings.Replace(data, "——", "", -1)

	if strings.Contains(data, ":") {
		parts := strings.Split(data, ":")
		data = parts[len(parts)-1]
	} else if strings.Contains(data, "：") {
		parts := strings.Split(data, "：")
		data = parts[len(parts)-1]
	}

	return data
}
