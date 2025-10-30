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

func TestHstsFilter(t *testing.T) {
	// Create a mock HTTP request
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	resp := httptest.NewRecorder()

	// Create a Beego context
	ctx := context.NewContext()
	ctx.Reset(resp, req)

	// Apply the HSTS filter
	HstsFilter(ctx)

	// Check if the HSTS header is set correctly
	hstsHeader := resp.Header().Get("Strict-Transport-Security")
	expectedHeader := "max-age=31536000; includeSubDomains; preload"

	if hstsHeader != expectedHeader {
		t.Errorf("Expected HSTS header '%s', got '%s'", expectedHeader, hstsHeader)
	}
}

func TestHstsFilterOnMultipleRoutes(t *testing.T) {
	routes := []string{
		"/",
		"/api/",
		"/api/health",
		"/swagger/",
		"/storage/",
		"/api/chat/completions",
	}

	for _, route := range routes {
		t.Run(route, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, route, nil)
			resp := httptest.NewRecorder()

			ctx := context.NewContext()
			ctx.Reset(resp, req)

			HstsFilter(ctx)

			hstsHeader := resp.Header().Get("Strict-Transport-Security")
			if hstsHeader == "" {
				t.Errorf("HSTS header not set for route: %s", route)
			}

			expectedHeader := "max-age=31536000; includeSubDomains; preload"
			if hstsHeader != expectedHeader {
				t.Errorf("Route %s: Expected HSTS header '%s', got '%s'", route, expectedHeader, hstsHeader)
			}
		})
	}
}
