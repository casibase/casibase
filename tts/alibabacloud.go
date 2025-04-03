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

package tts

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/WqyJh/go-cosyvoice"
)

type AlibabacloudTextToSpeechProvider struct {
	typ        string
	subType    string
	secretKey  string
	voice      string
	format     cosyvoice.Format
	sampleRate cosyvoice.SampleRate
}

func NewAlibabacloudTextToSpeechProvider(typ string, subType string, secretKey string, voice string) (*AlibabacloudTextToSpeechProvider, error) {
	return &AlibabacloudTextToSpeechProvider{
		typ:        typ,
		subType:    subType,
		secretKey:  secretKey,
		voice:      voice,
		format:     cosyvoice.FormatMP3,
		sampleRate: cosyvoice.SampleRate16000,
	}, nil
}

func (p *AlibabacloudTextToSpeechProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/developer-reference/cosyvoice-large-model-for-speech-synthesis/
TTS models:

|    Models         |    Per 1,000 tokens  |
|-------------------|----------------------|
|    cosyvoice-v1   |   0.2 yuan/1k token  |   
`
}

func (p *AlibabacloudTextToSpeechProvider) calculatePrice(res *TextToSpeechResult) error {
	priceTable := map[string]float64{
		"cosyvoice-v1": 0.2,
	}
	if priceItem, ok := priceTable[p.subType]; ok {
		res.Price = getPrice(res.TokenCount, priceItem)
		res.Currency = "CNY"
		return nil
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}
}

func (p *AlibabacloudTextToSpeechProvider) prepareRequest(text string) (*TextToSpeechResult, cosyvoice.SynthesizerConfig, *cosyvoice.Client) {
	res := &TextToSpeechResult{
		TokenCount: countCharacters(text),
		Price:      0.0,
		Currency:   "",
	}

	synthConfig := cosyvoice.SynthesizerConfig{
		Model:      cosyvoice.Model(p.subType),
		Voice:      cosyvoice.Voice(p.voice),
		Format:     p.format,
		SampleRate: p.sampleRate,
	}

	client := cosyvoice.NewClient(p.secretKey)

	return res, synthConfig, client
}

func (p *AlibabacloudTextToSpeechProvider) QueryAudio(text string, ctx context.Context) ([]byte, *TextToSpeechResult, error) {
	res, synthConfig, client := p.prepareRequest(text)

	// Create AsyncSynthesizer with custom config
	asyncSynthesizer, err := client.AsyncSynthesizer(ctx,
		cosyvoice.WithSynthesizerConfig(synthConfig),
	)
	if err != nil {
		return nil, res, fmt.Errorf("error creating synthesizer: %v", err)
	}
	defer asyncSynthesizer.Close()

	// Run task
	output, err := asyncSynthesizer.RunTask(ctx)
	if err != nil {
		return nil, res, fmt.Errorf("error running task: %v", err)
	}

	// Create a channel to collect audio data
	audioChannel := make(chan []byte, 1)
	errorChannel := make(chan error, 1)

	// Launch a goroutine to continuously read from the output channel
	go func() {
		var allAudio []byte
		for outputResult := range output {
			if outputResult.Err != nil {
				errorChannel <- fmt.Errorf("output error: %v", outputResult.Err)
				return
			}
			allAudio = append(allAudio, outputResult.Data...)
		}
		audioChannel <- allAudio
	}()

	// Send text to synthesizer
	err = asyncSynthesizer.SendText(ctx, text)
	if err != nil {
		return nil, res, fmt.Errorf("error sending text: %v", err)
	}

	// Finish task
	err = asyncSynthesizer.FinishTask(ctx)
	if err != nil {
		return nil, res, fmt.Errorf("error finishing task: %v", err)
	}

	// Wait for either audio data or an error
	select {
	case audioBytes := <-audioChannel:
		if err := p.calculatePrice(res); err != nil {
			return audioBytes, res, err
		}
		return audioBytes, res, nil
	case err := <-errorChannel:
		return nil, res, err
	case <-ctx.Done():
		return nil, res, ctx.Err()
	}
}

func (p *AlibabacloudTextToSpeechProvider) QueryAudioStream(text string, ctx context.Context, writer io.Writer) (*TextToSpeechResult, error) {
	res, synthConfig, client := p.prepareRequest(text)

	// Create AsyncSynthesizer with custom config
	asyncSynthesizer, err := client.AsyncSynthesizer(ctx,
		cosyvoice.WithSynthesizerConfig(synthConfig),
	)
	if err != nil {
		return res, fmt.Errorf("error creating synthesizer: %v", err)
	}
	defer asyncSynthesizer.Close()

	// Run task
	output, err := asyncSynthesizer.RunTask(ctx)
	if err != nil {
		return res, fmt.Errorf("error running task: %v", err)
	}

	var streamErr error
	// Setup communication channels based on mode
	var errChan chan error

	// Check if writer supports Flush
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	// Error channel for streaming mode
	errChan = make(chan error, 1)

	// Launch goroutine to handle streaming
	go func() {
		for outputResult := range output {
			if outputResult.Err != nil {
				errChan <- outputResult.Err
				return
			}

			// Encode audio data to base64
			base64Data := base64.StdEncoding.EncodeToString(outputResult.Data)

			// Create event data JSON
			event := map[string]interface{}{
				"type": "audio",
				"data": base64Data,
			}

			jsonData, err := json.Marshal(event)
			if err != nil {
				errChan <- err
				return
			}

			// Send event to client
			_, err = fmt.Fprintf(writer, "event: chunk\ndata: %s\n\n", jsonData)
			if err != nil {
				errChan <- err
				return
			}

			flusher.Flush()
		}

		// Send end event
		endEvent := map[string]string{"type": "end"}
		jsonEnd, err := json.Marshal(endEvent)
		if err != nil {
			errChan <- err
			return
		}

		_, err = fmt.Fprintf(writer, "event: end\ndata: %s\n\n", string(jsonEnd))
		if err != nil {
			errChan <- err
			return
		}
		flusher.Flush()

		errChan <- nil
	}()

	// Launch goroutine to collect audio data
	if err = asyncSynthesizer.SendText(ctx, text); err != nil {
		return res, fmt.Errorf("error sending text: %v", err)
	}

	// Finish task
	if err = asyncSynthesizer.FinishTask(ctx); err != nil {
		return res, fmt.Errorf("error finishing task: %v", err)
	}

	// Wait for streaming to finish
	if streamErr = <-errChan; streamErr != nil {
		return nil, streamErr
	}

	// Calculate price
	if err := p.calculatePrice(res); err != nil {
		return res, err
	}

	return res, nil
}
