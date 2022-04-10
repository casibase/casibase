package object

import (
	"fmt"
	"strings"

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

	wordset := &Wordset{
		Owner:       owner,
		Name:        "word",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "word",
		Distance:    100,
		Vectors:     vectors,
	}
	return AddWordset(wordset)
}

func parseVectorData(s string) []float64 {
	s = strings.TrimLeft(s, "[")
	s = strings.TrimRight(s, "]")
	s = strings.ReplaceAll(s, "\n", "")

	tokens := strings.Split(s, " ")
	res := []float64{}
	for _, token := range tokens {
		if token == "" {
			continue
		}

		f := util.ParseFloat(token)
		res = append(res, f)
	}
	return res
}

func readVectorData(fileId string) []*Vector {
	path := util.GetUploadCsvPath(fileId)

	rows := [][]string{}
	util.LoadCsvFile(path, &rows)

	vectors := []*Vector{}
	for _, row := range rows {
		if row[0] == "" {
			continue
		}

		vector := &Vector{
			Name: row[1],
			Data: parseVectorData(row[2]),
		}
		if len(vector.Data) != 128 {
			panic(fmt.Errorf("invalid vector data length: %d, vector = %v", len(vector.Data), vector))
		}

		vectors = append(vectors, vector)
	}
	return vectors
}

func updateWordsetVectors(owner string, wordsetName string, vectors []*Vector) {
	wordset := getWordset(owner, wordsetName)

	vectorMap := map[string]*Vector{}
	for _, v := range wordset.Vectors {
		vectorMap[v.Name] = v
	}

	for _, vector := range vectors {
		if v, ok := vectorMap[vector.Name]; ok {
			v.Data = vector.Data
		}
	}

	UpdateWordset(wordset.GetId(), wordset)
}
