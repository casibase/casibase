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

package service

import "time"

func getLocalTimestamp(input string) string {
	if input == "" {
		return ""
	}

	const inputFormat = "2006-01-02T15:04Z"
	utcTime, err := time.Parse(inputFormat, input)
	if err != nil {
		panic(err)
	}

	res := utcTime.Local().Format(time.RFC3339)
	return res
}
