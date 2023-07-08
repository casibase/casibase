package object

import (
	"fmt"
	"image/color"
	"math"
	"strconv"

	"github.com/casbin/casibase/util"
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

	if len(wordset.Vectors) == 0 {
		return nil, nil
	}

	allZero := true
	for _, vector := range wordset.Vectors {
		if len(vector.Data) != 0 {
			allZero = false
			break
		}
	}
	if allZero {
		return nil, nil
	}

	runKmeans(wordset.Vectors, clusterNumber)

	g = generateGraph(wordset.Vectors, distanceLimit)
	//graphCache[cacheId] = g
	return g, nil
}

func getDistance(v1 *Vector, v2 *Vector) float64 {
	res := 0.0
	for i := range v1.Data {
		res += (v1.Data[i] - v2.Data[i]) * (v1.Data[i] - v2.Data[i])
	}
	return math.Sqrt(res)
}

func refineVectors(vectors []*Vector) []*Vector {
	res := []*Vector{}
	for _, vector := range vectors {
		if len(vector.Data) > 0 {
			res = append(res, vector)
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

func generateGraph(vectors []*Vector, distanceLimit int) *Graph {
	vectors = refineVectors(vectors)
	//vectors = vectors[:100]

	g := newGraph()
	g.Nodes = []*Node{}
	g.Links = []*Link{}

	nodeWeightMap := map[string]int{}
	for i := 0; i < len(vectors); i++ {
		for j := i + 1; j < len(vectors); j++ {
			v1 := vectors[i]
			v2 := vectors[j]
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

	for _, vector := range vectors {
		//value := 5
		value := int(math.Sqrt(float64(nodeWeightMap[vector.Name]))) + 3
		weight := nodeWeightMap[vector.Name]

		//nodeColor := "rgb(232,67,62)"
		//nodeColor := getNodeColor(value)
		nodeColor := vector.Color

		fmt.Printf("Node [%s]: weight = %d, nodeValue = %d\n", vector.Name, nodeWeightMap[vector.Name], value)
		g.addNode(vector.Name, vector.Name, value, nodeColor, vector.Category, weight)
	}

	return g
}
