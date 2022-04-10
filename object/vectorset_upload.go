package object

import (
	"fmt"

	"github.com/casbin/casbase/util"
)

func (vectorset *Vectorset) LoadVectors(pathPrefix string) {
	path := util.GetUploadFilePath(fmt.Sprintf("%s%s", pathPrefix, vectorset.FileName))

	nameArray, dataArray := util.LoadVectorFileBySpace(path)

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
