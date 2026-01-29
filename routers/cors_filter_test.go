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
	"testing"

	"github.com/beego/beego/context"
	"github.com/casibase/casibase/conf"
)

func TestCorsFilter_NoOriginHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/health", nil)
	resp := httptest.NewRecorder()

	ctx := context.NewContext()
	ctx.Reset(resp, req)

	CorsFilter(ctx)

	// Should not set CORS headers when no Origin header is present
	if resp.Header().Get(headerAllowOrigin) != "" {
		t.Error("CORS headers should not be set when Origin header is missing")
	}
}

func TestCorsFilter_NullOrigin(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/health", nil)
	req.Header.Set(headerOrigin, "null")
	resp := httptest.NewRecorder()

	ctx := context.NewContext()
	ctx.Reset(resp, req)

	CorsFilter(ctx)

	// Should not set CORS headers for null origin
	if resp.Header().Get(headerAllowOrigin) != "" {
		t.Error("CORS headers should not be set for null origin")
	}
}

func TestCorsFilter_UnauthorizedOrigin_WithoutCasdoor(t *testing.T) {
	// Save original config values
	originalEndpoint := conf.GetConfigString("casdoorEndpoint")
	originalApp := conf.GetConfigString("casdoorApplication")

	// Clear Casdoor config to test backwards compatibility mode
	// We need to unset environment variables to simulate missing config
	defer func() {
		// Restore original config if it was set
		if originalEndpoint != "" {
			t.Setenv("casdoorEndpoint", originalEndpoint)
		}
		if originalApp != "" {
			t.Setenv("casdoorApplication", originalApp)
		}
	}()
	
	// Unset the environment variables for this test
	t.Setenv("casdoorEndpoint", "")
	t.Setenv("casdoorApplication", "")

	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/health", nil)
	req.Header.Set(headerOrigin, "https://evil.com")
	resp := httptest.NewRecorder()

	ctx := context.NewContext()
	ctx.Reset(resp, req)

	CorsFilter(ctx)

	// In backwards compatibility mode (no Casdoor config), should allow the origin
	allowOrigin := resp.Header().Get(headerAllowOrigin)
	allowCredentials := resp.Header().Get(headerAllowCredentials)

	if allowOrigin != "https://evil.com" {
		t.Errorf("Expected Access-Control-Allow-Origin to be 'https://evil.com', got '%s'", allowOrigin)
	}

	if allowCredentials != "true" {
		t.Errorf("Expected Access-Control-Allow-Credentials to be 'true', got '%s'", allowCredentials)
	}

	// Should not return forbidden status
	if resp.Code == http.StatusForbidden {
		t.Error("Should not return 403 in backwards compatibility mode")
	}
}

func TestCorsFilter_OptionsRequest(t *testing.T) {
	// Clear Casdoor config to test backwards compatibility mode
	t.Setenv("casdoorEndpoint", "")
	t.Setenv("casdoorApplication", "")

	req := httptest.NewRequest(http.MethodOptions, "http://example.com/api/health", nil)
	req.Header.Set(headerOrigin, "https://allowed.com")
	resp := httptest.NewRecorder()

	ctx := context.NewContext()
	ctx.Reset(resp, req)

	CorsFilter(ctx)

	// Verify CORS headers are set for OPTIONS requests (preflight)
	if resp.Header().Get(headerAllowOrigin) != "https://allowed.com" {
		t.Error("CORS headers should be set for OPTIONS preflight requests")
	}

	// Verify response code for OPTIONS
	if resp.Code != http.StatusOK {
		t.Errorf("Expected status OK for OPTIONS request, got %d", resp.Code)
	}
}

func TestCorsFilter_AllCorsHeaders(t *testing.T) {
	// Clear Casdoor config to test backwards compatibility mode
	t.Setenv("casdoorEndpoint", "")
	t.Setenv("casdoorApplication", "")

	req := httptest.NewRequest(http.MethodGet, "http://example.com/api/health", nil)
	req.Header.Set(headerOrigin, "https://allowed.com")
	resp := httptest.NewRecorder()

	ctx := context.NewContext()
	ctx.Reset(resp, req)

	CorsFilter(ctx)

	// Verify all CORS headers are set correctly
	tests := []struct {
		header   string
		expected string
	}{
		{headerAllowOrigin, "https://allowed.com"},
		{headerAllowMethods, "GET, POST, DELETE, PUT, PATCH, OPTIONS"},
		{headerAllowHeaders, "Origin, X-Requested-With, Content-Type, Accept"},
		{headerExposeHeaders, "Content-Length"},
		{headerAllowCredentials, "true"},
	}

	for _, tt := range tests {
		got := resp.Header().Get(tt.header)
		if got != tt.expected {
			t.Errorf("Header %s: expected '%s', got '%s'", tt.header, tt.expected, got)
		}
	}
}
