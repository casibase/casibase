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
	"fmt"
	"strings"

	"github.com/casbin/casibase/util"
)

func (vectorset *Vectorset) LoadVectors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, vectorset.FileName))

	var nameArray []string
	var dataArray [][]float64
	if strings.HasSuffix(vectorset.FileName, ".csv") {
		if strings.Contains(vectorset.FileName, "_Dim_") {
			nameArray, dataArray = util.LoadVectorFileByCsv2(path)
		} else {
			nameArray, dataArray = util.LoadVectorFileByCsv(path)
		}
	} else {
		nameArray, dataArray = util.LoadVectorFileBySpace(path)
	}

	exampleVectors := []*Vector{}
	vectors := []*Vector{}
	vectorMap := map[string]*Vector{}
	for i := 0; i < len(nameArray); i++ {
		vector := &Vector{
			Name: nameArray[i],
			Data: dataArray[i],
		}

		if i < 100 {
			exampleVectors = append(exampleVectors, vector)
		}
		vectors = append(vectors, vector)
		vectorMap[vector.Name] = vector
	}

	vectorset.Vectors = exampleVectors
	vectorset.AllVectors = vectors
	vectorset.VectorMap = vectorMap
}

func (vectorset *Vectorset) WriteVectors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, vectorset.FileName))

	rows := [][]string{}
	for _, vector := range vectorset.AllVectors {
		row := util.FloatsToStrings(vector.Data)
		row = append([]string{vector.Name}, row...)
		rows = append(rows, row)
	}

	util.WriteCsvFile(path, &rows)
}
