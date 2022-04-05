package object

import (
	"github.com/casbin/casbase/util"
	"github.com/casbin/casbase/xlsx"
)

func uploadVectorNames(owner string, fileId string) bool {
	table := xlsx.ReadXlsxFile(fileId)

	vectors := []*Vector{}
	for _, line := range table {
		vector := &Vector{
			Name: line[0],
			Data: []float64{},
		}
		vectors = append(vectors, vector)
	}

	dataset := &Dataset{
		Owner:       owner,
		Name:        "word",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "word",
		Distance:    100,
		Vectors:     vectors,
	}
	return AddDataset(dataset)
}
