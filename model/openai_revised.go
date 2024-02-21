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

package model

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/sashabaranov/go-openai"
)

type openaiRefinedModelProvider struct {
	typ              string
	subType          string
	secretKey        string
	temperature      float32
	topP             float32
	frequencyPenalty float32
	presencePenalty  float32
}

func NewOpenAiRevisedModelProvider(typ string, subType string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32) (*openaiRefinedModelProvider, error) {
	p := &openaiRefinedModelProvider{
		typ:              typ,
		subType:          subType,
		secretKey:        secretKey,
		temperature:      temperature,
		topP:             topP,
		frequencyPenalty: frequencyPenalty,
		presencePenalty:  presencePenalty,
	}
	return p, nil
}

func getAnswer(question string, p *openaiRefinedModelProvider, modelProvider string, writer io.Writer, writerUsed bool) (string, error) {
	client := getOpenAiClientFromToken(p.secretKey)
	ctx := context.Background()

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return "", fmt.Errorf("writer does not implement http.Flusher")
	}

	model := modelProvider
	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty
	maxTokens := getOpenAiMaxTokens(model)

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	if modelProvider == "dall-e-3" && writerUsed {
		reqUrl := openai.ImageRequest{
			Prompt:         question,
			Model:          openai.CreateImageModelDallE3,
			Size:           openai.CreateImageSize1024x1024,
			ResponseFormat: openai.CreateImageResponseFormatURL,
			N:              1,
		}
		respUrl, err := client.CreateImage(ctx, reqUrl)
		if err != nil {
			fmt.Printf("Image creation error: %v\n", err)
			return "", err
		}
		url := fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", respUrl.Data[0].URL)
		fmt.Fprint(writer, url)
		flusher.Flush()
		return url, nil
	}

	emptyHistory := []*RawMessage{}
	emptyKnowledge := []*RawMessage{}

	rawMessages, err := generateMessages("", question, emptyHistory, emptyKnowledge, model, maxTokens)
	if err != nil {
		return "", err
	}
	var messages []openai.ChatCompletionMessage
	messages, err = rawMessagesToGPT4VisionMessages(rawMessages)
	if err != nil {
		return "", err
	}
	respStream, err := client.CreateChatCompletionStream(
		ctx,
		ChatCompletionRequest(model, messages, temperature, topP, frequencyPenalty, presencePenalty),
	)
	if err != nil {
		return "", err
	}
	defer respStream.Close()

	// 接收流转成字符串
	var answer string
	isLeadingReturn := true
	for {
		completion, streamErr := respStream.Recv()
		if streamErr != nil {
			if streamErr == io.EOF {
				break
			}
			return "", streamErr
		}

		if len(completion.Choices) == 0 {
			continue
		}
		data := completion.Choices[0].Delta.Content
		if isLeadingReturn && len(data) != 0 {
			if strings.Count(data, "\n") == len(data) {
				continue
			} else {
				isLeadingReturn = false
			}
		}
		answer += data

		if writerUsed {
			err = flushData(data)
			if err != nil {
				return "", err
			}
		}
	}
	return answer, nil
}

func textFirst(textPrompt string, imagePrompt string, writer io.Writer, p *openaiRefinedModelProvider) error {
	textAnswer, err := getAnswer(textPrompt, p, "gpt-4-vision-preview", writer, true)
	if err != nil {
		return err
	}

	imagePrompt = promptConcatenate(imagePrompt, textAnswer)
	_, err = getAnswer(imagePrompt, p, "dall-e-3", writer, true)
	if err != nil {
		return err
	}

	return nil
}

func imageFirst(textPrompt string, imagePrompt string, writer io.Writer, p *openaiRefinedModelProvider) error {
	imageAnswer, err := getAnswer(imagePrompt, p, "dall-e-3", writer, true)
	if err != nil {
		return err
	}

	textPrompt = promptConcatenate(textPrompt, imageAnswer)
	_, err = getAnswer(textPrompt, p, "gpt-4-vision-preview", writer, true)
	if err != nil {
		return err
	}

	return nil
}

func noneRelation(textPrompt string, imagePrompt string, writer io.Writer, p *openaiRefinedModelProvider) error {
	_, err := getAnswer(textPrompt, p, "gpt-4-vision-preview", writer, true)
	if err != nil {
		return err
	}

	_, err = getAnswer(imagePrompt, p, "dall-e-3", writer, true)
	if err != nil {
		return err
	}

	return nil
}

func (p *openaiRefinedModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
	question = PromptProcessing(question)
	var promptStruct Prompt
	for {
		answer, err := getAnswer(question, p, "gpt-4-vision-preview", writer, false)
		if err != nil {
			return err
		}

		promptStruct, err = ConvertJSONToPrompt(answer)
		if err == nil {
			break
		}

		time.Sleep(2 * time.Second)
	}
	fmt.Println(promptStruct)

	switch promptStruct.Relation {
	case "image first":
		err := imageFirst(promptStruct.Text, promptStruct.Image, writer, p)
		if err != nil {
			return err
		}
	case "text first":
		err := textFirst(promptStruct.Text, promptStruct.Image, writer, p)
		if err != nil {
			return err
		}
	case "none":
		err := noneRelation(promptStruct.Text, promptStruct.Image, writer, p)
		if err != nil {
			return err
		}
	}

	return nil
}
