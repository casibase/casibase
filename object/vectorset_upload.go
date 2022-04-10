package object

import (
	"fmt"

	"github.com/casbin/casbase/util"
)

func (vectorset *Vectorset) LoadVectors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, vectorset.FileName))

	rows := [][]string{}
	util.LoadSpaceFile(path, &rows)

	exampleVectors := []*Vector{}
	for i, row := range rows {
		if i == 0 {
			continue
		}

		vectorData := []float64{}
		for _, token := range row[1:] {
			vectorData = append(vectorData, util.ParseFloat(token))
		}

		vector := &Vector{
			Name: row[0],
			Data: vectorData,
		}
		if len(vector.Data) != vectorset.Dimension {
			panic(fmt.Errorf("invalid vector data length: %d, expected = %d", len(vector.Data), vectorset.Dimension))
		}

		exampleVectors = append(exampleVectors, vector)

		if len(exampleVectors) == 100 {
			break
		}
	}

	vectorset.Vectors = exampleVectors
}
