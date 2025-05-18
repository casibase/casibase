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

package util

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

func IndexAt(s, sep string, n int) int {
	idx := strings.Index(s[n:], sep)
	if idx > -1 {
		idx += n
	}
	return idx
}

func ParseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err)
	}

	return i
}

func ParseIntWithError(s string) (int, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return -1, err
	}

	if i < 0 {
		return -1, errors.New("negative version number")
	}

	return i, nil
}

func ParseFloat(s string) float64 {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		panic(err)
	}

	return f
}

func GetOwnerAndNameFromIdNoCheck(id string) (string, string) {
	tokens := strings.SplitN(id, "/", 2)
	return tokens[0], tokens[1]
}

func GetOwnerAndNameFromId(id string) (string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 2 {
		panic(errors.New("GetOwnerAndNameFromId() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1]
}

func GetOwnerAndNameFromId3(id string) (string, string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 3 {
		panic(errors.New("GetOwnerAndNameFromId3() error, wrong token count for ID: " + id))
	}

	return tokens[0], fmt.Sprintf("%s/%s", tokens[0], tokens[1]), tokens[2]
}

func GetOwnerAndNameFromId3New(id string) (string, string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 3 {
		panic(errors.New("GetOwnerAndNameFromId3New() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1], tokens[2]
}

func GetIdFromOwnerAndName(owner string, name string) string {
	return fmt.Sprintf("%s/%s", owner, name)
}

func GenerateId() string {
	return uuid.NewString()
}

func ReadStringFromPath(path string) string {
	data, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		panic(err)
	}

	return string(data)
}

func WriteStringToPath(s string, path string) {
	err := os.WriteFile(path, []byte(s), 0o644)
	if err != nil {
		panic(err)
	}
}

func ReadBytesFromPath(path string) []byte {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	return data
}

func WriteBytesToPath(b []byte, path string) {
	err := ioutil.WriteFile(path, b, 0o644)
	if err != nil {
		panic(err)
	}
}

func DecodeBase64(s string) string {
	res, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		panic(err)
	}

	return string(res)
}

func GetRandomName() string {
	rand.Seed(time.Now().UnixNano())
	const charset = "0123456789abcdefghijklmnopqrstuvwxyz"
	result := make([]byte, 6)
	for i := range result {
		result[i] = charset[rand.Intn(len(charset))]
	}
	return string(result)
}

func GetId(owner, name string) string {
	if strings.Contains(name, "/") {
		return name
	}

	return fmt.Sprintf("%s/%s", owner, name)
}

// SnakeString transform XxYy to xx_yy
func SnakeString(s string) string {
	data := make([]byte, 0, len(s)*2)
	j := false
	num := len(s)
	for i := 0; i < num; i++ {
		d := s[i]
		if i > 0 && d >= 'A' && d <= 'Z' && j {
			data = append(data, '_')
		}
		if d != '_' {
			j = true
		}
		data = append(data, d)
	}
	result := strings.ToLower(string(data[:]))
	return strings.ReplaceAll(result, " ", "")
}

func GetChatFromProvider(owner, name string) string {
	return GetIdFromOwnerAndName(owner, fmt.Sprintf("chat_%s", name))
}

func GetRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[rand.Intn(len(charset))]
	}
	return string(result)
}

func GenerateUUID() string {
	return uuid.New().String()
}
