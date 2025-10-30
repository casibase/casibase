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
	"strings"

	"github.com/beego/beego/context"
)

// CacheControlFilter adds Cache-Control headers to prevent caching of sensitive API endpoints
// This ensures that sensitive data (like passwords, user chats, messages) are not cached
// by intermediary proxies, SSL terminators, or browsers
func CacheControlFilter(ctx *context.Context) {
	path := ctx.Request.URL.Path

	// List of sensitive endpoints that should not be cached
	sensitiveEndpoints := []string{
		"/api/get-node-tunnel", // Contains password parameters
		"/api/get-chats",       // Contains user sensitive data
		"/api/get-Messages",    // Contains user chat messages
	}

	// Check if current path matches any sensitive endpoint
	for _, endpoint := range sensitiveEndpoints {
		if strings.HasPrefix(path, endpoint) {
			// Set Cache-Control header to prevent caching
			// - no-store: prevents any caching
			// - no-cache: requires revalidation before using cached response
			// - must-revalidate: forces revalidation of stale cache
			// - max-age=0: sets expiration time to zero
			ctx.Output.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
			// Set Pragma header for HTTP/1.0 compatibility
			ctx.Output.Header("Pragma", "no-cache")
			// Set Expires header to prevent caching in older browsers
			ctx.Output.Header("Expires", "0")
			break
		}
	}
}
