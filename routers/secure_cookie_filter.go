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

// SecureCookieFilter ensures all cookies have the Secure flag set
// This is necessary when running behind a reverse proxy that handles HTTPS
func SecureCookieFilter(ctx *context.Context) {
	// This filter runs after the response is written
	// It modifies the Set-Cookie header to add the Secure flag

	// Get all Set-Cookie headers
	cookies := ctx.ResponseWriter.Header()["Set-Cookie"]

	// Process each cookie
	for i, cookie := range cookies {
		// Check if Secure flag is already present
		if !strings.Contains(cookie, "Secure") && !strings.Contains(cookie, "secure") {
			// Add Secure flag
			// The cookie format is: name=value; attributes
			cookies[i] = cookie + "; Secure"
		}
	}

	// Update the headers
	if len(cookies) > 0 {
		ctx.ResponseWriter.Header()["Set-Cookie"] = cookies
	}
}
