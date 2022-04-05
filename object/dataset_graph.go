package object

import (
	"fmt"
	"math"
)

func GetDatasetGraph(id string) *Graph {
	dataset := GetDataset(id)
	if dataset == nil {
		return nil
	}

	g := generateGraph(dataset.Vectors)
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

	g := newGraph()

	for _, vector := range vectors {
		g.addNode(vector.Name, vector.Name, 10, "red", "")
	}

	for i := 0; i < len(vectors); i++ {
		for j := i + 1; j < len(vectors); j++ {
			v1 := vectors[i]
			v2 := vectors[j]
			distance := getDistance(v1, v2)
			g.addLink(fmt.Sprintf("%s_%s", v1.Name, v2.Name), v1.Name, v2.Name, int(distance), "green", "")
		}
	}

	return g
}
