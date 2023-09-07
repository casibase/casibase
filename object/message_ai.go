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

package object

import "fmt"

func GetRefinedQuestion(knowledge string, question string) string {
	if knowledge == "" {
		return question
	}

	return fmt.Sprintf(`paragraph: %s

You are a reading comprehension expert. Please answer the following questions based on the provided content. The content may be in a different language from the questions, so you need to understand the content according to the language of the questions and ensure that your answers are translated into the same language as the questions:
Q1: %s`, knowledge, question)
}
