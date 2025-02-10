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

func GetWordsetMatch(id string) (*Wordset, error) {
	wordset, err := GetWordset(id)
	if err != nil {
		return nil, err
	}
	if wordset == nil {
		return nil, nil
	}

	factorset, err := getFactorset(wordset.Owner, wordset.Factorset)
	if err != nil {
		return nil, err
	}
	if factorset == nil {
		return nil, nil
	}

	factorset.LoadFactors("")

	for _, factor := range wordset.Factors {
		if trueFactor, ok := factorset.FactorMap[factor.Name]; ok {
			factor.Data = trueFactor.Data
		} else {
			factor.Data = []float64{}
		}
	}

	UpdateWordset(wordset.GetId(), wordset)
	return wordset, nil
}
