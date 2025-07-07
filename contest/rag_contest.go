// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package contest

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func deleteExistingStore(name string) error {
	fmt.Printf("checking if store exists: admin/%s\n", name)

	storeId := util.GetId("admin", name)
	store, err := object.GetStore(storeId)
	if err != nil {
		return err
	}

	if store == nil {
		fmt.Printf("store does not exist: admin/%s\n", name)
		return nil
	}

	fmt.Printf("found existing store, preparing to delete: admin/%s\n", name)

	_, err = object.DeleteStore(store)
	if err != nil {
		return err
	}

	fmt.Printf("successfully deleted store: admin/%s\n", name)
	return nil
}

func cleanAnswer(answer string) string {
	answer = strings.TrimSpace(answer)

	re := regexp.MustCompile(`^[ABCD]+$|^[ABCD](,[ABCD])*$|^[ABCD](-[ABCD])*$|^[ABCD]( [ABCD])*$`)

	if re.MatchString(answer) {
		answer = strings.ReplaceAll(answer, ",", "")
		answer = strings.ReplaceAll(answer, "-", "")
		answer = strings.ReplaceAll(answer, " ", "")
		return answer
	}

	// try to extract options from text
	re = regexp.MustCompile(`[ABCD]+`)
	matches := re.FindAllString(answer, -1)

	if len(matches) > 0 {
		var longestMatch string
		for _, match := range matches {
			if len(match) > len(longestMatch) {
				longestMatch = match
			}
		}
		return longestMatch
	}

	return answer
}

func sendMessage(store *object.Store, question string, modelProviderName string, embeddingProviderName string) (string, *model.ModelResult, error) {
	modelProvider, _, err := object.GetModelProviderFromContext("admin", modelProviderName)
	if err != nil {
		return "", nil, err
	}

	embeddingProvider, embeddingProviderObj, err := object.GetEmbeddingProviderFromContext("admin", embeddingProviderName)
	if err != nil {
		return "", nil, err
	}

	knowledge, _, _, err := object.GetNearestKnowledge(store.Name, store.SearchProvider, embeddingProvider, embeddingProviderObj, modelProvider, "admin", question, store.KnowledgeCount)
	if err != nil {
		return "", nil, err
	}
	history := []*model.RawMessage{}
	return object.GetAnswerWithContext(modelProviderName, question, history, knowledge, store.Prompt)
}
