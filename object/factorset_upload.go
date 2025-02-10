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
	"strings"

	"github.com/casibase/casibase/util"
)

func (factorset *Factorset) LoadFactors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, factorset.FileName))

	var nameArray []string
	var dataArray [][]float64
	if strings.HasSuffix(factorset.FileName, ".csv") {
		if strings.Contains(factorset.FileName, "_Dim_") {
			nameArray, dataArray = util.LoadFactorFileByCsv2(path)
		} else {
			nameArray, dataArray = util.LoadFactorFileByCsv(path)
		}
	} else {
		nameArray, dataArray = util.LoadFactorFileBySpace(path)
	}

	exampleFactors := []*Factor{}
	factors := []*Factor{}
	factorMap := map[string]*Factor{}
	for i := 0; i < len(nameArray); i++ {
		factor := &Factor{
			Name: nameArray[i],
			Data: dataArray[i],
		}

		if i < 100 {
			exampleFactors = append(exampleFactors, factor)
		}
		factors = append(factors, factor)
		factorMap[factor.Name] = factor
	}

	factorset.Factors = exampleFactors
	factorset.AllFactors = factors
	factorset.FactorMap = factorMap
}

func (factorset *Factorset) WriteFactors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, factorset.FileName))

	rows := [][]string{}
	for _, factor := range factorset.AllFactors {
		row := util.FloatsToStrings(factor.Data)
		row = append([]string{factor.Name}, row...)
		rows = append(rows, row)
	}

	util.WriteCsvFile(path, &rows)
}
