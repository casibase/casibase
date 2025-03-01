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

package controllers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/txt"
)

func (c *ApiController) ResponseErrorStream(message *object.Message, errorText string) {
	var err error
	if message != nil {
		if !message.IsAlerted {
			err = message.SendErrorEmail(errorText)
			if err != nil {
				errorText = fmt.Sprintf("%s\n%s", errorText, err.Error())
			}
		}

		if message.ErrorText != errorText || !message.IsAlerted || err != nil {
			message.ErrorText = errorText
			message.IsAlerted = true
			_, err = object.UpdateMessage(message.GetId(), message, false)
			if err != nil {
				errorText = fmt.Sprintf("%s\n%s", errorText, err.Error())
			}
		}
	}

	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", errorText)
	_, err = c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func refineQuestionTextViaParsingUrlContent(question string) (string, error) {
	re := regexp.MustCompile(`href="([^"]+)"`)
	urls := re.FindStringSubmatch(question)
	if len(urls) == 0 {
		return question, nil
	}

	href := urls[1]
	ext := filepath.Ext(href)
	content, err := txt.GetParsedTextFromUrl(href, ext)
	if err != nil {
		return "", err
	}

	aTag := regexp.MustCompile(`<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?</a>`)
	res := aTag.ReplaceAllString(question, content)
	return res, nil
}

func ConvertMessageDataToJSON(data string) ([]byte, error) {
	jsonData := map[string]string{"text": data}
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, err
	}
	return jsonBytes, nil
}

var divider = "|||"

func getQuestionWithSuggestions(question string, count int) (string, error) {
	if count <= 0 {
		return question, nil
	}

	format := "<Your answer>"
	for i := 0; i < count; i++ {
		format += divider + "<Predicted question " + string(rune(i+1)) + ">"
	}

	question = "Please follow the steps below to optimize your answer:\n\n" +
		"1. **Generate an answer**: Provide a clear, accurate, and helpful answer to the user's question.\n\n" +
		"2. **Predict possible follow-up questions from the user**: Based on the current question and answer, think and predict three questions that the user might ask further.\n\n" +
		"3. **Format the answer and predicted questions**: Use a specific format to connect the answer and the predicted questions. The format is as follows:\n" +
		"   - Follow the answer with a separator `" + divider + "`\n" +
		"   - Then there are the predicted " + string(rune(count)) + " questions, each separated by `" + divider + "`, do not add any other symbols.\n\n" +
		"Your answer should be replied in the following format: " + format + "\n\n" +
		"The '<>' is to tell you to put something in here, your answer does not need to include '<>'.\n" +
		"The language of suggestions should be the same as the language of answer" +
		"Every Predicted question should end with a question mark '?'.\n\n" +
		"Please note, the separator for each part is `" + divider + "`, make sure not to use this separator in the answer or question.\n\n" +
		"Examples of generated predicted questions:\n1. Do you know the weather today?\n2. Do you have any news to share?\n\n" +
		"Here is the user's question: " + question

	return question, nil
}

func parseAnswerAndSuggestions(answer string) (string, []object.Suggestion, error) {
	parts := strings.Split(answer, divider)

	suggestions := []object.Suggestion{}

	if len(parts) < 2 {
		return answer, suggestions, nil
	}

	for i := 1; i < len(parts); i++ {
		suggestions = append(suggestions, object.Suggestion{Text: formatSuggestion(parts[i]), IsHit: false})
	}

	return parts[0], suggestions, nil
}

func formatSuggestion(suggestionText string) string {
	suggestionText = strings.TrimSpace(suggestionText)
	suggestionText = strings.TrimPrefix(suggestionText, "<")
	suggestionText = strings.TrimSuffix(suggestionText, `>`)
	if !(strings.HasSuffix(suggestionText, "?") || strings.HasSuffix(suggestionText, "？")) {
		suggestionText += "?"
	}
	return suggestionText
}

func RefineMessageImage(message *object.Message) error {
	imgRegex := regexp.MustCompile(`<img[^>]*src="([^"]*)"[^>]*>`)
	srcMatches := imgRegex.FindStringSubmatch(message.Text)
	if len(srcMatches) <= 1 {
		return fmt.Errorf("no image url found")
	}
	imageUrl := srcMatches[1]

	extRegex := regexp.MustCompile(`\.([a-zA-Z]+)\?`)
	extMatches := extRegex.FindStringSubmatch(imageUrl)
	if len(extMatches) <= 1 {
		return fmt.Errorf("no extension found")
	}
	ext := extMatches[1]

	resp, err := http.Get(imageUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	res := fmt.Sprintf("data:image/%s;base64,%s", ext, base64Data)
	message.Text = fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", res)
	message.FileName = message.Name + "." + ext
	return nil
}

func storeImage(message *object.Message, origin string) error {
	err := RefineMessageImage(message)
	if err != nil {
		return err
	}
	err = object.RefineMessageFiles(message, origin)
	if err != nil {
		return err
	}
	_, err = object.UpdateMessage(message.GetId(), message, false)
	if err != nil {
		return err
	}
	return nil
}
