// Copyright 2023 The casbin Authors. All Rights Reserved.
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

package split

import "errors"

type ConvolutionalSplitProvider struct {
	WindowSize int
	Stride     int
	Padding    int
}

func NewConvolutionalSplitProvider(windowSize, stride, padding int) (*ConvolutionalSplitProvider, error) {
	if windowSize <= 0 || stride <= 0 || padding < 0 {
		return nil, errors.New("invalid parameters for ConvolutionalSplitProvider")
	}
	return &ConvolutionalSplitProvider{WindowSize: windowSize, Stride: stride, Padding: padding}, nil
}

func (p *ConvolutionalSplitProvider) SplitText(text string) ([]string, error) {
	if len(text) == 0 {
		return nil, errors.New("input string is empty")
	}

	if p.WindowSize > len(text) {
		return nil, errors.New("window size is greater than input string length")
	}

	res := make([]string, 0, (len(text)-p.WindowSize+p.Stride)/p.Stride+1)

	// Ensure that the slice length is not more than the window length
	if p.Stride > p.WindowSize {
		p.Stride = p.WindowSize
	}

	padding := p.Padding
	for i := -padding; i <= len(text)-p.WindowSize+padding; i += p.Stride {
		start := i
		end := i + p.WindowSize

		// Ensure 'start' and 'end' are within valid range
		if start < 0 {
			start = 0
		}
		if end > len(text) {
			end = len(text)
			start = end - p.WindowSize
		}

		substring := text[start:end]
		res = append(res, substring)
	}

	return res, nil
}
