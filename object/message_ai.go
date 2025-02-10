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

import "fmt"

func GetRefinedQuestion(prompt string, knowledge string, question string) string {
	if knowledge == "" {
		return question
	}

	if prompt == "" {
		prompt = `You have some background knowledge: 

%s

Now, please answer the following question based on the provided information:

%s

(Please answer directly in the questioner's language without using phrases like "the answer is" or "the question is.". Empty answer is not allowed. If the text is not question, you should ask for a question politely.)`
	}

	return fmt.Sprintf(prompt, knowledge, question)
}
