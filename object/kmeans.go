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
	"strconv"
	"strings"

	"github.com/casibase/casibase/util"
	"github.com/muesli/clusters"
	"github.com/muesli/kmeans"
)

func fa2Str(floatArray []float64) string {
	sData := []string{}
	for _, f := range floatArray {
		sData = append(sData, fmt.Sprintf("%f", f))
	}
	return strings.Join(sData, "|")
}

func runKmeans(factors []*Factor, clusterNumber int) {
	factorMap := map[string]*Factor{}

	var d clusters.Observations
	for _, factor := range factors {
		if len(factor.Data) == 0 {
			continue
		}

		dataKey := factor.GetDataKey()
		factorMap[dataKey] = factor

		d = append(d, clusters.Coordinates(factor.Data))
	}

	km := kmeans.New()
	cs, err := km.Partition(d, clusterNumber)
	if err != nil {
		panic(err)
	}

	for i, c := range cs {
		fmt.Printf("Centered at x: %.2f y: %.2f\n", c.Center[0], c.Center[1])
		fmt.Printf("Matching data points: %+v\n\n", c.Observations)

		color := util.GetRandomColor()
		for _, observation := range c.Observations {
			floatArray := observation.Coordinates()
			dataKey := fa2Str(floatArray)

			factor, ok := factorMap[dataKey]
			if !ok {
				panic(fmt.Errorf("factorMap factor not found, dataKey = %s", dataKey))
			}
			factor.Category = strconv.Itoa(i)
			factor.Color = color
		}
	}
}

func updateWordsetFactorCategories(owner string, wordsetName string) {
	wordset, _ := getWordset(owner, wordsetName)

	runKmeans(wordset.Factors, 100)

	UpdateWordset(wordset.GetId(), wordset)
}
