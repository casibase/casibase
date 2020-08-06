// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package object

import (
	"math/rand"
	"time"

	"github.com/casbin/casbin-forum/util"
)

type ValidateCode struct {
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Code        string `xorm:"varchar(100)" json:"code"`
	PhoneNumber string `xorm:"varchar(100)" json:"phoneNumber"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Expired     bool   `xorm:"bool" json:"expired"`
}

// AddValidateCode: return validate code and validate code ID
func GetNewValidateCode(phoneNumber string) (string, string) {
	code := getRandomCode(6)

	validateCode := ValidateCode{
		Id:          getRandomId(20),
		Code:        code,
		PhoneNumber: phoneNumber,
		CreatedTime: util.GetCurrentTime(),
		Expired:     false,
	}
	affected, err := adapter.engine.Insert(validateCode)
	if err != nil {
		panic(err)
	}

	if affected != 0 {
		return validateCode.Id, code
	}
	return "", ""
}

func CheckValidateCodeExpired(id string) bool {
	var code ValidateCode
	existed, err := adapter.engine.Id(id).Get(&code)
	if err != nil {
		panic(err)
	}

	if existed {
		return code.Expired
	}
	return true
}

func VerifyValidateCode(id, validateCode, phoneNumber string) bool {
	var code ValidateCode
	existed, err := adapter.engine.Id(id).Get(&code)
	if err != nil {
		panic(err)
	}

	if !existed || code.Expired || code.Code != validateCode || code.PhoneNumber != phoneNumber {
		return false
	}

	code.Expired = true
	affected, err := adapter.engine.Id(id).Cols("expired").Update(code)
	if err != nil {
		panic(err)
	}

	if affected != 0 {
		return true
	}
	return false
}

func ExpireValidateCode(date string) int {
	code := new(ValidateCode)
	code.Expired = true
	affected, err := adapter.engine.Where("expired = ?", 0).And("created_time < ?", date).Cols("expired").Update(code)
	if err != nil {
		panic(err)
	}

	return int(affected)
}

var stdChars = []byte("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")

func getRandomId(length int) string {
	var result []byte
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < length; i++ {
		result = append(result, stdChars[r.Intn(len(stdChars))])
	}
	return string(result)
}

var stdNums = []byte("0123456789")

func getRandomCode(length int) string {
	var result []byte
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < length; i++ {
		result = append(result, stdNums[r.Intn(len(stdNums))])
	}
	return string(result)
}
