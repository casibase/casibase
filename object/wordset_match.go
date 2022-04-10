package object

func GetWordsetMatch(id string) *Wordset {
	wordset := GetWordset(id)
	if wordset == nil {
		return nil
	}

	vectorset := getVectorset(wordset.Owner, wordset.Vectorset)
	if vectorset == nil {
		return nil
	}

	vectorset.LoadVectors("")

	for _, vector := range wordset.Vectors {
		if trueVector, ok := vectorset.VectorMap[vector.Name]; ok {
			vector.Data = trueVector.Data
		} else {
			vector.Data = []float64{}
		}
	}

	UpdateWordset(wordset.GetId(), wordset)
	return wordset
}
