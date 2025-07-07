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
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/proxy"
	"github.com/casibase/casibase/util"
)

const (
	paperDirs             = "../files"
	modelProviderName     = "claude"
	embeddingProviderName = "openai"
	StorageProviderName   = "provider_80welg"
	readQuestionsFile     = "multi_choice_questions.json"
	answeredQuestionsFile = "multi_choice_questions.json"
)

func TestProcessPapers(t *testing.T) {
	object.InitConfig()
	proxy.InitHttpClient()
	filesProcessed := 0
	processedQuestions := make(map[string]bool)
	var questionsData []map[string]interface{}

	questionsBytes, err := os.ReadFile(readQuestionsFile)
	if err != nil {
		fmt.Println(err)
		return
	}

	err = json.Unmarshal(questionsBytes, &questionsData)
	if err != nil {
		panic(err)
	}

	paperDirs, err := os.ReadDir(paperDirs)
	if err != nil {
		panic(err)
	}

	for _, paperDir := range paperDirs {
		if !paperDir.IsDir() {
			continue
		}

		paperId := paperDir.Name()
		fmt.Printf("processing folder: %s\n", paperId)

		store, err := createStore(paperId)
		if err != nil {
			panic(err)
		}
		fmt.Printf("created store for paper %s: %s\n", paperId, store.Name)

		// refresh vectors
		_, err = object.RefreshStoreVectors(store)
		if err != nil {
			panic(err)
		}

		for i := range questionsData {
			question := questionsData[i]
			if question["paper_id"].(string) == paperId && !processedQuestions[generateQuestionKey(question)] && question["correct_answer"].(string) == "" {
				questionText := question["question"].(string)
				text := "Please follow these instructions strictly:\n" +
					"1. Your answer must be based only on the information provided in the paper." +
					"2. If this is a multiple-choice question, reply with only the letters of all correct options (e.g., ABC), and do not include any other words, explanations, or punctuation." +
					"Question:\n" + questionText
				fmt.Printf("sending question: %s\n", questionText)
				answer, _, err := sendMessage(store, text, modelProviderName, embeddingProviderName)
				if err != nil {
					fmt.Printf("failed to send message: %v\n", err)
					break
				}

				correctAnswer := cleanAnswer(answer)
				fmt.Printf("received answer: %s\n", correctAnswer)
				questionsData[i]["correct_answer"] = correctAnswer
				processedQuestions[generateQuestionKey(question)] = true
			}
		}
		filesProcessed++
	}

	outputBytes, err := json.MarshalIndent(questionsData, "", "    ")
	if err != nil {
		panic(err)
	}

	err = os.WriteFile(answeredQuestionsFile, outputBytes, 0o644)
	if err != nil {
		panic(err)
	}

	fmt.Printf("processed %d markdown files, answered %d questions\n", filesProcessed, len(processedQuestions))
}

func createStore(paperId string) (*object.Store, error) {
	storeName := fmt.Sprintf("store_%s", paperId)
	if err := deleteExistingStore(storeName); err != nil {
		return nil, fmt.Errorf("failed to delete existing store: %v", err)
	}

	currentTime := util.GetCurrentTime()
	store := &object.Store{
		Owner:                "admin",
		Name:                 storeName,
		CreatedTime:          currentTime,
		DisplayName:          fmt.Sprintf("Paper Store - %s", paperId),
		Title:                fmt.Sprintf("Paper %s Assistant", paperId),
		Avatar:               "https://cdn.casibase.com/static/favicon.png",
		StorageProvider:      StorageProviderName,
		StorageSubpath:       paperId,
		SplitProvider:        "Default",
		ModelProvider:        modelProviderName,
		EmbeddingProvider:    embeddingProviderName,
		SearchProvider:       "Hierarchy",
		TextToSpeechProvider: "Browser Built-In",
		SpeechToTextProvider: "Browser Built-In",
		AgentProvider:        "",
		Frequency:            10000,
		MemoryLimit:          10,
		LimitMinutes:         15,
		Welcome:              "Hello",
		WelcomeTitle:         fmt.Sprintf("Hello, this is the Paper %s Assistant", paperId),
		WelcomeText:          "I'm here to help answer your questions about this paper",
		Prompt:               "You are an expert in analyzing papers and you specialize in answering questions based on the paper content.",
		KnowledgeCount:       15,
		SuggestionCount:      3,
		ThemeColor:           "#5734d3",
		IsDefault:            false,
		State:                "Active",
	}

	_, err := object.AddStore(store)
	return store, err
}

func generateQuestionKey(question map[string]interface{}) string {
	return question["paper_id"].(string) + ":" + question["question"].(string)
}
