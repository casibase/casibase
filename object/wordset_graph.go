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
	"image/color"
	"math"
	"strconv"

	"github.com/casibase/casibase/util"
)

var graphCache map[string]*Graph

func init() {
	graphCache = map[string]*Graph{}
}

func GetWordsetGraph(id string, clusterNumber int, distanceLimit int) (*Graph, error) {
	cacheId := fmt.Sprintf("%s|%d|%d", id, clusterNumber, distanceLimit)

	g, ok := graphCache[cacheId]
	if ok {
		return g, nil
	}

	wordset, err := GetWordset(id)
	if err != nil {
		return nil, err
	}
	if wordset == nil {
		return nil, nil
	}

	if len(wordset.Factors) == 0 {
		return nil, nil
	}

	allZero := true
	for _, factor := range wordset.Factors {
		if len(factor.Data) != 0 {
			allZero = false
			break
		}
	}
	if allZero {
		return nil, nil
	}

	runKmeans(wordset.Factors, clusterNumber)

	g = generateGraph(wordset.Factors, distanceLimit)
	// graphCache[cacheId] = g
	return g, nil
}

func getDistance(v1 *Factor, v2 *Factor) float64 {
	res := 0.0
	for i := range v1.Data {
		res += (v1.Data[i] - v2.Data[i]) * (v1.Data[i] - v2.Data[i])
	}
	return math.Sqrt(res)
}

func refineFactors(factors []*Factor) []*Factor {
	res := []*Factor{}
	for _, factor := range factors {
		if len(factor.Data) > 0 {
			res = append(res, factor)
		}
	}
	return res
}

func getNodeColor(weight int) string {
	if weight > 10 {
		weight = 10
	}
	f := (10.0 - float64(weight)) / 10.0

	color1 := color.RGBA{R: 232, G: 67, B: 62}
	color2 := color.RGBA{R: 24, G: 144, B: 255}
	myColor := util.MixColor(color1, color2, f)
	return fmt.Sprintf("rgb(%d,%d,%d)", myColor.R, myColor.G, myColor.B)
}

func generateGraph(factors []*Factor, distanceLimit int) *Graph {
	factors = refineFactors(factors)
	// factors = factors[:100]

	g := newGraph()
	g.Nodes = []*GraphNode{}
	g.Links = []*Link{}

	nodeWeightMap := map[string]int{}
	for i := 0; i < len(factors); i++ {
		for j := i + 1; j < len(factors); j++ {
			v1 := factors[i]
			v2 := factors[j]
			distance := int(getDistance(v1, v2))
			if distance >= distanceLimit {
				continue
			}

			if v, ok := nodeWeightMap[v1.Name]; !ok {
				nodeWeightMap[v1.Name] = 1
			} else {
				nodeWeightMap[v1.Name] = v + 1
			}
			if v, ok := nodeWeightMap[v2.Name]; !ok {
				nodeWeightMap[v2.Name] = 1
			} else {
				nodeWeightMap[v2.Name] = v + 1
			}

			linkValue := (1*(distance-7) + 10*(distanceLimit-1-distance)) / (distanceLimit - 8)
			linkColor := "rgb(44,160,44,0.6)"
			linkName := fmt.Sprintf("Edge [%s] - [%s]: distance = %d, linkValue = %d", v1.Name, v2.Name, distance, linkValue)
			fmt.Println(linkName)
			g.addLink(linkName, v1.Name, v2.Name, linkValue, linkColor, strconv.Itoa(distance))
		}
	}

	for _, factor := range factors {
		// value := 5
		value := int(math.Sqrt(float64(nodeWeightMap[factor.Name]))) + 3
		weight := nodeWeightMap[factor.Name]

		// nodeColor := "rgb(232,67,62)"
		// nodeColor := getNodeColor(value)
		nodeColor := factor.Color

		fmt.Printf("Node [%s]: weight = %d, nodeValue = %d\n", factor.Name, nodeWeightMap[factor.Name], value)
		g.addNode(factor.Name, factor.Name, value, nodeColor, factor.Category, weight)
	}

	return g
}
