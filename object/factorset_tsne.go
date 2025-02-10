// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

func (factorset *Factorset) DoTsne(dimension int) {
	floatArray := []float64{}
	for _, factor := range factorset.AllFactors {
		floatArray = append(floatArray, factor.Data...)
	}

	X := mat.NewDense(len(factorset.AllFactors), factorset.Dimension, floatArray)

	t := tsne.NewTSNE(dimension, 300, 100, 300, true)

	Y := t.EmbedData(X, func(iter int, divergence float64, embedding mat.Matrix) bool {
		fmt.Printf("Iteration %d: divergence is %v\n", iter, divergence)
		return false
	})

	rowCount, columnCount := Y.Dims()
	if rowCount != len(factorset.AllFactors) {
		panic("rowCount != len(factorset.AllFactors)")
	}
	if columnCount != dimension {
		panic("columnCount != dimension")
	}

	for i, factor := range factorset.AllFactors {
		arr := []float64{}
		for j := 0; j < dimension; j++ {
			arr = append(arr, Y.At(i, j))
		}
		factor.Data = arr
	}
}
