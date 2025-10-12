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

//go:build !skipCi
// +build !skipCi

package object_test

import (
	"testing"

	"github.com/casibase/casibase/controllers"
	"github.com/casibase/casibase/object"
)

func TestSendErrorEmail(t *testing.T) {
	object.InitConfig()
	controllers.InitAuthConfig()

	message, err := object.GetMessage("admin/message_cyqn30")
	if err != nil {
		panic(err)
	}

	err = message.SendErrorEmail(message.ErrorText, "en")
	if err != nil {
		panic(err)
	}
}
