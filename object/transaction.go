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

package object

import (
	"fmt"
	"strings"

	"github.com/beego/beego/logs"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/util"
	"github.com/robfig/cron/v3"
)

var CasibaseHost = ""

// AddTransactionForMessage creates a transaction in Casdoor for a message with price,
// sets the message's TransactionId, and updates the message with error details if transaction creation fails.
func AddTransactionForMessage(message *Message) error {
	// Only create transaction if message has a price
	if message.Price <= 0 {
		return nil
	}

	// Create transaction object
	transaction := &casdoorsdk.Transaction{
		Owner:              message.Organization,
		Name:               fmt.Sprintf("transaction_%s", util.GetRandomName()),
		CreatedTime:        message.CreatedTime,
		DisplayName:        message.Name,
		Provider:           "",
		Category:           "User",
		Type:               "Token Usage",
		ProductName:        message.ModelProvider,
		ProductDisplayName: fmt.Sprintf("AI Model: %s", message.ModelProvider),
		Detail:             fmt.Sprintf("%d", message.TokenCount),
		Tag:                message.Chat,
		Currency:           message.Currency,
		Amount:             -message.Price,
		ReturnUrl:          CasibaseHost,
		User:               message.User,
		Application:        conf.GetConfigString("casdoorApplication"),
		Payment:            "Balance",
		State:              "Paid",
	}

	// Add transaction via Casdoor SDK
	_, err := casdoorsdk.AddTransaction(transaction)
	if err != nil {
		message.ErrorText = fmt.Sprintf("failed to add transaction: %v", err)

		_, err = UpdateMessage(message.GetId(), message, false)
		if err != nil {
			return fmt.Errorf("failed to update message: %v", err)
		}

		return fmt.Errorf("failed to add transaction: %v", err)
	}

	message.TransactionId = util.GetId(transaction.Owner, transaction.Name)

	return nil
}

func retryFailedTransaction() error {
	messages, err := GetGlobalFailMessages()
	if err != nil {
		return err
	}

	for _, message := range messages {
		if strings.HasPrefix(message.ErrorText, "failed to add transaction") {
			err = AddTransactionForMessage(message)
			if err != nil {
				return err
			}

			message.ErrorText = ""
			_, err = UpdateMessage(message.GetId(), message, false)
			if err != nil {
				return fmt.Errorf("failed to update message: %v", err)
			}
		}
	}

	return nil
}

func retryFailedTransactionNoError() {
	err := retryFailedTransaction()
	if err != nil {
		logs.Error("retryFailedTransactionNoError() error: %s", err.Error())
	}
}

func InitMessageTransactionRetry() {
	cronJob := cron.New()
	schedule := fmt.Sprintf("@every %ds", 300)
	_, err := cronJob.AddFunc(schedule, retryFailedTransactionNoError)
	if err != nil {
		panic(err)
	}

	cronJob.Start()
}
