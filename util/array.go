package util

import "fmt"

func FloatsToStrings(floatArray []float64) []string {
	res := []string{}
	for _, f := range floatArray {
		res = append(res, fmt.Sprintf("%f", f))
	}
	return res
}

func StringsToFloats(stringArray []string) []float64 {
	res := []float64{}
	for _, s := range stringArray {
		res = append(res, ParseFloat(s))
	}
	return res
}
