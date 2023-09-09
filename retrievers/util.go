package retrievers

import "math"

func GetNearestVectorIndex(target []float32, vectors [][]float32) int {
	targetNorm := norm(target)

	var res int
	max := float32(-1.0)
	for i, vector := range vectors {
		similarity := cosineSimilarity(target, vector, targetNorm)
		if similarity > max {
			max = similarity
			res = i
		}
	}
	return res
}

func cosineSimilarity(vec1, vec2 []float32, vec1Norm float32) float32 {
	dotProduct := dot(vec1, vec2)
	vec2Norm := norm(vec2)
	if vec2Norm == 0 {
		return 0.0
	}
	return dotProduct / (vec1Norm * vec2Norm)
}

func dot(vec1, vec2 []float32) float32 {
	if len(vec1) != len(vec2) {
		panic("Vector lengths do not match")
	}

	dotProduct := float32(0.0)
	for i := range vec1 {
		dotProduct += vec1[i] * vec2[i]
	}
	return dotProduct
}

func norm(vec []float32) float32 {
	normSquared := float32(0.0)
	for _, val := range vec {
		normSquared += val * val
	}
	return float32(math.Sqrt(float64(normSquared)))
}
