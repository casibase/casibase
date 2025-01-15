package embedding

import (
	"fmt"

	"github.com/gage-technologies/mistral-go"
)

type MistralEmbeddingProvider struct {
	typ          string
	subType      string
	clientId     string
	clientSecret string
	providerUrl  string
	apiVersion   string
	client       *mistral.MistralClient
}

func NewMistralEmbeddingProvider(typ, subType, clientId, clientSecret, providerUrl, apiVersion string) (*MistralEmbeddingProvider, error) {
	client := getMistralClientFromToken(clientSecret)

	p := &MistralEmbeddingProvider{
		typ:          typ,
		subType:      subType,
		clientId:     clientId,
		clientSecret: clientSecret,
		providerUrl:  providerUrl,
		apiVersion:   apiVersion,
		client:       client,
	}
	return p, nil
}

func getMistralClientFromToken(apiKey string) *mistral.MistralClient {
	client := mistral.NewMistralClientDefault(apiKey)
	return client
}

func (p *MistralEmbeddingProvider) GenerateEmbeddings(input []string) (*mistral.EmbeddingResponse, error) {
	if p.client == nil {
		return nil, ErrClientNotInitialized
	}

	response, err := p.client.Embeddings(p.clientId, input)
	if err != nil {
		return nil, err
	}
	return response, nil
}

var ErrClientNotInitialized = fmt.Errorf("MistralClient is not initialized")
