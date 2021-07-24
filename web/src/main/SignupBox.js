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

// recovered from commit 9f260a7
// modified to adapt Casdoor JS SDK

import React from "react";
import { withRouter, Link } from "react-router-dom";
import * as Setting from "../Setting";
import * as AccountBackend from "../backend/AccountBackend";
import "../Signup.css";
import "./const";
import Select2 from "react-select2-wrapper";
import { Area_Code } from "./const";
import i18next from "i18next";
import { Modal, Input } from "antd";
import * as Auth from "../auth/Auth";

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
      message: "",
      email: "",
      emailCode: "",
      phone: "",
      phoneCode: "",
      captchaId: "",
      captchaKey: "",
      captchaImage: "",
      showEmailModal: false,
      showPhoneModal: false,
    };
  }

  componentDidMount() {
    this.initPostForm();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState({
        signupMethod: newProps.match.params.signupMethod,
      });
      this.initPostForm();
    }
  }

  initPostForm() {
    let form = this.state.form;
    form["areaCode"] = Area_Code[0].value;
    if (this.state.signupMethod === "sms") {
      form["method"] = "phone";
    } else {
      form["method"] = "email";
    }
    this.setState({
      form: form,
    });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  renderSendCode(type) {
    let dest;
    if (type === "email") dest = this.state.email;
    else if (type === "phone") dest = this.state.phone;
    return (
      <div>
        <a
          onClick={() => {
            this.props.Casdoor.getCaptcha().then((res) => {
              this.setState(
                {
                  captchaId: res.captchaId,
                  captchaImage: res.captchaImage,
                  captchaKey: "",
                },
                () => {
                  if (type === "email") this.setState({ showEmailModal: true });
                  else this.setState({ showPhoneModal: true });
                }
              );
            });
          }}
        >
          {i18next.t("signup:Click to send validate code")}
        </a>
        <Modal
          visible={
            type === "email"
              ? this.state.showEmailModal
              : this.state.showPhoneModal
          }
          onCancel={() =>
            this.setState({
              showEmailModal: false,
              showPhoneModal: false,
            })
          }
          onOk={() => {
            this.props.Casdoor.sendCode(
              this.state.captchaId,
              this.state.captchaKey,
              type,
              dest
            ).then((res) => {
              if (res) alert("code sent");
              else alert("failed");
              this.setState({
                captchaId: "",
                captchaKey: "",
                captchaImage: "",
                showEmailModal: false,
                showPhoneModal: false,
              });
            });
          }}
        >
          <div
            style={{
              width: 200,
              height: 80,
              backgroundImage: `url("data:image/png;base64,${this.state.captchaImage}")`,
            }}
          />
          <Input
            onChange={(e) => this.setState({ captchaKey: e.target.value })}
          />
        </Modal>
      </div>
    );
  }

  countDown() {
    const { count } = this.state;
    if (count === 1) {
      this.setState({
        count: 5,
        counting: false,
        sendStatus: false,
      });
    } else {
      this.setState({
        count: count - 1,
      });
      setTimeout(this.countDown.bind(this), 1000);
    }
  }

  signOut() {
    if (!window.confirm(i18next.t("signout:Are you sure to log out?"))) {
      return;
    }

    AccountBackend.signout().then((res) => {
      if (res.status === "ok") {
        this.props.onSignout();
        this.props.history.push("/signout");
      } else {
        this.props.history.push("/signout");
      }
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
      problems.push(this.state.message);
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
        {i18next.t(
          "error:Please resolve the following issues before submitting"
        )}
        <ul>
          {problems.map((problem, i) => {
            if (problem === "Please sign out before sign up") {
              return (
                <li>
                  {i18next.t(`error:${this.state.message}`)} &nbsp;{" "}
                  <a href="#;" onClick={() => this.signOut()}>
                    {i18next.t("signout:Click to sign out")}
                  </a>
                </li>
              );
            }
            return <li>{i18next.t(`error:${problem}`)}</li>;
          })}
        </ul>
      </div>
    );
  }

  postSignup() {
    this.props.Casdoor.signup(
      this.state.form.username,
      this.state.form.username,
      this.state.form.password,
      this.state.email,
      this.state.emailCode,
      this.state.phone,
      this.state.phoneCode,
      "86"
    ).then((res) => {
      if (res === "") {
        alert("Succeed. Please login!");
        this.location.href = Auth.getSigninUrl();
      }
      this.setState({
        message: res,
      });
    });
  }

  getIndexFromAreaCode(value) {
    for (let i = 0; i < Area_Code.length; i++) {
      if (Area_Code[i].value === value) {
        return i;
      }
    }

    return -1;
  }

  renderValidateCode() {
    if (!this.state.showValidateCode) {
      return null;
    }

    return (
      <tr>
        <td width="120" align="right">
          {i18next.t("signup:Validate Code")}
        </td>
        <td width="auto" align="left">
          <input
            type="text"
            className="sl"
            name="validateCode"
            maxLength="32"
            onChange={(event) =>
              this.updateFormField("validateCode", event.target.value)
            }
            autoComplete="off"
          />
          <span className="negative"> *</span>
        </td>
      </tr>
    );
  }

  render() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          <Link to={Auth.getSignupUrl()}>Sign up</Link>{" "}
        </div>
        {this.renderProblem()}
        <div className="inner">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Username")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="username"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("username", event.target.value)
                    }
                    autoComplete="off"
                  />
                  <span className="negative"> *</span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Password")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="password"
                    className="sl"
                    name="password"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("password", event.target.value)
                    }
                    autoComplete="off"
                  />
                  <span className="negative"> *</span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Email")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="email"
                    onChange={(event) =>
                      this.setState({ email: event.target.value })
                    }
                    autoComplete="off"
                  />
                  <span>
                    <span className="negative"> * </span>
                    {this.renderSendCode("email")}
                  </span>
                </td>
              </tr>
              {this.renderValidateCode()}
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Email Code")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="emailCode"
                    onChange={(event) =>
                      this.setState({ emailCode: event.target.value })
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="company"
                    onChange={(event) =>
                      this.updateFormField("company", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Company title")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="companyTitle"
                    maxLength="20"
                    onChange={(event) =>
                      this.updateFormField("companyTitle", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Location")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="location"
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("location", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" valign="top">
                  <div className="sep5"></div>
                  {i18next.t("signup:Area code")}
                </td>
                <td width="auto" align="left">
                  {this.state.signupMethod === "email" ? (
                    <Select2
                      value={this.getIndexFromAreaCode(
                        this.state.form.areaCode
                      )}
                      style={{
                        width: Setting.PcBrowser ? "300px" : "200px",
                        fontSize: "14px",
                      }}
                      data={Area_Code.map((code, i) => {
                        return { text: `${code.label}`, id: i };
                      })}
                      onSelect={(event) => {
                        const s = event.target.value;
                        if (s === null) {
                          return;
                        }

                        const index = parseInt(s);
                        const codeValue = Area_Code[index].value;
                        this.updateFormField("areaCode", codeValue);
                      }}
                      options={{
                        placeholder: i18next.t(
                          "signup:Please select a area code"
                        ),
                      }}
                    />
                  ) : (
                    <span className="gray">{Area_Code[0].label}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Phone")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="location"
                    maxLength="11"
                    onChange={(event) =>
                      this.setState({ phone: event.target.value })
                    }
                    autoComplete="off"
                  />
                  <span className="negative"> * </span>
                  {this.renderSendCode("phone")}
                </td>
              </tr>
              {this.renderValidateCode()}
              <tr>
                <td width="120" align="right">
                  {i18next.t("signup:Phone Code")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="phoneCode"
                    maxLength="11"
                    onChange={(event) =>
                      this.setState({ phoneCode: event.target.value })
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left">
                  <input type="hidden" />
                  <input
                    type="submit"
                    className="super normal button"
                    value={i18next.t("signup:Signup")}
                    onClick={() => this.postSignup()}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(SignupBox);
