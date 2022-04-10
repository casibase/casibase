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
		nameArray, dataArray = util.LoadVectorFileByCsv(path)
	} else {
		nameArray, dataArray = util.LoadVectorFileBySpace(path)
	}

	exampleVectors := []*Vector{}
	vectorMap := map[string]*Vector{}
	for i := 0; i < len(nameArray); i++ {
		vector := &Vector{
			Name: nameArray[i],
			Data: dataArray[i],
		}

		if i < 100 {
			exampleVectors = append(exampleVectors, vector)
		}
		vectorMap[vector.Name] = vector
	}

	vectorset.Vectors = exampleVectors
	vectorset.VectorMap = vectorMap
}
