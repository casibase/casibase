package ai

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/sashabaranov/go-openai"
)

func splitTxt(f io.ReadCloser) []string {
	const maxLength = 512 * 3
	scanner := bufio.NewScanner(f)
	var res []string
	var temp string

	for scanner.Scan() {
		line := scanner.Text()
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

func GetSplitTxt(f io.ReadCloser) []string {
	return splitTxt(f)
}

func getEmbedding(authToken string, input []string, timeout int) ([]float32, error) {
	client := getProxyClientFromToken(authToken)

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(30+timeout*2)*time.Second)
	defer cancel()

	resp, err := client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: input,
		Model: openai.AdaEmbeddingV2,
	})
	if err != nil {
		return nil, err
	}

	return resp.Data[0].Embedding, nil
}

func GetEmbeddingSafe(authToken string, input []string) []float32 {
	var embedding []float32
	var err error
	for i := 0; i < 10; i++ {
		embedding, err = getEmbedding(authToken, input, i)
		if err != nil {
			if i > 0 {
				fmt.Printf("\tFailed (%d): %s\n", i+1, err.Error())
			}
		} else {
			break
		}
	}
	if err != nil {
		panic(err)
	}

	return embedding
}
