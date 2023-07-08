package object

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/casbin/casibase/util"
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

func runKmeans(vectors []*Vector, clusterNumber int) {
	vectorMap := map[string]*Vector{}

	var d clusters.Observations
	for _, vector := range vectors {
		if len(vector.Data) == 0 {
			continue
		}

		dataKey := vector.GetDataKey()
		vectorMap[dataKey] = vector

		d = append(d, clusters.Coordinates(vector.Data))
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

			vector, ok := vectorMap[dataKey]
			if !ok {
				panic(fmt.Errorf("vectorMap vector not found, dataKey = %s", dataKey))
			}
			vector.Category = strconv.Itoa(i)
			vector.Color = color
		}
	}
}

func updateWordsetVectorCategories(owner string, wordsetName string) {
	wordset, _ := getWordset(owner, wordsetName)

	runKmeans(wordset.Vectors, 100)

	UpdateWordset(wordset.GetId(), wordset)
}
