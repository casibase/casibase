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
)

func TestCacheControlFilterOnSensitiveEndpoints(t *testing.T) {
	// Test sensitive endpoints that should have no-cache headers
	sensitiveEndpoints := []string{
		"/api/get-node-tunnel?width=test&height=test&dpi=test&connectionId=test&username=test&password=test",
		"/api/get-chats?user=test&field=test&value=test",
		"/api/get-Messages?user=test&chat=test",
	}

	for _, endpoint := range sensitiveEndpoints {
		t.Run(endpoint, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "https://example.com"+endpoint, nil)
			resp := httptest.NewRecorder()

			ctx := context.NewContext()
			ctx.Reset(resp, req)

			CacheControlFilter(ctx)

			// Check Cache-Control header
			cacheControl := resp.Header().Get("Cache-Control")
			expectedCacheControl := "no-store, no-cache, must-revalidate, max-age=0"
			if cacheControl != expectedCacheControl {
				t.Errorf("Expected Cache-Control header '%s', got '%s'", expectedCacheControl, cacheControl)
			}

			// Check Pragma header
			pragma := resp.Header().Get("Pragma")
			expectedPragma := "no-cache"
			if pragma != expectedPragma {
				t.Errorf("Expected Pragma header '%s', got '%s'", expectedPragma, pragma)
			}

			// Check Expires header
			expires := resp.Header().Get("Expires")
			expectedExpires := "0"
			if expires != expectedExpires {
				t.Errorf("Expected Expires header '%s', got '%s'", expectedExpires, expires)
			}
		})
	}
}

func TestCacheControlFilterNotSetOnNonSensitiveEndpoints(t *testing.T) {
	// Test non-sensitive endpoints that should NOT have no-cache headers
	nonSensitiveEndpoints := []string{
		"/api/health",
		"/api/get-account",
		"/api/get-videos",
		"/api/get-stores",
		"/",
		"/swagger/",
	}

	for _, endpoint := range nonSensitiveEndpoints {
		t.Run(endpoint, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "https://example.com"+endpoint, nil)
			resp := httptest.NewRecorder()

			ctx := context.NewContext()
			ctx.Reset(resp, req)

			CacheControlFilter(ctx)

			// Check that Cache-Control header is NOT set
			cacheControl := resp.Header().Get("Cache-Control")
			if cacheControl != "" {
				t.Errorf("Cache-Control header should not be set on non-sensitive endpoint %s, got '%s'", endpoint, cacheControl)
			}

			// Check that Pragma header is NOT set
			pragma := resp.Header().Get("Pragma")
			if pragma != "" {
				t.Errorf("Pragma header should not be set on non-sensitive endpoint %s, got '%s'", endpoint, pragma)
			}

			// Check that Expires header is NOT set
			expires := resp.Header().Get("Expires")
			if expires != "" {
				t.Errorf("Expires header should not be set on non-sensitive endpoint %s, got '%s'", endpoint, expires)
			}
		})
	}
}

func TestCacheControlFilterWithDifferentHTTPMethods(t *testing.T) {
	methods := []string{
		http.MethodGet,
		http.MethodPost,
		http.MethodPut,
		http.MethodDelete,
	}

	endpoint := "/api/get-node-tunnel"

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "https://example.com"+endpoint, nil)
			resp := httptest.NewRecorder()

			ctx := context.NewContext()
			ctx.Reset(resp, req)

			CacheControlFilter(ctx)

			// Check that Cache-Control header is set regardless of HTTP method
			cacheControl := resp.Header().Get("Cache-Control")
			expectedCacheControl := "no-store, no-cache, must-revalidate, max-age=0"
			if cacheControl != expectedCacheControl {
				t.Errorf("Expected Cache-Control header '%s' for method %s, got '%s'", expectedCacheControl, method, cacheControl)
			}
		})
	}
}
