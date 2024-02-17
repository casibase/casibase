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
	"fmt"
	"strings"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
)

type Prompt struct {
	Text     string `json:"text prompt"`
	Image    string `json:"image prompt"`
	Relation string `json:"relation"`
}

func textFirst(textPrompt string, imagePrompt string, modelProviderObj model.ModelProvider, imageModelProviderObj model.ModelProvider, writer *RefinedWriter, imageModelProviderName string) error {
	emptyHistory := []*model.RawMessage{}
	emptyKnowledge := []*model.RawMessage{}

	err := modelProviderObj.QueryText(textPrompt, writer, emptyHistory, "", emptyKnowledge)
	if err != nil {
		return err
	}
	textAnswer := writer.String()
	textAnswer = strings.Trim(textAnswer, "\"")
	imagePrompt = promptConcatenate(imagePrompt, textAnswer)
	imageAnswer, err := object.GetAnswer(imageModelProviderName, imagePrompt)
	if err != nil {
		return err
	}

	imageAnswer = fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", imageAnswer)
	writer.buf = append(writer.buf, []byte(imageAnswer)...)
	jsonData, err := ConvertMessageDataToJSON(imageAnswer)
	if err != nil {
		return err
	}
	_, err = writer.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", jsonData)))
	if err != nil {
		return err
	}
	writer.Flush()
	fmt.Println(imageAnswer)

	return nil
}

func imageFirst(textPrompt string, imagePrompt string, modelProviderObj model.ModelProvider, imageModelProviderObj model.ModelProvider, writer *RefinedWriter, imageModelProviderName string) error {
	emptyHistory := []*model.RawMessage{}
	emptyKnowledge := []*model.RawMessage{}

	url, err := object.GetAnswer(imageModelProviderName, imagePrompt)
	if err != nil {
		return err
	}

	imageAnswer := fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", url)
	fmt.Println(imageAnswer)

	writer.buf = append(writer.buf, []byte(imageAnswer)...)
	jsonData, err := ConvertMessageDataToJSON(imageAnswer)
	if err != nil {
		return err
	}

	_, err = writer.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", jsonData)))
	if err != nil {
		return err
	}

	writer.Flush()

	textPrompt = promptConcatenate(textPrompt, imageAnswer)
	err = modelProviderObj.QueryText(textPrompt, writer, emptyHistory, "", emptyKnowledge)
	if err != nil {
		return err
	}

	return nil
}

func noneRelation(textPrompt string, imagePrompt string, modelProviderObj model.ModelProvider, imageModelProviderObj model.ModelProvider, writer *RefinedWriter, imageModelProviderName string) error {
	emptyHistory := []*model.RawMessage{}
	emptyKnowledge := []*model.RawMessage{}

	err := modelProviderObj.QueryText(textPrompt, writer, emptyHistory, "", emptyKnowledge)
	if err != nil {
		return err
	}

	imageAnswer, err := object.GetAnswer(imageModelProviderName, imagePrompt)
	if err != nil {
		return err
	}

	imageAnswer = fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", imageAnswer)
	fmt.Println(imageAnswer)

	writer.buf = append(writer.buf, []byte(imageAnswer)...)
	jsonData, err := ConvertMessageDataToJSON(imageAnswer)
	if err != nil {
		return err
	}
	_, err = writer.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", jsonData)))
	if err != nil {
		return err
	}
	writer.Flush()
	fmt.Println(imageAnswer)

	return nil
}

func getImageTextAnswer(promptStruct Prompt, modelProviderObj model.ModelProvider, imageModelProviderObj model.ModelProvider, writer *RefinedWriter, imageModelProviderName string) error {
	switch promptStruct.Relation {
	case "image first":
		err := imageFirst(promptStruct.Text, promptStruct.Image, modelProviderObj, imageModelProviderObj, writer, imageModelProviderName)
		if err != nil {
			return err
		}
	case "text first":
		err := textFirst(promptStruct.Text, promptStruct.Image, modelProviderObj, imageModelProviderObj, writer, imageModelProviderName)
		if err != nil {
			return err
		}
	case "none":
		err := noneRelation(promptStruct.Text, promptStruct.Image, modelProviderObj, imageModelProviderObj, writer, imageModelProviderName)
		if err != nil {
			return err
		}
	}
	return nil
}
