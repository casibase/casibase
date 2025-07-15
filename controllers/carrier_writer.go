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

package controllers

import (
	"bytes"
)

type CarrierWriter struct {
	writerCleaner Cleaner
	messageBuf    []byte
}

func (w *CarrierWriter) Write(p []byte) (n int, err error) {
	var eventType string
	var data string

	if bytes.HasPrefix(p, []byte("event: message")) {
		eventType = "message"
		prefix := []byte("event: message\ndata: ")
		suffix := []byte("\n\n")
		data = string(bytes.TrimSuffix(bytes.TrimPrefix(p, prefix), suffix))
	}

	if eventType == "message" {
		w.messageBuf = append(w.messageBuf, []byte(data)...)
	}
	return len(p), nil
}

func (w *CarrierWriter) MessageString() string {
	return string(w.messageBuf)
}

func (w *CarrierWriter) Flush() {}
