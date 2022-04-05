package object

import (
	"fmt"
	"math"
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

func generateGraph(vectors []*Vector) *Graph {
	vectors = refineVectors(vectors)
	vectors = vectors[:100]

	g := newGraph()

	nodeColor := "rgb(232,67,62)"
	for _, vector := range vectors {
		g.addNode(vector.Name, vector.Name, 2, nodeColor, "")
	}

	for i := 0; i < len(vectors); i++ {
		for j := i + 1; j < len(vectors); j++ {
			v1 := vectors[i]
			v2 := vectors[j]
			distance := int(getDistance(v1, v2))
			if distance >= 16 {
				continue
			}

			linkValue := (1*(distance-7) + 10*(15-distance)) / 8
			color := "rgb(44,160,44,0.6)"
			fmt.Printf("[%s] - [%s]: distance = %d, linkValue = %d\n", v1.Name, v2.Name, distance, linkValue)
			g.addLink(fmt.Sprintf("%s_%s", v1.Name, v2.Name), v1.Name, v2.Name, linkValue, color, "")
		}
	}

	return g
}
