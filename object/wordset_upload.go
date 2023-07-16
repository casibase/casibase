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
	"github.com/casbin/casibase/util"
	"github.com/casbin/casibase/xlsx"
)

func uploadVectorNames(owner string, fileId string) (bool, error) {
	table := xlsx.ReadXlsxFile(fileId)

	vectorMap := map[string]int{}
	vectors := []*Vector{}
	for _, line := range table {
		if _, ok := vectorMap[line[0]]; ok {
			continue
		} else {
			vectorMap[line[0]] = 1
		}

		vector := &Vector{
			Name: line[0],
			Data: []float64{},
		}
		vectors = append(vectors, vector)
	}

	wordset := &Wordset{
		Owner:         owner,
		Name:          "word",
		CreatedTime:   util.GetCurrentTime(),
		DisplayName:   "word",
		DistanceLimit: 14,
		Vectors:       vectors,
	}
	return AddWordset(wordset)
}
