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
	"crypto/sha256"
	"encoding/hex"
)

func HasMember(memberId string) bool {
	return GetMemberById(memberId) != nil
}

func IsPasswordCorrect(memberId string, password string) bool {
	objMember := GetMemberById(memberId)
	return VerifyPassword(password, objMember.Password)
}

// Check if the input password matches the real password
func VerifyPassword(inPassword string, realPassword string) bool {
	if inPassword == realPassword {
		return true
	}
	// Because some of the passwords in the DB are not encrypted with SHA256
	// we need to check if SHA256(realPassword) == inPassword
	bEncryptedMemberPswd := sha256.Sum256([]byte(realPassword))
	return hex.EncodeToString(bEncryptedMemberPswd[:]) == inPassword
}

func CheckMemberSignup(member string, password string) string {
	if len(member) == 0 || len(password) == 0 {
		return "errorUsernameOrPasswordEmpty"
	} else if HasMember(member) {
		return "errorUsernameExisted"
	} else {
		return ""
	}
}

/*
func CheckMemberLogin(member string, password string) string {
	if !HasMember(member) {
		return "errorUsernameNotFound"
	}

	if !IsPasswordCorrect(member, password) {
		return "errorPasswordWrong"
	}

	return ""
}
*/

// CheckMemberLogin needs password, and information, which could be username, phone number or email.
func CheckMemberLogin(information, password string) (string, string) {
	if member := MemberPasswordLogin(information, password); member != "" {
		return member, ""
	}

	return "", "Member not found or password error."
}

func CheckMemberSignupWithEmail(member string, email string) string {
	if len(member) == 0 || len(email) == 0 {
		return "errorUsernameOrUsernameEmpty"
	} else if HasMember(member) || HasMail(email) != "" {
		return "Username existed or email existed."
	} else {
		return ""
	}
}

func CheckMemberSignupWithPhone(member string, phoneNumber string) string {
	if len(member) == 0 || len(phoneNumber) == 0 {
		return "errorUsernameOrUsernameEmpty"
	} else if HasPhone(phoneNumber) != "" {
		return "This phone number has already been linked with another account"
	} else {
		return ""
	}
}

func CheckMemberSignupWithQQ(member string, qqOpenId string) string {
	if len(member) == 0 || len(qqOpenId) == 0 {
		return "Username empty or qq id empty"
	} else if HasQQAccount(qqOpenId) != "" {
		return "This qq account has already been linked with another account"
	} else {
		return ""
	}
}

func HasMail(email string) string {
	userInfo := GetMail(email)
	if userInfo != nil {
		return userInfo.Id
	}
	return ""
}

func HasPhone(phoneNumber string) string {
	userInfo := GetPhoneNumber(phoneNumber)
	if userInfo != nil {
		return userInfo.Id
	}
	return ""
}

func HasGithubAccount(githubAccount string) string {
	userInfo := GetGithubAccount(githubAccount)
	if userInfo != nil {
		return userInfo.Id
	}
	return ""
}

func HasGoogleAccount(googleAccount string) string {
	userInfo := GetGoogleAccount(googleAccount)
	if userInfo != nil {
		return userInfo.Id
	}
	return ""
}

func HasQQAccount(qqOpenId string) string {
	userInfo := GetQQAccount(qqOpenId)
	if userInfo != nil {
		return userInfo.Id
	}
	return ""
}
