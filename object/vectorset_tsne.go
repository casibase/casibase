package object

import (
	"fmt"

	"github.com/danaugrs/go-tsne/tsne"
	"gonum.org/v1/gonum/mat"
)

func testTsne() {
	b := mat.NewDense(5, 3, []float64{
		0.1, 0.1, 0.1,
		0.7, 0.7, 0.7,
		0.1, 0.7, 0.5,
		0.7, 0.1, 0.2,
		0.1, 0.7, 0.5,
	})

	t := tsne.NewTSNE(2, 300, 100, 300, true)

	Y := t.EmbedData(b, func(iter int, divergence float64, embedding mat.Matrix) bool {
		fmt.Printf("Iteration %d: divergence is %v\n", iter, divergence)
		return false
	})

	println(Y)
}

func (vectorset *Vectorset) DoTsne(dimension int) {
	floatArray := []float64{}
	for _, vector := range vectorset.AllVectors {
		floatArray = append(floatArray, vector.Data...)
	}

	X := mat.NewDense(len(vectorset.AllVectors), vectorset.Dimension, floatArray)

	t := tsne.NewTSNE(dimension, 300, 100, 300, true)

	Y := t.EmbedData(X, func(iter int, divergence float64, embedding mat.Matrix) bool {
		fmt.Printf("Iteration %d: divergence is %v\n", iter, divergence)
		return false
	})

	rowCount, columnCount := Y.Dims()
	if rowCount != len(vectorset.AllVectors) {
		panic("rowCount != len(vectorset.AllVectors)")
	}
	if columnCount != dimension {
		panic("columnCount != dimension")
	}

	for i, vector := range vectorset.AllVectors {
		arr := []float64{}
		for j := 0; j < dimension; j++ {
			arr = append(arr, Y.At(i, j))
		}
		vector.Data = arr
	}
}
