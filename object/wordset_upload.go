package object

import (
	"github.com/casbin/casibase/util"
	"github.com/casbin/casibase/xlsx"
)

func uploadVectorNames(owner string, fileId string) (bool, error) {
	table := xlsx.ReadXlsxFile(fileId)

	vectorMap := map[string]int{}
	vectors := []*Vector{}
	for _, line := range table {
		if _, ok := vectorMap[line[0]]; ok {
			continue
		} else {
			vectorMap[line[0]] = 1
		}

		vector := &Vector{
			Name: line[0],
			Data: []float64{},
		}
		vectors = append(vectors, vector)
	}

	wordset := &Wordset{
		Owner:         owner,
		Name:          "word",
		CreatedTime:   util.GetCurrentTime(),
		DisplayName:   "word",
		DistanceLimit: 14,
		Vectors:       vectors,
	}
	return AddWordset(wordset)
}
