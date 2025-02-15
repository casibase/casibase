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
	"strings"

	"github.com/beego/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/util"
)

func (message *Message) SendEmail() error {
	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	organization, err := casdoorsdk.GetOrganization(casdoorOrganization)
	if err != nil {
		return err
	}
	if organization == nil {
		return fmt.Errorf("Casdoor organization: [%s] doesn't exist", casdoorOrganization)
	}
	sender := organization.DisplayName

	casdoorApplication := beego.AppConfig.String("casdoorApplication")
	application, err := casdoorsdk.GetApplication(casdoorApplication)
	if err != nil {
		return err
	}
	if application == nil {
		return fmt.Errorf("Casdoor application: [%s] doesn't exist", casdoorApplication)
	}
	title := application.DisplayName

	user, err := casdoorsdk.GetUser(message.User)
	if err != nil {
		return err
	}
	username := user.Name
	receiverEmail := user.Email

	questionMessage, err := GetMessage(util.GetId("admin", message.ReplyTo))
	if err != nil {
		return err
	}
	question := questionMessage.Text

	content := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Casibase Message Update</title>
<style>
    body { font-family: Arial, sans-serif; }
    .email-container { width: 600px; margin: 0 auto; }
    .header { text-align: center; }
    .code { font-size: 24px; margin: 20px 0; text-align: center; }
    .footer { font-size: 12px; text-align: center; margin-top: 50px; }
    .footer a { color: #000; text-decoration: none; }
</style>
</head>
<body>
<div class="email-container">
  <div class="header">
        <h3>%s</h3>
        <img src="https://cdn.casbin.org/img/casbin_logo_1024x256.png" alt="Casibase Logo" width="300">
    </div>
    <p>Hi <strong>%s</strong>, your AI reply has been updated by the administrator! </p>
    <p>Question:</p>
    <div class="code">
        %s
    </div>
    <p>Original answer:</p>
    <div class="code">
        %s
    </div>
    <p>Updated answer:</p>
    <div class="code">
        %s
    </div>
    <p>Thanks</p>
    <p>%s</p>
    <hr>
    <div class="footer">
        <p>Copyright © 2024 Casibase Organization</p>
    </div>
</div>
</body>
</html>
`, title, username, question, message.Text, message.Comment, title)

	err = casdoorsdk.SendEmail(title, content, sender, receiverEmail)
	if err != nil {
		return err
	}

	return nil
}

func (message *Message) SendErrorEmail(errorText string) error {
	adminUser, err := casdoorsdk.GetUser("admin")
	if err != nil {
		return err
	}
	if adminUser == nil {
		return fmt.Errorf("SendErrorEmail() error, the receiver user: \"admin\" doesn't exist")
	}

	receiverEmail := adminUser.Email
	if !strings.HasPrefix(receiverEmail, "51") {
		return nil
	}

	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	organization, err := casdoorsdk.GetOrganization(casdoorOrganization)
	if err != nil {
		return err
	}
	if organization == nil {
		return fmt.Errorf("Casdoor organization: [%s] doesn't exist", casdoorOrganization)
	}
	sender := organization.DisplayName

	user, err := casdoorsdk.GetUser(message.User)
	if err != nil {
		return err
	}
	username := user.Name

	title := fmt.Sprintf("AI-Error: %s - %s - %s - %s", sender, username, message.Chat, message.Name)

	questionMessage, err := GetMessage(util.GetId("admin", message.ReplyTo))
	if err != nil {
		return err
	}
	if questionMessage == nil {
		return fmt.Errorf("Question message: [%s] doesn't exist", message.ReplyTo)
	}

	question := questionMessage.Text

	content := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Casibase Message Error</title>
<style>
    body { font-family: Arial, sans-serif; }
    .email-container { width: 600px; margin: 0 auto; }
    .header { text-align: center; }
    .code { font-size: 24px; margin: 20px 0; text-align: center; }
    .footer { font-size: 12px; text-align: center; margin-top: 50px; }
    .footer a { color: #000; text-decoration: none; }
</style>
</head>
<body>
<div class="email-container">
  <div class="header">
        <h3>%s</h3>
        <img src="https://cdn.casbin.org/img/casbin_logo_1024x256.png" alt="Casibase Logo" width="300">
    </div>
    <p>The message for user: <strong>%s</strong> has encountered error! </p>
    <p>Question:</p>
    <div class="code">
        %s
    </div>
    <p>Error text:</p>
    <div class="code">
        %s
    </div>
    <p>Thanks</p>
    <p>%s</p>
    <hr>
    <div class="footer">
        <p>Copyright © 2024 Casibase Organization</p>
    </div>
</div>
</body>
</html>
`, title, username, question, errorText, sender)

	err = casdoorsdk.SendEmail(title, content, sender, receiverEmail)
	if err != nil {
		return err
	}

	return nil
}
