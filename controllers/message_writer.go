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

package controllers

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"github.com/beego/beego/context"
)

type RefinedWriter struct {
	context.Response
	writerCleaner Cleaner
	buf           []byte
	messageBuf    []byte
	reasonBuf     []byte
}

func newRefinedWriter(w context.Response) *RefinedWriter {
	return &RefinedWriter{w, *NewCleaner(6), []byte{}, []byte{}, []byte{}}
}

func (w *RefinedWriter) Write(p []byte) (n int, err error) {
	var eventType string
	var data string

	if bytes.HasPrefix(p, []byte("event: reason")) {
		eventType = "reason"
		prefix := []byte("event: reason\ndata: ")
		suffix := []byte("\n\n")
		data = string(bytes.TrimSuffix(bytes.TrimPrefix(p, prefix), suffix))
	} else {
		eventType = "message"
		prefix := []byte("event: message\ndata: ")
		suffix := []byte("\n\n")
		data = string(bytes.TrimSuffix(bytes.TrimPrefix(p, prefix), suffix))
	}

	// Add data to the buffer
	w.buf = append(w.buf, []byte(data)...)
	if eventType == "message" {
		w.messageBuf = append(w.messageBuf, []byte(data)...)
	} else if eventType == "reason" {
		w.reasonBuf = append(w.reasonBuf, []byte(data)...)
	}

	if w.writerCleaner.cleaned == false && w.writerCleaner.dataTimes < w.writerCleaner.bufferSize {
		w.writerCleaner.AddData(data)
		if w.writerCleaner.dataTimes == w.writerCleaner.bufferSize {
			cleanedData := w.writerCleaner.GetCleanedData()
			fmt.Print(cleanedData)
			jsonData, err := ConvertMessageDataToJSON(cleanedData)
			if err != nil {
				return 0, err
			}
			return w.ResponseWriter.Write([]byte(fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, jsonData)))
		}
		return 0, nil
	}

	fmt.Print(data)
	jsonData, err := ConvertMessageDataToJSON(data)
	if err != nil {
		return 0, err
	}
	return w.ResponseWriter.Write([]byte(fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, jsonData)))
}

func (w *RefinedWriter) String() string {
	return string(w.buf)
}

func (w *RefinedWriter) MessageString() string {
	return string(w.messageBuf)
}

func (w *RefinedWriter) ReasonString() string {
	return string(w.reasonBuf)
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
	img := regexp.MustCompile(`<img[^>]+>`)
	if img.MatchString(data) {
		return data
	}

	data = strings.Replace(data, "?", "", -1)
	data = strings.Replace(data, "？", "", -1)
	data = strings.Replace(data, "-", "", -1)
	data = strings.Replace(data, "——", "", -1)

	keywords := []string{"问", "用户", "q", "user", "question"}

	if strings.Contains(data, ":") {
		parts := strings.Split(data, ":")
		data = checkFirstPart(parts[0], parts[len(parts)-1], keywords)
	} else if strings.Contains(data, "：") {
		parts := strings.Split(data, "：")
		data = checkFirstPart(parts[0], parts[len(parts)-1], keywords)
	}

	return data
}

func checkFirstPart(firstPart, secondPart string, keywords []string) string {
	for _, keyword := range keywords {
		if strings.Contains(firstPart, keyword) {
			return secondPart
		}
	}
	return firstPart
}
