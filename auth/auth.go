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

// Package auth is a thin wrapper around the identity-provider SDK.
// All calls to the upstream SDK go through this package so that
// "no provider configured" guards can be added in one place later.
package auth

import (
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"golang.org/x/oauth2"
)

// Type aliases — re-export all SDK types used across the codebase so that
// other packages only need to import this package, not casdoorsdk directly.
type (
	Application  = casdoorsdk.Application
	Cert         = casdoorsdk.Cert
	Claims       = casdoorsdk.Claims
	Organization = casdoorsdk.Organization
	Permission   = casdoorsdk.Permission
	Provider     = casdoorsdk.Provider
	Resource     = casdoorsdk.Resource
	Transaction  = casdoorsdk.Transaction
	User         = casdoorsdk.User
)

// InitConfig initialises the identity-provider SDK client.
func InitConfig(endpoint, clientId, clientSecret, jwtPublicKey, organization, application string) {
	casdoorsdk.InitConfig(endpoint, clientId, clientSecret, jwtPublicKey, organization, application)
}

func GetApplication(name string) (*Application, error) {
	return casdoorsdk.GetApplication(name)
}

func GetCert(name string) (*Cert, error) {
	return casdoorsdk.GetCert(name)
}

func GetOAuthToken(code, state string) (*oauth2.Token, error) {
	return casdoorsdk.GetOAuthToken(code, state)
}

func ParseJwtToken(token string) (*Claims, error) {
	return casdoorsdk.ParseJwtToken(token)
}

func GetUser(name string) (*User, error) {
	return casdoorsdk.GetUser(name)
}

func GetUsers() ([]*User, error) {
	return casdoorsdk.GetUsers()
}

func AddUser(user *User) (bool, error) {
	return casdoorsdk.AddUser(user)
}

func GetOrganization(name string) (*Organization, error) {
	return casdoorsdk.GetOrganization(name)
}

func SendEmail(title, content, sender, receiver string) error {
	return casdoorsdk.SendEmail(title, content, sender, receiver)
}

func SendNotification(content string, recipient string) error {
	return casdoorsdk.SendNotification(content, recipient)
}

func GetPermissions() ([]*Permission, error) {
	return casdoorsdk.GetPermissions()
}

func GetPermission(name string) (*Permission, error) {
	return casdoorsdk.GetPermission(name)
}

func UpdatePermission(p *Permission) (bool, error) {
	return casdoorsdk.UpdatePermission(p)
}

func AddPermission(p *Permission) (bool, error) {
	return casdoorsdk.AddPermission(p)
}

func DeletePermission(p *Permission) (bool, error) {
	return casdoorsdk.DeletePermission(p)
}

func GetProviders() ([]*Provider, error) {
	return casdoorsdk.GetProviders()
}

func AddTransaction(t *Transaction) (bool, string, error) {
	return casdoorsdk.AddTransaction(t)
}

func AddTransactionWithDryRun(t *Transaction, dryRun bool) (bool, string, error) {
	return casdoorsdk.AddTransactionWithDryRun(t, dryRun)
}

func GetResources(owner, application, field, value, sortField, sortOrder string) ([]*Resource, error) {
	return casdoorsdk.GetResources(owner, application, field, value, sortField, sortOrder)
}

func UploadResource(user, tag, parent, fullFilePath string, fileBytes []byte) (string, string, error) {
	return casdoorsdk.UploadResource(user, tag, parent, fullFilePath, fileBytes)
}

func DeleteResourceWithTag(resource *Resource, tag string) (bool, error) {
	return casdoorsdk.DeleteResourceWithTag(resource, tag)
}
