package model

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
)

type LuminousModelProvider struct {
    subType     string
    apiKey      string
    temperature float32
    topP        float32
}

func NewLuminousModelProvider(subType string, apiKey string, temperature float32, topP float32) (*LuminousModelProvider, error) {
    return &LuminousModelProvider{
        subType:     subType,
        apiKey:      apiKey,
        temperature: temperature,
        topP:        topP,
    }, nil
}

func (p *LuminousModelProvider) GetPricing() string {
    return `URL:
https://docs.aleph-alpha.com/docs/pricing

| Model    | sub-type           | Input Price per 1K characters | Output Price per 1K characters |
|----------|--------------------|-------------------------------|--------------------------------|
| Luminous | Luminous2-Turbo    | 0.008yuan/1,000 tokens        | 0.008yuan/1,000 tokens         |
`
}

func (p *LuminousModelProvider) calculatePrice(modelResult *ModelResult) error {
   
    return nil
}

func (p *LuminousModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
    ctx := context.Background()
    flusher, ok := writer.(http.Flusher)
    if !ok {
        return nil, fmt.Errorf("writer does not implement http.Flusher")
    }

    url := "https://api.aleph-alpha.com/v1/completion"
    reqBody := map[string]interface{}{
        "model":       p.subType,
        "prompt":      question,
        "temperature": p.temperature,
        "top_p":       p.topP,
    }

    jsonBody, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonBody)))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+p.apiKey)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    modelResult := &ModelResult{}
    if err := json.NewDecoder(resp.Body).Decode(modelResult); err != nil {
        return nil, err
    }

    modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount
    if err := p.calculatePrice(modelResult); err != nil {
        return nil, err
    }

    if _, err := io.Copy(writer, resp.Body); err != nil {
        return nil, err
    }
    flusher.Flush()

    return modelResult, nil
}
