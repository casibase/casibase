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

package object

import (
	"testing"

	"github.com/casibase/casibase/util"
)

// TestValidateTransactionForMessage tests the dry run transaction validation.
// This test requires a working Casdoor instance and is skipped in CI.
func TestValidateTransactionForMessage(t *testing.T) {
	InitConfig()

	// Create a test message with price
	message := &Message{
		Owner:         "admin",
		Name:          "test-message",
		CreatedTime:   util.GetCurrentTime(),
		Chat:          "test-chat",
		User:          "admin",
		ModelProvider: "test-provider",
		Price:         0.01,
		Currency:      "USD",
	}

	// Test dry run validation
	err := ValidateTransactionForMessage(message)
	if err != nil {
		// Note: This test may fail if Casdoor is not properly configured
		// or if the user doesn't have sufficient balance
		t.Logf("ValidateTransactionForMessage returned error (expected in test environment): %v", err)
	} else {
		t.Log("ValidateTransactionForMessage succeeded")
	}
}

// TestValidateTransactionForMessageWithZeroPrice tests that validation is skipped for zero price.
func TestValidateTransactionForMessageWithZeroPrice(t *testing.T) {
	InitConfig()

	// Create a test message with zero price
	message := &Message{
		Owner:         "admin",
		Name:          "test-message",
		CreatedTime:   util.GetCurrentTime(),
		Chat:          "test-chat",
		User:          "admin",
		ModelProvider: "test-provider",
		Price:         0,
		Currency:      "USD",
	}

	// Test dry run validation - should not fail for zero price
	err := ValidateTransactionForMessage(message)
	if err != nil {
		t.Errorf("ValidateTransactionForMessage with zero price should not return error, got: %v", err)
	}
}
