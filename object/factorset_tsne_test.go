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

package object

import (
	"fmt"
	"testing"
)

func TestDoFactorsetTsne(t *testing.T) {
	InitConfig()

	dimension := 50

	// factorset := getFactorset("admin", "wikipedia")
	factorset, _ := getFactorset("admin", "wordFactor_utf-8")
	factorset.LoadFactors("../../tmpFiles/")
	factorset.DoTsne(dimension)

	factorset.Name = fmt.Sprintf("%s_Dim_%d", factorset.Name, dimension)
	factorset.FileName = fmt.Sprintf("%s_Dim_%d.csv", factorset.FileName, dimension)
	factorset.FileSize = ""
	factorset.Dimension = dimension
	factorset.WriteFactors("../../tmpFiles/")
	AddFactorset(factorset)
}
