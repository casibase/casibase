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

package image

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/casibase/casibase/proxy"
	openai "github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/packages/param"
)

type CustomTextToImageProvider struct {
	subType       string
	secretKey     string
	providerUrl   string
	pricePerImage float64
	currency      string
}

func NewCustomTextToImageProvider(subType string, secretKey string, providerUrl string, pricePerImage float64, currency string) (*CustomTextToImageProvider, error) {
	p := &CustomTextToImageProvider{
		subType:       subType,
		secretKey:     secretKey,
		providerUrl:   providerUrl,
		pricePerImage: pricePerImage,
		currency:      currency,
	}
	return p, nil
}

func (p *CustomTextToImageProvider) GetPricing() string {
	return fmt.Sprintf("$%.4f per image (%s)", p.pricePerImage, p.currency)
}

func (p *CustomTextToImageProvider) QueryImage(prompt string, writer io.Writer, lang string) (*TextToImageResult, error) {
	httpClient := proxy.ProxyHttpClient

	options := []option.RequestOption{
		option.WithHTTPClient(httpClient),
		option.WithAPIKey(p.secretKey),
	}
	if p.providerUrl != "" {
		options = append(options, option.WithBaseURL(p.providerUrl))
	}

	client := openai.NewClient(options...)

	ctx := context.Background()

	quality := openai.ImageGenerateParamsQualityStandard
	if p.subType == "dall-e-3" {
		quality = openai.ImageGenerateParamsQualityHD
	} else if p.subType == "dall-e-2" {
		quality = openai.ImageGenerateParamsQualityStandard
	}

	req := openai.ImageGenerateParams{
		Prompt:         prompt,
		Model:          p.subType,
		Size:           openai.ImageGenerateParamsSize1024x1024,
		ResponseFormat: openai.ImageGenerateParamsResponseFormatURL,
		Quality:        quality,
		N:              param.NewOpt[int64](1),
	}

	resp, err := client.Images.Generate(ctx, req)
	if err != nil {
		return nil, err
	}

	imgURL := resp.Data[0].URL
	imgHTML := fmt.Sprintf(`<img src="%s" width="100%%" height="auto">`, imgURL)
	_, err = fmt.Fprint(writer, imgHTML)
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if ok {
		flusher.Flush()
	}

	price := p.pricePerImage
	cur := p.currency
	if cur == "" {
		cur = "USD"
	}

	return &TextToImageResult{
		ImageCount: 1,
		Price:      price,
		Currency:   cur,
	}, nil
}
