// Copyright 2023 The casbin Authors. All Rights Reserved.
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

package object

import (
	"encoding/base64"
	"fmt"
	"mime"
	"strings"
)

func getExtFromMimeType(mimeType string) (string, error) {
	exts, err := mime.ExtensionsByType(mimeType)
	if err != nil {
		return "", err
	}
	if len(exts) == 0 {
		return "", fmt.Errorf("getExtFromMimeType() error: unknown MimeType: %s", mimeType)
	}

	res := ""
	if strings.HasPrefix(exts[len(exts)-1], ".x-") && len(exts) > 1 {
		res = exts[len(exts)-2][1:]
	} else {
		res = exts[len(exts)-1][1:]
	}
	return res, nil
}

func parseBase64Image(data string) ([]byte, error) {
	parts := strings.SplitN(data, ";", 2)
	if len(parts) < 2 {
		return nil, fmt.Errorf("parseBase64Image() error: invalid image format")
	}

	b64Parts := strings.SplitN(parts[1], ",", 2)
	if len(b64Parts) < 2 {
		return nil, fmt.Errorf("parseBase64Image() error: invalid image format")
	}

	imageContent, err := base64.StdEncoding.DecodeString(b64Parts[1])
	if err != nil {
		return nil, err
	}

	return imageContent, nil
}
