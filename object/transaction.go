// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

package object

import (
	"fmt"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/util"
)

// AddTransactionForMessage creates a transaction in Casdoor for a message with price
func AddTransactionForMessage(message *Message) error {
	// Only create transaction if message has a price
	if message.Price <= 0 {
		return nil
	}

	// Create transaction object
	transaction := &casdoorsdk.Transaction{
		Owner:       message.Organization,
		Name:        fmt.Sprintf("transaction_%s", util.GetRandomName()),
		CreatedTime: message.CreatedTime,
		DisplayName: fmt.Sprintf("AI Message - %s", message.Name),
		Provider:    "",
		Category:    "AI",
		Type:        "Token Usage",
		ProductName: message.ModelProvider,
		ProductDisplayName: fmt.Sprintf("AI Model: %s", message.ModelProvider),
		Detail:      fmt.Sprintf("Message: %s, Chat: %s, Tokens: %d", message.Name, message.Chat, message.TokenCount),
		Tag:         message.Chat,
		Currency:    message.Currency,
		Amount:      message.Price,
		ReturnUrl:   "",
		User:        message.User,
		Application: "app-casibase",
		Payment:     "",
		State:       "Paid",
	}

	// Add transaction via Casdoor SDK
	_, err := casdoorsdk.AddTransaction(transaction)
	if err != nil {
		return fmt.Errorf("failed to add transaction: %v", err)
	}

	return nil
}
