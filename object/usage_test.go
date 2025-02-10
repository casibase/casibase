// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
	"fmt"
	"testing"
)

func TestGetUsage(t *testing.T) {
	InitConfig()

	usage, err := GetUsage("")
	if err != nil {
		panic(err)
	}

	fmt.Printf("GetUsage result: %+v\n", usage)
}

func TestGetUsages(t *testing.T) {
	InitConfig()

	usages, err := GetUsages(30)
	if err != nil {
		panic(err)
	}

	fmt.Println("GetUsages results:")
	for _, usage := range usages {
		fmt.Printf("%+v\n", usage)
	}
}

func TestGetRangeUsages(t *testing.T) {
	InitConfig()

	// usages, err := GetRangeUsages("Month", 6)
	usages, err := GetRangeUsages("Week", 12)
	// usages, err := GetRangeUsages("Day", 30)
	// usages, err := GetRangeUsages("Hour", 168)
	if err != nil {
		panic(err)
	}

	fmt.Println("GetRangeUsages results:")
	for _, usage := range usages {
		fmt.Printf("%+v\n", usage)
	}
}
