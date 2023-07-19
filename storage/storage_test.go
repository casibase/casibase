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

package storage

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"testing"
)

var conConfig = ConnectConfig{
	Name:            "",
	TypeName:        "onedrive",
	AccessKeyId:     "",
	SecretAccessKey: "",
	Token:           "",
}

func TestCreateConnection(t *testing.T) {
	CreateConnection(conConfig)
}
func TestStorage(t *testing.T) {
	_, err := ListObjects("casibase", "")
	if err != nil {
		panic(err)
	}
}

func TestFs(t *testing.T) {
	b, err := getFs(conConfig)
	fmt.Println(b)
	if err != nil {
		panic(err)
	}
}

func TestListObjects2(t *testing.T) {
	b, err := ListObjects2(conConfig, "/")
	fmt.Println(b)
	if err != nil {
		panic(err)
	}
}

func TestConfigLoad(t *testing.T) {
	ConfigLoad()
}

func TestDeleteObject2(t *testing.T) {
	fmt.Println(DeleteObject2(conConfig, "/test.txt"))
}

func TestPutObject2(t *testing.T) {
	localFile, err := os.Open("D:\\1.txt")
	if err != nil {
		fmt.Println(err)
	}
	defer localFile.Close()

	buffer := new(bytes.Buffer)

	_, err = io.Copy(buffer, localFile)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(PutObject2(conConfig, "/test6666.txt", buffer))
}
