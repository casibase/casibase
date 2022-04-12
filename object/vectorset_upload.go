package object

import (
	"fmt"
	"strings"

	"github.com/casbin/casbase/util"
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
