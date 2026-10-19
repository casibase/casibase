// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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
	"regexp"
	"strings"

	"github.com/beego/beego"
	"github.com/the-open-agent/openagent/i18n"
	"github.com/the-open-agent/openagent/object"
	"github.com/the-open-agent/openagent/util"
)

func getRefinedModelErrorText(lang string, errorText string) string {
	if !strings.Contains(errorText, "DataInspectionFailed") && !strings.Contains(errorText, "data_inspection_failed") {
		return errorText
	}

	return fmt.Sprintf("%s\n\n%s",
		i18n.Translate(lang, "message_answer:Content safety review failed: the model platform flagged this conversation (the question, the agent's prompt and knowledge base, or the generated answer) as possibly inappropriate and refused to answer. This is often a false positive, so please rephrase and try again. If it keeps happening, ask an administrator to check this agent's knowledge base."),
		fmt.Sprintf(i18n.Translate(lang, "message_answer:Original error: %s"), errorText))
}

func writeMessageErrorStream(responseWriter http.ResponseWriter, lang string, message *object.Message, errorText string) error {
	errorText = getRefinedModelErrorText(lang, errorText)
	var err error
	if message != nil {
		if !message.IsAlerted {
			err = message.SendErrorEmail(errorText, lang)
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

			if chatErr := clearMessageChatGenerating(message); chatErr != nil {
				errorText = fmt.Sprintf("%s\n%s", errorText, chatErr.Error())
			}
		}
	}

	// SSE requires newlines in data to be escaped as "\ndata: " so the event
	// is not prematurely terminated (a blank line ends an SSE event).
	sseData := strings.ReplaceAll(errorText, "\n", "\ndata: ")
	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", sseData)
	_, err = responseWriter.Write([]byte(event))
	if err != nil {
		return err
	}

	if flusher, ok := responseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return nil
}

func clearMessageChatGenerating(message *object.Message) error {
	chatId := util.GetId(message.Owner, message.Chat)
	chat, err := object.GetChat(chatId)
	if err != nil {
		return err
	}
	if chat == nil {
		return fmt.Errorf("chat %s not found", chatId)
	}

	chat.IsGenerating = false
	_, err = object.UpdateChat(chatId, chat)
	return err
}

func writeInfoStream(responseWriter http.ResponseWriter, infoText string) error {
	event := fmt.Sprintf("event: myinfo\ndata: %s\n\n", infoText)
	_, err := responseWriter.Write([]byte(event))
	if err != nil {
		return err
	}
	if flusher, ok := responseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return nil
}

// writeGuardrailStream replaces the answer already streamed to the page: a
// refusal when the guardrail blocked it, or the text with personal data masked.
func writeGuardrailStream(responseWriter http.ResponseWriter, message *object.Message) error {
	payload, err := json.Marshal(map[string]interface{}{
		"text":        message.Text,
		"reasonText":  message.ReasonText,
		"suggestions": message.Suggestions,
		"guardrail":   message.Guardrail,
	})
	if err != nil {
		return err
	}
	_, err = responseWriter.Write([]byte(fmt.Sprintf("event: guardrail\ndata: %s\n\n", payload)))
	if err != nil {
		return err
	}
	if flusher, ok := responseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return nil
}

func writeStatusStream(responseWriter http.ResponseWriter, statusText string) error {
	sseData := strings.ReplaceAll(statusText, "\n", "\ndata: ")
	event := fmt.Sprintf("event: status\ndata: %s\n\n", sseData)
	_, err := responseWriter.Write([]byte(event))
	if err != nil {
		return err
	}
	if flusher, ok := responseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return nil
}

func writeChatUpdateStream(responseWriter http.ResponseWriter, chat *object.Chat) error {
	if chat == nil {
		return nil
	}

	payload, err := json.Marshal(map[string]interface{}{
		"owner":       chat.Owner,
		"name":        chat.Name,
		"displayName": chat.DisplayName,
		"needTitle":   chat.NeedTitle,
	})
	if err != nil {
		return err
	}

	_, err = responseWriter.Write([]byte(fmt.Sprintf("event: chat\ndata: %s\n\n", payload)))
	if err != nil {
		return err
	}
	if flusher, ok := responseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return nil
}

func (c *ApiController) ResponseErrorStream(message *object.Message, errorText string) {
	if err := writeMessageErrorStream(c.Ctx.ResponseWriter, c.GetAcceptLanguage(), message, errorText); err != nil {
		c.ResponseError(err.Error())
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

func RefineMessageImage(message *object.Message, lang string) error {
	imgRegex := regexp.MustCompile(`<img[^>]*src="([^"]*)"[^>]*>`)
	srcMatches := imgRegex.FindStringSubmatch(message.Text)
	if len(srcMatches) <= 1 {
		return fmt.Errorf(i18n.Translate(lang, "no image url found"))
	}
	imageUrl := srcMatches[1]

	extRegex := regexp.MustCompile(`\.([a-zA-Z]+)\?`)
	extMatches := extRegex.FindStringSubmatch(imageUrl)
	if len(extMatches) <= 1 {
		return fmt.Errorf(i18n.Translate(lang, "no extension found"))
	}
	ext := extMatches[1]

	// The URL comes from model output, which a prompt can steer, so internal addresses are refused.
	resp, err := util.GetUntrustedUrl(imageUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, util.UntrustedFetchMaxBytes))
	if err != nil {
		return err
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	res := fmt.Sprintf("data:image/%s;base64,%s", ext, base64Data)
	message.Text = fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", res)
	message.FileName = message.Name + "." + ext
	return nil
}

func tryStoreRemoteImage(message *object.Message, host string, lang string) {
	origin := getOriginFromHost(host)
	// DALL·E etc.: remote image URL in <img src="http...">
	if strings.Contains(message.Text, "<img src=\"http") {
		if err := storeImage(message, origin, lang); err != nil {
			beego.Info(fmt.Sprintf("tryStoreRemoteImage(): failed to upload image to CDN for message %s: %s", message.GetId(), err.Error()))
		}
		return
	}
	// gpt-image and similar: inline data URL (tryStoreRemoteImage previously skipped these)
	if strings.Contains(message.Text, ";base64,") && strings.Contains(message.Text, "data:") {
		if err := storeInlineBase64Images(message, origin, lang); err != nil {
			beego.Info(fmt.Sprintf("tryStoreRemoteImage(): failed to upload inline base64 image to CDN for message %s: %s", message.GetId(), err.Error()))
		}
	}
}

func storeImage(message *object.Message, origin string, lang string) error {
	err := RefineMessageImage(message, lang)
	if err != nil {
		return err
	}
	err = object.RefineMessageFiles(message, origin, lang)
	if err != nil {
		return err
	}
	_, err = object.UpdateMessage(message.GetId(), message, false)
	if err != nil {
		return err
	}
	return nil
}

func storeInlineBase64Images(message *object.Message, origin string, lang string) error {
	err := object.RefineMessageFiles(message, origin, lang)
	if err != nil {
		return err
	}
	_, err = object.UpdateMessage(message.GetId(), message, false)
	return err
}
