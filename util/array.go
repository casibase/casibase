// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package util

import "fmt"

func FloatsToStrings(floatArray []float64) []string {
	res := []string{}
	for _, f := range floatArray {
		res = append(res, fmt.Sprintf("%f", f))
	}
	return res
}

func StringsToFloats(stringArray []string) []float64 {
	res := []float64{}
	for _, s := range stringArray {
		res = append(res, ParseFloat(s))
	}
	return res
}
