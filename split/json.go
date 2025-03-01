// Copyright 2024 The casbin Authors. All Rights Reserved.
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

import (
	"encoding/json"
	"fmt"

	"github.com/casibase/casibase/model"
)

// JsonSplitProvider structure
type JsonSplitProvider struct{}

// NewJsonSplitProvider creates a new instance of JsonSplitProvider
func NewJsonSplitProvider() (*JsonSplitProvider, error) {
	return &JsonSplitProvider{}, nil
}

// SplitText method splits the JSON text into parts
func (p *JsonSplitProvider) SplitText(text string) ([]string, error) {
	const maxLength = 210
	sections := []string{}

	// Verify that the input is a valid JSON
	var jsonData interface{}
	if err := json.Unmarshal([]byte(text), &jsonData); err != nil {
		return nil, fmt.Errorf("invalid JSON input: %v", err)
	}

	switch v := jsonData.(type) {
	case []interface{}:
		return p.splitArray(v, maxLength)
	case map[string]interface{}:
		return p.splitObject(v, maxLength)
	default:
		sections = append(sections, text)
	}

	return sections, nil
}

// splitArray handles JSON arrays
func (p *JsonSplitProvider) splitArray(arr []interface{}, maxLength int) ([]string, error) {
	sections := []string{}
	currentSection := []interface{}{}

	for _, item := range arr {
		currentSectionJson, err := json.Marshal(currentSection)
		if err != nil {
			return nil, err
		}

		itemJson, err := json.Marshal(item)
		if err != nil {
			return nil, err
		}

		tokenSize, err := model.GetTokenSize("gpt-3.5-turbo", string(currentSectionJson)+string(itemJson))
		if err != nil {
			return nil, err
		}

		if tokenSize <= maxLength {
			currentSection = append(currentSection, item)
		} else {
			if len(currentSection) > 0 {
				sectionJson, err := json.Marshal(currentSection)
				if err != nil {
					return nil, err
				}
				sections = append(sections, string(sectionJson))
				currentSection = []interface{}{item}
			} else {
				sections = append(sections, string(itemJson))
			}
		}
	}

	if len(currentSection) > 0 {
		sectionJson, err := json.Marshal(currentSection)
		if err != nil {
			return nil, err
		}
		sections = append(sections, string(sectionJson))
	}

	return sections, nil
}

// splitObject handles JSON objects
func (p *JsonSplitProvider) splitObject(obj map[string]interface{}, maxLength int) ([]string, error) {
	sections := []string{}
	currentSection := make(map[string]interface{})

	for key, value := range obj {
		currentSectionJson, err := json.Marshal(currentSection)
		if err != nil {
			return nil, err
		}

		tempSection := make(map[string]interface{})
		tempSection[key] = value
		tempJson, err := json.Marshal(tempSection)
		if err != nil {
			return nil, err
		}

		tokenSize, err := model.GetTokenSize("gpt-3.5-turbo", string(currentSectionJson)+string(tempJson))
		if err != nil {
			return nil, err
		}

		if tokenSize <= maxLength {
			currentSection[key] = value
		} else {
			if len(currentSection) > 0 {
				sectionJson, err := json.Marshal(currentSection)
				if err != nil {
					return nil, err
				}
				sections = append(sections, string(sectionJson))
				currentSection = make(map[string]interface{})
				currentSection[key] = value
			} else {
				sections = append(sections, string(tempJson))
			}
		}
	}

	if len(currentSection) > 0 {
		sectionJson, err := json.Marshal(currentSection)
		if err != nil {
			return nil, err
		}
		sections = append(sections, string(sectionJson))
	}

	return sections, nil
}
