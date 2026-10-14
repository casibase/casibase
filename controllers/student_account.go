// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
	cryptorand "crypto/rand"
	"encoding/json"
	"math/big"
	"regexp"
	"strings"

	"github.com/the-open-agent/openagent/auth"
	"github.com/the-open-agent/openagent/conf"
	"github.com/the-open-agent/openagent/object"
)

const (
	studentTag               = "学生"
	maxStudentAccountsPerRun = 200
	minStudentPasswordLength = 6
	studentPasswordLength    = 8
	// no 0/o, 1/l/i, so a generated password can be read off a printed list
	studentPasswordCharset = "abcdefghjkmnpqrstuvwxyz23456789"
)

// the same rule as Casdoor's util.ReUserName; Casdoor silently renames users that break it
var reStudentUsername = regexp.MustCompile(`^[a-zA-Z0-9]+([-._][a-zA-Z0-9]+)*$`)

type studentAccount struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Affiliation string `json:"affiliation"`
	Grade       string `json:"grade"`
	Phone       string `json:"phone"`
}

type studentAccountResult struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	Ok          bool   `json:"ok"`
	Msg         string `json:"msg"`
}

func generateStudentPassword() string {
	result := make([]byte, studentPasswordLength)
	max := big.NewInt(int64(len(studentPasswordCharset)))
	for i := range result {
		n, err := cryptorand.Int(cryptorand.Reader, max)
		if err != nil {
			panic(err)
		}
		result[i] = studentPasswordCharset[n.Int64()]
	}
	return string(result)
}

// translateCasdoorUserError turns the English messages Casdoor answers add-user with into the
// caller's language; anything not listed is passed through as is.
func (c *ApiController) translateCasdoorUserError(msg string) string {
	switch {
	case strings.Contains(msg, "Username already exists"):
		return c.T("account:The username is already taken")
	case strings.Contains(msg, "Phone already exists"):
		return c.T("account:The phone number is already used by another account")
	case strings.Contains(msg, "Phone number is invalid"):
		return c.T("account:The phone number is invalid")
	}
	return msg
}

// AddStudentAccounts lets a teacher create student accounts in the instance's Casdoor organization.
// Every account gets the 学生 tag and the application's default group, whatever the request says,
// so the endpoint cannot be used to create teachers or admins.
// @router /add-student-accounts [post]
func (c *ApiController) AddStudentAccounts() {
	user, ok := c.RequireSignedInUser()
	if !ok {
		return
	}
	if !c.RequireAdmin() {
		return
	}
	if user.Owner == object.UserOwner || !conf.IsCasdoorAvailable() {
		c.ResponseError(c.T("account:Student accounts can only be added when signing in with Casdoor"))
		return
	}

	var students []studentAccount
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &students)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if len(students) == 0 {
		c.ResponseError(c.T("application:Missing required parameters"))
		return
	}
	if len(students) > maxStudentAccountsPerRun {
		c.ResponseError(c.T("account:Too many student accounts in one request"))
		return
	}

	organization := conf.GetConfigString("casdoorOrganization")
	applicationName := conf.GetConfigString("casdoorApplication")
	groups := []string{}
	application, err := auth.GetApplication(applicationName)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if application != nil && application.DefaultGroup != "" {
		groups = append(groups, application.DefaultGroup)
	}

	results := []studentAccountResult{}
	seen := map[string]bool{}
	for _, student := range students {
		result := studentAccountResult{
			Name:        strings.TrimSpace(student.Name),
			DisplayName: strings.TrimSpace(student.DisplayName),
			Password:    strings.TrimSpace(student.Password),
		}
		affiliation := strings.TrimSpace(student.Affiliation)
		if affiliation == "" {
			affiliation = user.Affiliation
		}
		phone := strings.TrimSpace(student.Phone)

		switch {
		case !reStudentUsername.MatchString(result.Name):
			result.Msg = c.T("account:The username may only contain letters, digits and single - _ . between them")
		case seen[strings.ToLower(result.Name)]:
			result.Msg = c.T("account:The username appears more than once in this list")
		case result.DisplayName == "":
			result.Msg = c.T("account:The name is required")
		case result.Password != "" && len([]rune(result.Password)) < minStudentPasswordLength:
			result.Msg = c.T("account:The password must have at least 6 characters")
		}
		seen[strings.ToLower(result.Name)] = true
		if result.Msg != "" {
			results = append(results, result)
			continue
		}

		if result.Password == "" {
			result.Password = generateStudentPassword()
		}

		newUser := &auth.User{
			Owner:             organization,
			Name:              result.Name,
			DisplayName:       result.DisplayName,
			Password:          result.Password,
			Affiliation:       affiliation,
			Bio:               strings.TrimSpace(student.Grade),
			Tag:               studentTag,
			Type:              "normal-user",
			Groups:            groups,
			SignupApplication: applicationName,
			RegisterType:      "Teacher Import",
			RegisterSource:    user.Owner + "/" + user.Name,
		}
		if phone != "" {
			newUser.Phone = phone
			newUser.CountryCode = "CN"
		}

		affected, err := auth.AddUser(newUser)
		if err != nil {
			result.Msg = c.translateCasdoorUserError(err.Error())
		} else if !affected {
			result.Msg = c.T("account:The account was not created")
		} else {
			result.Ok = true
		}
		if !result.Ok {
			result.Password = ""
		}
		results = append(results, result)
	}

	c.ResponseOk(results)
}
