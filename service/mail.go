// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package service

import (
	"strconv"

	"github.com/astaxie/beego"
	"github.com/go-gomail/gomail"
)

var mailConn = map[string]string{
	"user": beego.AppConfig.String("mailUser"),
	"pass": beego.AppConfig.String("mailPass"),
	"host": beego.AppConfig.String("mailHost"),
	"port": beego.AppConfig.String("mailPort"),
}

var dialer *gomail.Dialer

func InitDialer() {
	port, _ := strconv.Atoi(mailConn["port"])
	dialer = gomail.NewDialer(mailConn["host"], port, mailConn["user"], mailConn["pass"])
}

// SendResetPasswordMail sends mail with reset password information.
func SendResetPasswordMail(email, memberId, url string) error {
	mail := gomail.NewMessage()

	name := beego.AppConfig.String("appname")
	body := `Hi: ` + memberId + `, <br/><br/> 我们的系统收到一个请求，
说你希望通过电子邮件重新设置你在 ` + name + ` 的密码。你可以点击下面的链接开始重设密码：<br/><br/><a href="` + url + `">` + url + `</a><br/><br/>
如果这个请求不是由你发起的，那没问题，你不用担心，你可以安全地忽略这封邮件。<br/><br/>
如果你有任何疑问，可以回复这封邮件向我们提问。<br/><br/>
<front color="#888888">` + name + `</front>`

	mail.SetHeader("From", mail.FormatAddress(mailConn["user"], name))
	mail.SetHeader("To", email)
	mail.SetHeader("Subject", "["+name+"]"+" 重设密码") // set subject
	mail.SetBody("text/html", body)                 // set body

	if dialer == nil {
		InitDialer()
	}

	err := dialer.DialAndSend(mail)
	return err
}

// SendRegistrationMail sends mail with registration information.
func SendRegistrationMail(email, validateCode string) error {
	mail := gomail.NewMessage()

	name := beego.AppConfig.String("appname")
	body := `Hi: ` + email + `! <br/><br/> 欢迎注册` + name + `，请将验证码填写到注册页面。<br/><br/>
验证码：` + validateCode + `<br/><br/>
如果这个请求不是由你发起的，那没问题，你不用担心，你可以安全地忽略这封邮件。<br/><br/>
如果你有任何疑问，可以回复这封邮件向我们提问。<br/><br/>
<front color="#888888">` + name + `</front>`

	mail.SetHeader("From", mail.FormatAddress(mailConn["user"], name))
	mail.SetHeader("To", email)
	mail.SetHeader("Subject", "["+name+"]"+" 用户注册") // set subject
	mail.SetBody("text/html", body)                 // set body

	if dialer == nil {
		InitDialer()
	}

	err := dialer.DialAndSend(mail)
	return err
}

// SendRemindMail sends mail with remind information.
func SendRemindMail(title, content, topicId, email, domain string) error {
	mail := gomail.NewMessage()
	name := beego.AppConfig.String("appname")
	body := content + `<p style="font-size:small;-webkit-text-size-adjust:none;color:#666;">-
<br>
You are receiving this because you are subscribed to this thread.
<br> Reply to this email directly, 
<a href="https://` + domain + "/t/" + topicId + `">view it on ` + name + `</a>` + `
, or <a href="https://` + domain + `/settings/forum">unsubscribe` + `</a>`

	mail.SetHeader("From", mail.FormatAddress(mailConn["user"], name))
	mail.SetHeader("To", email)
	mail.SetHeader("Subject", "Re: ["+name+"] "+title) // set subject
	mail.SetBody("text/html", body)                    // set body

	if dialer == nil {
		InitDialer()
	}

	err := dialer.DialAndSend(mail)
	return err
}

func SendEmail(title, content, dest, sender string) error {
	message := gomail.NewMessage()
	message.SetAddressHeader("From", beego.AppConfig.String("mailUser"), sender)
	message.SetHeader("To", dest)
	message.SetHeader("Subject", title)
	message.SetBody("text/html", content)
	if dialer == nil {
		InitDialer()
	}
	return dialer.DialAndSend(message)
}
