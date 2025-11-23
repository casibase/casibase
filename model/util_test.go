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

//go:build skipCi
// +build skipCi

package model

import (
	"testing"
)

func TestEstimateTokenCountAndPrice(t *testing.T) {
	prompt := "You are a helpful assistant."
	question := "What is the capital of France?"
	history := []*RawMessage{}
	knowledge := []*RawMessage{}
	model := "gpt-3.5-turbo"
	inputPricePerThousandTokens := 0.0005
	outputPricePerThousandTokens := 0.0015
	currency := "USD"

	promptTokens, totalTokens, estimatedPrice, estimatedCurrency, err := EstimateTokenCountAndPrice(
		prompt,
		question,
		history,
		knowledge,
		model,
		inputPricePerThousandTokens,
		outputPricePerThousandTokens,
		currency,
	)

	if err != nil {
		t.Errorf("EstimateTokenCountAndPrice returned error: %v", err)
	}

	if promptTokens <= 0 {
		t.Errorf("Expected positive prompt tokens, got: %d", promptTokens)
	}

	if totalTokens <= promptTokens {
		t.Errorf("Expected total tokens (%d) to be greater than prompt tokens (%d)", totalTokens, promptTokens)
	}

	if estimatedPrice <= 0 {
		t.Errorf("Expected positive price, got: %f", estimatedPrice)
	}

	if estimatedCurrency != currency {
		t.Errorf("Expected currency %s, got: %s", currency, estimatedCurrency)
	}

	// Basic sanity check: estimate should be reasonable (prompt cost + 1000 tokens response cost)
	expectedMinPrice := getPrice(promptTokens, inputPricePerThousandTokens)
	if estimatedPrice < expectedMinPrice {
		t.Errorf("Estimated price (%f) should be at least the prompt cost (%f)", estimatedPrice, expectedMinPrice)
	}
}

func TestEstimateTokenCountAndPriceWithHistory(t *testing.T) {
	prompt := "You are a helpful assistant."
	question := "What about its population?"
	history := []*RawMessage{
		{Text: "What is the capital of France?", Author: "User"},
		{Text: "The capital of France is Paris.", Author: "AI"},
	}
	knowledge := []*RawMessage{}
	model := "gpt-4"
	inputPricePerThousandTokens := 0.03
	outputPricePerThousandTokens := 0.06
	currency := "USD"

	promptTokens, totalTokens, estimatedPrice, estimatedCurrency, err := EstimateTokenCountAndPrice(
		prompt,
		question,
		history,
		knowledge,
		model,
		inputPricePerThousandTokens,
		outputPricePerThousandTokens,
		currency,
	)

	if err != nil {
		t.Errorf("EstimateTokenCountAndPrice with history returned error: %v", err)
	}

	if promptTokens <= 0 {
		t.Errorf("Expected positive prompt tokens with history, got: %d", promptTokens)
	}

	if totalTokens <= promptTokens {
		t.Errorf("Expected total tokens (%d) to be greater than prompt tokens (%d)", totalTokens, promptTokens)
	}

	if estimatedPrice <= 0 {
		t.Errorf("Expected positive price with history, got: %f", estimatedPrice)
	}

	if estimatedCurrency != currency {
		t.Errorf("Expected currency %s, got: %s", currency, estimatedCurrency)
	}
}
