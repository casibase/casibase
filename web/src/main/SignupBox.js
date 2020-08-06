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
import {withRouter} from "react-router-dom";
import * as Setting from "../Setting";
import Header from "./Header";
import * as Conf from "../Conf"
import * as AccountBackend from "../backend/AccountBackend";
import * as BasicBackend from "../backend/BasicBackend";
import "../Signup.css";
import i18next from "i18next";

class SignupBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      signupMethod: props.match.params.signupMethod,
      code: "",
      form: {},
      counting: false,
      sendStatus: false,
      showValidateCode: false,
      message: ""
    };
  }

  getGoogleAuthCode() {
    window.location.href=`${Conf.GoogleOauthUri}?client_id=${Conf.GoogleClientId}&redirect_uri=${Setting.ClientUrl}/callback/google&scope=${Conf.GoogleAuthScope}&response_type=code&state=${Conf.GoogleAuthState}`
  }

  getGithubAuthCode() {
    window.location.href=`${Conf.GithubOauthUri}?client_id=${Conf.GithubClientId}&redirect_uri=${Setting.ClientUrl}/callback/github&scope=${Conf.GithubAuthScope}&response_type=code&state=${Conf.GithubAuthState}`
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  countDown() {
    const {count} = this.state;
    if (count === 1) {
      this.setState({
        count: 5,
        counting: false,
        sendStatus: false
      });
    } else {
      this.setState({
        count: count - 1
      });
      setTimeout(this.countDown.bind(this), 1000);
    }
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  renderProblem() {
    let problems = [];
    if (this.state.form.username === "") {
      problems.push(i18next.t("error:Please input username"));
    }
    if (this.state.form.password === "") {
      problems.push(i18next.t("error:Please input password"));
    }
    if (this.state.form.phone === "") {
      problems.push(i18next.t("error:Please input your phone number"));
    }

    if (this.state.message !== "") {
      problems.push(i18next.t(`error:${this.state.message}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
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

  sendValidateCode() {
    if (this.state.form.phone === "" || this.state.form.phone === undefined) {
      this.setState({
        message: "Please input your phone number"
      })
      return
    }

    if (!(/^\d+$/.test(this.state.form.phone))) {
      this.setState({
        message: "Please check your phone number"
      })
      return
    }

    BasicBackend.getValidateCode(this.state.form.phone)
      .then((res) => {
        if (res?.status === "ok") {
          this.setState({
            validateCodeId: res?.data
          }, () => {
            this.updateFormField("validateCodeId", this.state.validateCodeId)
          })
        } else {
          this.setState({
            message: res?.msg
          })
          return
        }
      })

    if (!this.state.sendStatus) {
      this.setState({
        count: 60,
        counting: true,
        sendStatus: true,
        showValidateCode: true
      }, () => {
        this.countDown()
      })
    }
  }

  postSignup() {
    if (this.state.form.username === "" || this.state.form.username === undefined) {
      this.setState({
        message: i18next.t("error:Please input username")
      })
      return
    }
    if (this.state.form.password === "" || this.state.form.password === undefined) {
      this.setState({
        message: i18next.t("error:Please input password")
      })
      return
    }
    if (this.state.form.phone === "" || this.state.form.phone === undefined) {
      this.setState({
        message: i18next.t("error:Please input your phone number")
      })
      return
    }

    if (this.state.form.method !== "phone") {
      this.updateFormField("method", "phone")
    }
    AccountBackend.signup(this.state.form)
      .then((res) => {
        if (res?.status === "ok") {
          Setting.goToLink("/")
        } else {
          this.setState({
            message: i18next.t("signup:"+res?.msg)
          })
        }
      })
  }

  render() {
    if (this.state.signupMethod === "sms") {
      return (
        <div className="box">
          <div className="header">
            <a href="/">{Setting.getForumName()}</a>
            {" "}<span className="chevron">&nbsp;›&nbsp;</span>
            {" "}<a href="/settings">Sign up</a>
          </div>
          {
            this.renderProblem()
          }
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Username")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="username" maxLength="20" onChange={event => this.updateFormField("username", event.target.value)} autoComplete="off" />
                  <span className="negative">
                    {" "}*
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Password")}
                </td>
                <td width="auto" align="left">
                  <input type="password" className="sl" name="password" maxLength="20" onChange={event => this.updateFormField("password", event.target.value)} autoComplete="off" />
                  <span className="negative">
                    {" "}*
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Email")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="email" onChange={event => this.updateFormField("email", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="company" onChange={event => this.updateFormField("company", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company title")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="companyTitle" maxLength="20" onChange={event => this.updateFormField("companyTitle", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Location")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="location" maxLength="32" onChange={event => this.updateFormField("location", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Phone")}
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="location" maxLength="11" onChange={event => this.updateFormField("phone", event.target.value)} autoComplete="off" />
                  <span className="negative">
                    {" "}*{" "}
                  </span>
                  {
                    this.state.sendStatus ?
                      this.state.counting ?
                        <span>
                          {i18next.t("signup:Send the verification code again in")}{" "}{this.state.count} {i18next.t("signup:seconds")}
                        </span> :
                        <a href="#;" onClick={() => this.sendValidateCode()}>
                          {i18next.t("signup:Click to send validate code")}
                        </a> :
                      <a href="#;" onClick={() => this.sendValidateCode()}>
                        {i18next.t("signup:Click to send validate code")}
                      </a>
                  }
                </td>
              </tr>
              {
                this.state.showValidateCode ?
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("signup:Validate Code")}
                    </td>
                    <td width="auto" align="left">
                      <input type="text" className="sl" name="validateCode" maxLength="32" onChange={event => this.updateFormField("validateCode", event.target.value)} autoComplete="off" />
                      <span className="negative">
                    {" "}*
                  </span>
                    </td>
                  </tr> : null
              }
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left"><input type="hidden"/>
                  <input type="submit" className="super normal button"  value={i18next.t("signup:Signup")} onClick={() => this.postSignup()}/>
                </td>
              </tr>
            </table>
          </div>
        </div>
      )
    }

    return (
      <div className="box">
        <Header item={i18next.t("member:Sign Up")} />
        <div className="cell">
          <div className="topic_content markdown_body">
            <p>{`${i18next.t("member:Welcome to")} ${Setting.getForumName()}${i18next.t("member:, this is the official forum for Casbin developers and users.")}`}</p>
            <p>{i18next.t("member:You can use the following ways to sign up as a new user.")}</p>
            <p>{i18next.t("member:If you have previously signed up an account via Email, please click")}{" "}<a href="/signin">{i18next.t("member:here")}</a>{" "}{i18next.t("member:to sign in.")}</p>
          </div>
        </div>
        <div className="dock_area">
          <div className="signup_methods">
            <div className="signup_method" onClick={() => Setting.goToLink("/signup/sms")}>
              <div className="signup_method_icon signup_method_sms"></div>
              <div className="signup_method_label" style={{width: 230}}>{i18next.t("signup:Continue with Mobile Phone")}</div>
            </div>
            {
              Conf.QQClientId !== "" ?
                <div className="signup_method" onClick={() => Setting.getQQAuthCode("signup")}>
                  <div className="signup_method_icon signup_method_qq"></div>
                  <div className="signup_method_label" style={{width: 230}}>{i18next.t("signup:Continue with QQ")}</div>
                </div> : null
            }
            {
              Conf.GoogleClientId !== "" ?
                <div className="signup_method" onClick={() => Setting.getGoogleAuthCode("signup")}>
                  <div className="signup_method_icon signup_method_google"></div>
                  <div className="signup_method_label" style={{width: 230}}>{i18next.t("signup:Continue with Google")}</div>
                </div> : null
            }
            {
              Conf.GithubClientId !== "" ?
                <div className="signup_method" onClick={() => Setting.getGithubAuthCode("signup")}>
                  <div className="signup_method_icon signup_method_github"></div>
                  <div className="signup_method_label" style={{width: 230}}>{i18next.t("signup:Continue with Github")}</div>
                </div> : null
            }
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(SignupBox);
