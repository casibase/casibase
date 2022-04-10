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
	for i := 0; i < 100; i++ {
		if i >= len(nameArray) {
			break
		}

		vector := &Vector{
			Name: nameArray[i],
			Data: dataArray[i],
		}

		exampleVectors = append(exampleVectors, vector)
	}

	vectorset.Vectors = exampleVectors
}
