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

package routers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/beego/beego/context"
)

func TestSecureCookieFilter(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a cookie without Secure flag
	resp.Header().Add("Set-Cookie", "casibase_session_id=test123; Path=/; HttpOnly")

	// Apply the Secure Cookie filter
	SecureCookieFilter(ctx)

	// Check if the Secure flag is added
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) == 0 {
		t.Fatal("Expected cookies to be set")
	}

	cookie := cookies[0]
	if !strings.Contains(cookie, "Secure") {
		t.Errorf("Expected cookie to contain 'Secure' flag, got: %s", cookie)
	}
}

func TestSecureCookieFilterMultipleCookies(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set multiple cookies without Secure flag
	resp.Header().Add("Set-Cookie", "casibase_session_id=test123; Path=/; HttpOnly")
	resp.Header().Add("Set-Cookie", "jsonWebConfig={\"key\":\"value\"}; Path=/")

	// Apply the Secure Cookie filter
	SecureCookieFilter(ctx)

	// Check if the Secure flag is added to all cookies
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) != 2 {
		t.Fatalf("Expected 2 cookies, got %d", len(cookies))
	}

	for i, cookie := range cookies {
		if !strings.Contains(cookie, "Secure") {
			t.Errorf("Cookie %d should contain 'Secure' flag, got: %s", i, cookie)
		}
	}
}

func TestSecureCookieFilterAlreadySecure(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a cookie that already has Secure flag
	originalCookie := "casibase_session_id=test123; Path=/; HttpOnly; Secure"
	resp.Header().Add("Set-Cookie", originalCookie)

	// Apply the Secure Cookie filter
	SecureCookieFilter(ctx)

	// Check that the cookie is not modified (no double Secure)
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) == 0 {
		t.Fatal("Expected cookies to be set")
	}

	cookie := cookies[0]
	// Count occurrences of "Secure"
	count := strings.Count(cookie, "Secure")
	if count != 1 {
		t.Errorf("Expected 'Secure' to appear once, got %d times in: %s", count, cookie)
	}
}

func TestSecureCookieFilterNoCookies(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Don't set any cookies

	// Apply the Secure Cookie filter (should not panic)
	SecureCookieFilter(ctx)

	// Check that no cookies are set
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) != 0 {
		t.Errorf("Expected no cookies, got %d", len(cookies))
	}
}

func TestSecureCookieFilterWithSecureInValue(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a cookie where the value contains "secure" but doesn't have the Secure flag
	resp.Header().Add("Set-Cookie", "username=SecureUser123; Path=/; HttpOnly")

	// Apply the Secure Cookie filter
	SecureCookieFilter(ctx)

	// Check if the Secure flag is added (should be added despite "Secure" in value)
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) == 0 {
		t.Fatal("Expected cookies to be set")
	}

	cookie := cookies[0]
	// The cookie should have the Secure flag added
	if !strings.Contains(cookie, "; Secure") {
		t.Errorf("Expected cookie to have '; Secure' flag added, got: %s", cookie)
	}

	// Verify the cookie value is not modified
	if !strings.Contains(cookie, "username=SecureUser123") {
		t.Errorf("Cookie value should remain unchanged, got: %s", cookie)
	}
}
