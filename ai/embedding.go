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

package ai

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/casbin/casibase/extractors"

	"github.com/sashabaranov/go-openai"
)

func ReadFileToString(fileUrl, fileName string) (string, error) {
	suffix := strings.ToLower(fileName[strings.LastIndex(fileName, "."):])

	var res string
	var err error

	switch suffix {
	case ".pdf":
		res, err = extractor.GetPdfTextFromUrl(fileUrl)
	case ".docx":
		res, err = extractor.GetDocxTextFromUrl(fileUrl)
	case ".md":
		res, err = extractor.GetMdTextFromUrl(fileUrl)
	case ".txt":
		res, err = extractor.GetMdTextFromUrl(fileUrl)
	default:
		return "", fmt.Errorf("unsupported file type: %s", suffix)
	}

	if err != nil {
		return "", fmt.Errorf("failed to extract text from %s: %v", suffix, err)
	}

	return res, nil
}

func SplitText(text string) []string {
	const maxLength = 210 * 3
	var res []string
	var temp string

	for _, line := range strings.Split(text, "\n") {
		if len(temp)+len(line) <= maxLength {
			temp += line
		} else {
			res = append(res, temp)
			temp = line
		}
	}

	if len(temp) > 0 {
		res = append(res, temp)
	}

	return res
}

func getEmbedding(authToken string, text string, timeout int) ([]float32, error) {
	client := getProxyClientFromToken(authToken)

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(30+timeout*2)*time.Second)
	defer cancel()

	resp, err := client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.AdaEmbeddingV2,
	})
	if err != nil {
		return nil, err
	}

	return resp.Data[0].Embedding, nil
}

func GetEmbeddingSafe(authToken string, text string) ([]float32, error) {
	var embedding []float32
	var err error
	for i := 0; i < 10; i++ {
		embedding, err = getEmbedding(authToken, text, i)
		if err != nil {
			if i > 0 {
				fmt.Printf("\tFailed (%d): %s\n", i+1, err.Error())
			}
		} else {
			break
		}
	}

	if err != nil {
		return nil, err
	} else {
		return embedding, nil
	}
}

func GetNearestVectorIndex(target []float32, vectors [][]float32) int {
	targetNorm := norm(target)

	var res int
	max := float32(-1.0)
	for i, vector := range vectors {
		similarity := cosineSimilarity(target, vector, targetNorm)
		if similarity > max {
			max = similarity
			res = i
		}
	}
	return res
}
