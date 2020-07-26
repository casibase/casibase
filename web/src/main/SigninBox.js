// Copyright 2020 The casbin Authors. All Rights Reserved.
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

import React from "react";
import Header from "./Header";
import * as AccountBackend from "../backend/AccountBackend";
import * as BasicBackend from "../backend/BasicBackend";
import * as Setting from "../Setting";
import i18next from "i18next";

class SigninBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      isTypingStarted: false,
      problem: [],
      message: "",
      captcha: "",
      captchaId: "",
    };
  }

  componentDidMount() {
    this.getCaptcha();
  }

  getCaptcha() {
    BasicBackend.getCaptcha()
      .then((res) => {
        this.setState({
          captcha: res?.data,
          captchaId: res?.data2
        }, () => {
          this.updateFormField("captchaId", this.state.captchaId)
        })
      })
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  onSignin(event) {
    event.preventDefault();
    AccountBackend.signin(this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          this.props.onSignin();
          Setting.goToLink("/");
        } else {
          this.setState({
            message: res.msg,
          });
          this.getCaptcha();
        }
      });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  renderProblem() {
    if (!this.state.isTypingStarted) {
      return null;
    }

    let problems = [];
    if (this.state.form.username === "") {
      problems.push(i18next.t("error:Please input username"));
    }
    if (this.state.form.password === "") {
      problems.push(i18next.t("error:Please input password"));
    }

    if (this.state.message !== "") {
      problems.push(this.state.message)
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem">
        {i18next.t("error:Please resolve the following issues before submitting")}
        <ul>
          {
            problems.map((problem, i) => {
              return <li>{problem}</li>;
            })
          }
        </ul>
      </div>
    )
  }

  renderMessage() {
    if (this.state.message === "" || this.state.message === "Captcha error") {
      return null;
    }

    return (
      <div className="message" onClick={this.clearMessage.bind(this)}>
        <li className="fa fa-exclamation-triangle" />
        &nbsp;{" "}{i18next.t("error:We had a problem when you signed in, please try again")}
      </div>
    )
  }

  render() {
    return (
      <div className="box">
        <Header item="Sign In" />
        {
          this.renderProblem()
        }
        {
          this.renderMessage()
        }
        <div className="cell">
          <form onSubmit={this.onSignin}>
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
              <tr>
                <td width="120" align="right">
                  {i18next.t("general:Username")}
                </td>
                <td width="auto" align="left">
                  <input type="text" value={this.state.form.username} onChange={event => {this.updateFormField("username", event.target.value)}} className="sl" name="username" autoFocus="autofocus" autoCorrect="off" spellCheck="false" autoCapitalize="off" placeholder={i18next.t("general:Username or Email address")} />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("general:Password")}
                </td>
                <td width="auto" align="left">
                  <input type="password" value={this.state.form.password} onChange={event => {this.updateFormField("password", event.target.value)}} className="sl" name="password" autoCorrect="off" spellCheck="false" autoCapitalize="off" />
                </td>
              </tr>
              <tr>
              <td width="120" align="right">{i18next.t("login:Are you a bot?")}{" "}</td>
              <td width="auto" align="left">
                <div style={{backgroundImage: `url('data:image/png;base64,${this.state.captcha}')`, backgroundRepeat: "no-repeat", width: "320px", height: "80px", borderRadius: "3px", border: "1px solid #ccc"}} />
                <div class="sep10" />
                <input type="text" class="sl" name="captcha" value={this.state.form.captcha} onChange={event => {this.updateFormField("captcha", event.target.value)}} autocorrect="off" spellcheck="false" autocapitalize="off" placeholder={i18next.t("login:Please enter the verification code in the picture above")} />
              </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <input type="hidden" value="83861" name="once" />
                  <input type="submit" className="super normal button" value={i18next.t("general:Sign In")} onClick={event => this.onSignin(event)} />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <a href="/forgot">
                    {i18next.t("general:Forgot Password")}
                  </a>
                </td>
              </tr>
              </tbody>
            </table>
            <input type="hidden" value="/signup" name="next" />
          </form>
        </div>
      </div>
    );
  }
}

export default SigninBox;
