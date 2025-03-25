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
	"bytes"
	"context"
	"fmt"

	"github.com/WqyJh/go-cosyvoice"
)

type AlibabacloudTTSProvider struct {
	typ        string
	subType    string
	secretKey  string
	voice      string
	format     cosyvoice.Format
	sampleRate cosyvoice.SampleRate
}

func NewAlibabacloudTTSProvider(typ string, subType string, secretKey string, voice string) (*AlibabacloudTTSProvider, error) {
	return &AlibabacloudTTSProvider{
		typ:        typ,
		subType:    subType,
		secretKey:  secretKey,
		voice:      voice,
		format:     cosyvoice.FormatMP3,
		sampleRate: cosyvoice.SampleRate16000,
	}, nil
}

func (p *AlibabacloudTTSProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/developer-reference/cosyvoice-large-model-for-speech-synthesis/?spm=a2c4g.11186623.help-menu-2400256.d_3_3_7_0.49156474ZB4TlP
TTS models:

|    Models         |    Per 1,000 tokens  |
|-------------------|----------------------|
|    cosyvoice-v1   |   0.2 yuan/1k token  |   
`
}

func (p *AlibabacloudTTSProvider) calculatePrice(res *TTSResult) error {
	priceTable := map[string]float64{
		"cosyvoice-v1": 0.00024,
	}
	if priceItem, ok := priceTable[p.subType]; ok {
		res.Price = getPrice(res.TokenCount, priceItem)
		res.Currency = "CNY"
		return nil
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}
}

func (p *AlibabacloudTTSProvider) QuerySpeech(text string, ctx context.Context) ([]byte, *TTSResult, error) {
	res := &TTSResult{
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

	err = asyncSynthesizer.SendText(ctx, text)
	if err != nil {
		return nil, res, fmt.Errorf("error sending text: %v", err)
	}

	// Finish task
	err = asyncSynthesizer.FinishTask(ctx)
	if err != nil {
		return nil, res, fmt.Errorf("error finishing task: %v", err)
	}

	// Collect all audio data
	var buffer bytes.Buffer

	for outputResult := range output {
		if outputResult.Err != nil {
			return nil, res, fmt.Errorf("result error: %v", outputResult.Err)
		}

		buffer.Write(outputResult.Data)
	}

	audioData := buffer.Bytes()

	if err := p.calculatePrice(res); err != nil {
		return audioData, res, err
	}

	return audioData, res, nil
}
