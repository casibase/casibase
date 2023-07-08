package object

func GetWordsetMatch(id string) (*Wordset, error) {
	wordset, err := GetWordset(id)
	if err != nil {
		return nil, err
	}
	if wordset == nil {
		return nil, nil
	}

	vectorset, err := getVectorset(wordset.Owner, wordset.Vectorset)
	if err != nil {
		return nil, err
	}
	if vectorset == nil {
		return nil, nil
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
	return wordset, nil
}
