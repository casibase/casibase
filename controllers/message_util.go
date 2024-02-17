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

package controllers

import (
	"encoding/json"
	"fmt"
	"strings"
)

func (c *ApiController) ResponseErrorStream(errorText string) {
	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", errorText)
	_, err := c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func ConvertMessageDataToJSON(data string) ([]byte, error) {
	jsonData := map[string]string{"text": data}
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, err
	}
	return jsonBytes, nil
}

func PromptProcessing(question string) string {
	var builder strings.Builder
	var promptPrefix string = `Give you a message, you should give me a JSON contains "text prompt", "image prompt" and "relation", no other information. The language should be the same as the message's language type. Text prompt is information about text generating, image prompt is information about image generating, both of them should be described as detailed as possible but not add additional information randomly. And relation has three values "image first", "text first", "none". If request in "text prompt" depends on an image in "image first" firstly, then relation is "image first", if request in "image prompt" depends on text in "text prompt" firstly, then relation is "text first", if image is independent of text, then relation is "none". Message is "`
	builder.WriteString(promptPrefix)
	builder.WriteString(question)
	builder.WriteString(`"`)
	str := builder.String()
	return str
}

func ConvertJSONToPrompt(prompt string) (Prompt, error) {
	if strings.HasPrefix(prompt, "```json\n") && strings.HasSuffix(prompt, "\n```") {
		prompt = strings.TrimPrefix(prompt, "```json\n")
		prompt = strings.TrimSuffix(prompt, "\n```")
	} else if !strings.HasPrefix(prompt, "{\n") && !strings.HasSuffix(prompt, "\n}") {
		return Prompt{}, fmt.Errorf("incorrect prompt")
	}

	var promptJSON Prompt

	err := json.Unmarshal([]byte(prompt), &promptJSON)
	if err != nil {
		return Prompt{}, err
	}

	fmt.Printf("Parsed Prompt struct: %+v\n", promptJSON)

	return promptJSON, nil
}

func promptConcatenate(prompt string, preAnswer string) string {
	var builder strings.Builder
	builder.WriteString(prompt)
	builder.WriteString(preAnswer)
	str := builder.String()
	return str
}
