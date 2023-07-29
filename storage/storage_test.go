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

//go:build !skipCi
// +build !skipCi

package storage_test

import (
	"io"
	"testing"

	"github.com/casbin/casibase/casdoor"
	"github.com/casbin/casibase/controllers"
	"github.com/casbin/casibase/storage"
)

func TestStorage(t *testing.T) {
	_, err := storage.ListObjects("casibase", "")
	if err != nil {
		panic(err)
	}
}

func TestCasdoor(t *testing.T) {
	controllers.InitAuthConfig()
	casdoor.InitCasdoorAdapter()
	s := storage.NewCasdoorStorage()

	// Test Put
	err := s.Put("admin", "test", []byte("test"))
	if err != nil {
		t.Error(err)
	}

	// Test List
	objs, err := s.List("admin")
	if err != nil {
		t.Error(err)
	}

	for _, obj := range objs {
		t.Log(obj)
	}

	// Test Get
	in, err := s.Get("test")
	if err != nil {
		t.Error(err)
	}

	bytes, err := io.ReadAll(in)
	if err != nil {
		t.Error(err)
	}

	t.Log(string(bytes))

	// Test Delete
	err = s.Delete("test")
	if err != nil {
		t.Error(err)
	}

	objs, err = s.List("test")
	if err != nil {
		t.Error(err)
	}

	for _, obj := range objs {
		t.Log(obj)
	}
}
