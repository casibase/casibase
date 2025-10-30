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
	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/test", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a session cookie without Secure flag (simulating beego's behavior)
	http.SetCookie(resp, &http.Cookie{
		Name:     "casibase_session_id",
		Value:    "test-session-id",
		Path:     "/",
		HttpOnly: true,
	})

	// Apply the SecureCookieFilter
	SecureCookieFilter(ctx)

	// Check the Set-Cookie header
	cookies := resp.Header()["Set-Cookie"]
	if len(cookies) == 0 {
		t.Fatal("No cookies were set")
	}

	// Verify that the Secure flag was added
	found := false
	for _, cookie := range cookies {
		if strings.Contains(cookie, "casibase_session_id=") {
			found = true
			if !strings.Contains(cookie, "Secure") {
				t.Errorf("Expected Secure flag to be added to session cookie, got: %s", cookie)
			}
		}
	}

	if !found {
		t.Error("Session cookie not found in response")
	}
}

func TestSecureCookieFilterAlreadySecure(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "https://example.com/api/test", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a session cookie that already has Secure flag
	http.SetCookie(resp, &http.Cookie{
		Name:     "casibase_session_id",
		Value:    "test-session-id",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	// Apply the SecureCookieFilter
	SecureCookieFilter(ctx)

	// Check that the cookie wasn't modified (shouldn't add Secure twice)
	newCookies := resp.Header()["Set-Cookie"]
	if len(newCookies) != 1 {
		t.Fatalf("Expected 1 cookie, got %d", len(newCookies))
	}

	// The cookie should either be unchanged or have only one Secure flag
	newCookie := newCookies[0]
	secureCount := strings.Count(newCookie, "Secure")
	if secureCount != 1 {
		t.Errorf("Expected exactly 1 Secure flag, got %d in: %s", secureCount, newCookie)
	}
}

func TestSecureCookieFilterNonSessionCookie(t *testing.T) {
	// Create a mock request
	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/test", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Set a non-session cookie
	http.SetCookie(resp, &http.Cookie{
		Name:  "other_cookie",
		Value: "other-value",
		Path:  "/",
	})

	// Get the original cookie
	originalCookies := resp.Header()["Set-Cookie"]
	originalCookie := originalCookies[0]

	// Apply the SecureCookieFilter
	SecureCookieFilter(ctx)

	// Check that the non-session cookie wasn't modified
	newCookies := resp.Header()["Set-Cookie"]
	if len(newCookies) != 1 {
		t.Fatalf("Expected 1 cookie, got %d", len(newCookies))
	}

	newCookie := newCookies[0]
	if newCookie != originalCookie {
		t.Errorf("Non-session cookie should not be modified.\nOriginal: %s\nNew: %s", originalCookie, newCookie)
	}
}
