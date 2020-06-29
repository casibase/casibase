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

func HasMember(memberId string) bool {
	return GetMember(memberId) != nil
}

func IsPasswordCorrect(memberId string, password string) bool {
	objMember := GetMember(memberId)
	return objMember.Password == password
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

func CheckMemberLogin(member string, password string) string {
	if !HasMember(member) {
		return "errorUsernameNotFound"
	}

	if !IsPasswordCorrect(member, password) {
		return "errorPasswordWrong"
	}

	return ""
}

func CheckMemberSignupWithEmail(member string, email string) string {
	if len(member) == 0 || len(email) == 0 {
		return "errorUsernameOrUsernameEmpty"
	} else if HasMember(member) || HasMail(email) != "" {
		return "errorUsernameExistedOrEmailExisted"
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
