package util

import "fmt"

func FloatsToStrings(floatArray []float64) []string {
	res := []string{}
	for _, f := range floatArray {
		res = append(res, fmt.Sprintf("%f", f))
	}
	return res
}
