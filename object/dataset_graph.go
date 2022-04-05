package object

import (
	"fmt"
	"image/color"
	"math"

	"github.com/casbin/casbase/util"
)

var graphCache map[string]*Graph

func init() {
	graphCache = map[string]*Graph{}
}

func GetDatasetGraph(id string) *Graph {
	g, ok := graphCache[id]
	if ok {
		return g
	}

	dataset := GetDataset(id)
	if dataset == nil {
		return nil
	}

	g = generateGraph(dataset.Vectors)
	graphCache[id] = g
	return g
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

func generateGraph(vectors []*Vector) *Graph {
	vectors = refineVectors(vectors)
	vectors = vectors[:100]

	g := newGraph()

	nodeWeightMap := map[string]int{}
	for i := 0; i < len(vectors); i++ {
		for j := i + 1; j < len(vectors); j++ {
			v1 := vectors[i]
			v2 := vectors[j]
			distance := int(getDistance(v1, v2))
			if distance >= 16 {
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

			linkValue := (1*(distance-7) + 10*(15-distance)) / 8
			linkColor := "rgb(44,160,44,0.6)"
			fmt.Printf("[%s] - [%s]: distance = %d, linkValue = %d\n", v1.Name, v2.Name, distance, linkValue)
			g.addLink(fmt.Sprintf("%s - %s", v1.Name, v2.Name), v1.Name, v2.Name, linkValue, linkColor, "")
		}
	}

	for _, vector := range vectors {
		//value := 5
		value := int(math.Sqrt(float64(nodeWeightMap[vector.Name]))) + 3

		//nodeColor := "rgb(232,67,62)"
		nodeColor := getNodeColor(value)

		g.addNode(vector.Name, vector.Name, value, nodeColor, "")
	}

	return g
}
