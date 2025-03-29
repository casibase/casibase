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

package tts

import "math"

func getPrice(tokenCount int, pricePerThousandTokens float64) float64 {
	res := (float64(tokenCount) / 1000.0) * pricePerThousandTokens
	res = math.Round(res*1e8) / 1e8
	return res
}

func countCharacters(text string) int {
	count := 0
	for _, r := range text {
		if r >= 0x4E00 && r <= 0x9FFF {
			count += 2
		} else {
			count += 1
		}
	}
	return count
}
