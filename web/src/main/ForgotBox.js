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
import * as Setting from "../Setting";
import {withRouter, Link} from "react-router-dom";
import * as BasicBackend from "../backend/BasicBackend";
import * as AccountBackend from "../backend/AccountBackend";
import i18next from "i18next";

class ForgotBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      objectId: props.match.params.id,
      editType: props.match.params.editType,
      step: 1,
      editObject: [],
      nodes: [],
      form: {},
      message: "",
      method: "",
      code: "",
      username: "",
      showTab: false,
      getValidateCode: false,
      Method_LIST: [
        {label: "Phone", value: "phone"},
        {label: "Email", value: "email"},
      ]
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.method = params.get("method");
    this.state.code = params.get("code");
    this.state.username = params.get("username");
    this.state.id = params.get("id");
    if (this.state.code !== undefined && this.state.code !== null && this.state.code.length !== 0) {
      this.state.step = 5;
    }
  }

  componentDidMount() {
    this.initForm();
    this.getCaptcha();
  }

  initForm() {
    let form = this.state.form
    form["step"] = this.state.step
    if (this.state.step === 5) {
      form["method"] = this.state.method
      form["code"] = this.state.code;
      form["id"] = this.state.id;
      form["username"] = this.state.username;
    }
    this.setState({
      form: form,
    });
  }

  getCaptcha() {
    if (this.state.step !== 1) {
      return;
    }

    BasicBackend.getCaptcha()
      .then((res) => {
        this.setState({
          captcha: res?.data,
          captchaId: res?.data2
        }, () => {
          this.updateFormField("captchaId", this.state.captchaId)
        });
      });
  }

  clearForm() {
    this.setState({
      form: {}
    });
  }

  getValidateCode() {
    AccountBackend.resetPassword(7, this.state.form)
      .then((res) => {
        if (res?.status === "ok") {
          this.setState({
            validateCodeId: res?.data,
            getValidateCode: true
          }, () => {
            this.updateFormField("validateCodeId", this.state.validateCodeId);
          });
        } else {
          this.setState({
            message: res?.msg
          });
        }
      });
  }

  getAccountInfo() {
    if (this.state.form.username === undefined || this.state.form.username.length === 0) {
      this.setState({
        message: i18next.t("error:Please input username")
      });
      return;
    }
    if (this.state.form.captcha === undefined || this.state.form.captcha.length === 0) {
      this.setState({
        message: i18next.t("error:Please input captcha")
      });
      return;
    }
    AccountBackend.resetPassword(this.state.step, this.state.form)
      .then((res) => {
        if (res?.status === "ok") {
          let method = res?.data;
          if (res?.data === "both") {
            method = "phone";
            this.setState({
              showTab: true
            });
          }
          let message = ""
          let step;
          if (method === "phone") {
            step = 2;
          } else {
            step = 3;
          }
          this.setState({
            step: step,
            username: this.state.form.username,
            method: method,
            message: message,
            resetInfo: res?.data2,
            form: {}
          }, () => {
            let form = {};
            form["step"] = this.state.step;
            form["method"] = this.state.method;
            form["username"] = this.state.username;
            if (res?.data === "phone") {
              form["validateCodeId"] = res?.data2.validateCodeId;
            } else {
              form["url"] = Setting.ClientUrl;
            }
            this.setState({
              form: form,
            });
          });
        } else {
          this.setState({
            message: res?.msg
          });
        }
      });
  }

  changeTab(method) {
    let step;
    if (method === "phone") {
      step = 2;
    } else {
      step = 3;
    }
    this.setState({
      step: step,
      method: method
    });
  }

  postVerification() {
    if (this.state.step === 2) {
      if (this.state.form.validateCode === undefined || this.state.form.validateCode.length === 0) {
        this.setState({
          message: i18next.t("error:Please input validate code")
        });
        return;
      }
    } else  {
      if (this.state.form?.email === undefined || this.state.form?.email.length === 0) {
        this.setState({
          message: i18next.t("error:Please input email")
        });
        return;
      }
    }
    AccountBackend.resetPassword(this.state.step, this.state.form)
      .then((res) => {
        if (res?.status === "ok") {
          if (res?.data === "phone") {
            let method = res?.data;
            let code = res?.data2.resetCode;
            let id = res?.data2.resetId;
            let username = res?.data2.username;
            this.props.history.push(`/forgot?method=${method}&id=${id}&code=${code}&username=${username}`);
            return;
          }
          this.setState({
            step: 4,
            email: res?.data2
          });
        } else {
          this.setState({
            message: res?.msg
          });
        }
      });
  }

  postResetPassword() {
    if (this.state.form.password === undefined || this.state.form.password.length === 0) {
      this.setState({
        message: i18next.t("error:Please input your new password")
      });
      return;
    }
    if (this.state.form?.password !== this.state.form?.passwordAgain) {
      this.setState({
        message: i18next.t("error:The two passwords are different")
      });
      return;
    }
    AccountBackend.resetPassword(this.state.step, this.state.form)
      .then((res) => {
        if (res?.status === "ok") {
          this.setState({
            step: 6,
            showTab: false
          });
        } else {
          this.setState({
            message: res?.msg,
            showTab: false
          });
        }
      });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  renderProblem() {
    let problems = [];

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
    );
  }

  renderMethodList(item){
    return (
      <a onClick={() => this.changeTab(item.value)} href="javascript:void(0);" className={this.state.method === item.value ? "tab_current" : "tab"}>{item.label}</a>
    );
  }

  render() {
    switch (this.state.step) {
      case 2:
          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                {" "}<span className="chevron">&nbsp;›&nbsp;</span>
                {" "}{i18next.t("forgot:Reset password by phone")}
              </div>
              {
                this.state.showTab ?
                  <div className="cell">
                    {
                      this.state.Method_LIST.map((item) => {
                        return this.renderMethodList(item);
                      })
                    }
                  </div> : null
              }
              {
                this.renderProblem()
              }
              <div className="inner">
                <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                  <tbody>
                  <tr>
                    <td width="120" align="right"><span className="gray">{i18next.t("forgot:Username")}</span></td>{" "}
                    <td width="auto" align="left"><span className="gray">{this.state.username}</span></td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      {
                        this.state.getValidateCode ?
                          <span className="gray">
                            {i18next.t("forgot:The verification code has been sent to the mobile phone")}{" "}
                            {this.state.resetInfo?.phone}{" "}
                            {i18next.t("forgot:, please enter it within 20 minutes and do not leave the interface")}
                          </span> :
                          <span>
                            <a href="#;" onClick={() => this.getValidateCode()}>
                              {i18next.t("signup:Click to send validate code")}
                            </a>
                          </span>
                      }
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t(":Validate Code")}
                    </td>
                    <td width="auto" align="left">
                      <input type="text" className="sl" name="validateCode" maxLength="32" onChange={event => this.updateFormField("validateCode", event.target.value)} autoComplete="off" />
                      <span className="negative">
                    {" "}*
                  </span>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left"><input type="hidden" name="once"/>
                      <input type="submit" className="super normal button" onClick={() => this.postVerification()} value={i18next.t("forgot:Continue")}/>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
      case 3:
        return (
          <div className="box">
            <div className="header">
              <Link to="/">{Setting.getForumName()}</Link>
              {" "}<span className="chevron">&nbsp;›&nbsp;</span>
              {" "}{i18next.t("forgot:Reset password by email")}
            </div>
            {
              this.state.showTab ?
                <div className="cell">
                  {
                    this.state.Method_LIST.map((item) => {
                      return this.renderMethodList(item);
                    })
                  }
                </div> : null
            }
            {
              this.renderProblem()
            }
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                <tr>
                  <td width="120" align="right"><span className="gray">{i18next.t("forgot:Username")}</span></td>{" "}
                  <td width="auto" align="left"><span className="gray">{this.state.username}</span></td>
                </tr>
                <tr>
                  <td width="120" align="right">{i18next.t("forgot:Mail")}</td>
                  <td width="auto" align="left"><input type="text" className="sl" name="u" value={this.state.form?.email} onChange={(event) => this.updateFormField("email", event.target.value)}/></td>
                </tr>
                <tr>
                  <td width="120" align="right"></td>
                  <td width="auto" align="left"><input type="hidden" name="once"/>
                    <input type="submit" className="super normal button" onClick={() => this.postVerification()} value={i18next.t("forgot:Continue")}/>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 4:
        return (
          <div class="box">
            <div class="header">
              <Link to="/">{Setting.getForumName()}</Link>
              {" "}<span class="chevron">&nbsp;›&nbsp;</span>
              {" "}{i18next.t("forgot:Reset password by email")}
            </div>
            <div class="cell">
              {i18next.t("forgot:An email containing instructions for resetting your password has been sent to your registered mailbox. Follow the instructions in the email to reset your password.")}
            </div>
            <div class="inner">
              ←{" "}<Link to="/">{i18next.t("forgot:Back to homepage")}</Link>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                {" "}<span className="chevron">&nbsp;›&nbsp;</span>
                {" "}{i18next.t(`forgot:Reset password by ${this.state.method}`)}
              </div>
              {
                this.renderProblem()
              }
              <div className="inner">
                <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                  <tbody>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left"><span className="gray">{i18next.t("forgot:Reset password for account")}{" "}{this.state.username}{" "}{i18next.t("forgot:重新设置密码")}</span></td>
                  </tr>
                  <tr>
                    <td width="120" align="right">{i18next.t("forgot:New password")}</td>
                    <td width="auto" align="left"><input type="password" className="sl" name="new"  value={this.state.form?.password} onChange={(event) => this.updateFormField("password", event.target.value)}/></td>
                  </tr>
                  <tr>
                    <td width="120" align="right">{i18next.t("forgot:Password again")}</td>
                    <td width="auto" align="left"><input type="password" className="sl" name="again"  value={this.state.form?.passwordAgain} onChange={(event) => this.updateFormField("passwordAgain", event.target.value)}/></td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left"><input type="submit" className="super normal button" onClick={() => this.postResetPassword()} value={i18next.t("forgot:Continue")}/>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div class="box">
            <div class="header"><Link to="/">{Setting.getForumName()}</Link>
              {" "}<span class="chevron">&nbsp;›&nbsp;</span>
              {" "}{i18next.t("forgot:Password reset complete")}
            </div>
            <div class="cell">
              {i18next.t("forgot:The password reset is complete. You can now log in with the new password.")}
            </div>
            <div class="caution">
              <input type="button" onClick={() => this.props.history.push("/signin")} class="super normal button" value={i18next.t("forgot:Log in now")} />
            </div>
          </div>
        );
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link>
          {" "}<span className="chevron">&nbsp;›&nbsp;</span>
          {" "}{i18next.t("forgot:Reset Password")}
        </div>
        {
          this.renderProblem()
        }
        <div className="inner">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td width="120" align="right">{i18next.t("forgot:Username")}</td>
              <td width="auto" align="left"><input type="text" className="sl" name="u" value={this.state.form?.username} onChange={(event) => this.updateFormField("username", event.target.value)}/></td>
            </tr>
            <tr>
              <td width="120" align="right">{i18next.t("login:Are you a bot?")}{" "}</td>
              <td width="auto" align="left">
                <div style={{
                  backgroundImage: `url('data:image/png;base64,${this.state.captcha}')`,
                  backgroundRepeat: "no-repeat",
                  width: "320px",
                  height: "80px",
                  borderRadius: "3px",
                  border: "1px solid #ccc"
                }}/>
                <div className="sep10"/>
                <input type="text" className="sl" name="captcha" value={this.state.form.captcha} onChange={event => {
                  this.updateFormField("captcha", event.target.value)
                }} autoCorrect="off" spellCheck="false" autoCapitalize="off"
                       placeholder={i18next.t("login:Please enter the verification code in the picture above")}/>
              </td>
            </tr>
            <tr>
              <td width="120" align="right"></td>
              <td width="auto" align="left"><input type="hidden" name="once"/>
                <input type="submit" className="super normal button" onClick={() => this.getAccountInfo()} value={i18next.t("forgot:Continue")}/>
              </td>
            </tr>
            <tr>
              <td width="120" align="right"></td>
              <td width="auto" align="left"><span className="gray">{i18next.t("forgot:You can reset the password at most 2 times within 24 hours.")}</span></td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(ForgotBox);
