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

package util

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/beego/beego/context"
)

func TestSetCookieWithAttributes(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/test", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a cookie with attributes
	err := SetCookieWithAttributes(ctx, "testCookie", "testValue")
	if err != nil {
		t.Fatalf("SetCookieWithAttributes failed: %v", err)
	}

	// Check the Set-Cookie header
	cookies := resp.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("No cookies were set")
	}

	cookie := cookies[0]

	// Verify cookie attributes
	if cookie.Name != "testCookie" {
		t.Errorf("Expected cookie name 'testCookie', got '%s'", cookie.Name)
	}

	if cookie.Path != "/" {
		t.Errorf("Expected cookie path '/', got '%s'", cookie.Path)
	}

	if cookie.HttpOnly {
		t.Error("Expected HttpOnly to be false for jsonWebConfig cookie")
	}

	if !cookie.Secure {
		t.Error("Expected Secure to be true")
	}

	if cookie.SameSite != http.SameSiteNoneMode {
		t.Errorf("Expected SameSite to be SameSiteNoneMode, got %v", cookie.SameSite)
	}
}

func TestAppendWebConfigCookie(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/get-account", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Append web config cookie
	err := AppendWebConfigCookie(ctx)
	if err != nil {
		t.Fatalf("AppendWebConfigCookie failed: %v", err)
	}

	// Check the Set-Cookie header
	cookies := resp.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("No cookies were set")
	}

	cookie := cookies[0]

	// Verify it's the jsonWebConfig cookie
	if cookie.Name != "jsonWebConfig" {
		t.Errorf("Expected cookie name 'jsonWebConfig', got '%s'", cookie.Name)
	}

	// Verify security attributes
	if cookie.HttpOnly {
		t.Error("Expected HttpOnly to be false for jsonWebConfig cookie (needs JavaScript access)")
	}

	if !cookie.Secure {
		t.Error("Expected Secure flag to be true")
	}

	if cookie.SameSite != http.SameSiteNoneMode {
		t.Errorf("Expected SameSite to be SameSiteNoneMode, got %v", cookie.SameSite)
	}
}
