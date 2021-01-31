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
import { withRouter, Link } from "react-router-dom";
import * as Setting from "../Setting";
import Header from "./Header";
import * as Conf from "../Conf";
import * as AccountBackend from "../backend/AccountBackend";
import * as BasicBackend from "../backend/BasicBackend";
import "../Signup.css";
import "./const";
import $ from "jquery";
import Select2 from "react-select2-wrapper";
import { Area_Code } from "./const";
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
      message: "",
    };
  }

  getGoogleAuthCode() {
    window.location.href = `${Conf.GoogleOauthUri}?client_id=${Conf.GoogleClientId}&redirect_uri=${Setting.ClientUrl}/callback/google&scope=${Conf.GoogleAuthScope}&response_type=code&state=${Conf.GoogleAuthState}`;
  }

  getGithubAuthCode() {
    window.location.href = `${Conf.GithubOauthUri}?client_id=${Conf.GithubClientId}&redirect_uri=${Setting.ClientUrl}/callback/github&scope=${Conf.GithubAuthScope}&response_type=code&state=${Conf.GithubAuthState}`;
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

  sendValidateCode() {
    if (this.state.signupMethod === "sms") {
      if (this.state.form.phone === "" || this.state.form.phone === undefined) {
        this.setState({
          message: "Please input your phone number",
        });
        return;
      }
      if (!/^\d+$/.test(this.state.form.phone)) {
        this.setState({
          message: "Please check your phone number",
        });
        return;
      }
    } else {
      if (this.state.form.email === "" || this.state.form.email === undefined) {
        this.setState({
          message: "Please input your email",
        });
        return;
      }
      // just the simplest judgment to fit more situations.
      if (!/\S+@\S+\.\S+/.test(this.state.form.email)) {
        this.setState({
          message: "Please check your email",
        });
        return;
      }
    }

    let verifyType = 1,
      information = this.state.form.phone;
    if (this.state.signupMethod === "email") {
      verifyType = 2;
      information = this.state.form.email;
    }
    BasicBackend.getValidateCode(information, verifyType).then((res) => {
      if (res?.status === "ok") {
        this.setState(
          {
            validateCodeId: res?.data,
          },
          () => {
            this.updateFormField("validateCodeId", this.state.validateCodeId);
          }
        );
      } else {
        this.setState({
          message: res?.msg,
        });
        return;
      }
    });

    if (!this.state.sendStatus) {
      this.setState(
        {
          count: 60,
          counting: true,
          sendStatus: true,
          showValidateCode: true,
        },
        () => {
          this.countDown();
        }
      );
    }
  }

  postSignup() {
    if (this.state.form.areaCode === undefined) {
      this.updateFormField("areaCode", Area_Code[0].value);
    }

    if (
      this.state.form.username === "" ||
      this.state.form.username === undefined
    ) {
      this.setState({
        message: "Please input username",
      });
      return;
    }
    if (
      this.state.form.password === "" ||
      this.state.form.password === undefined
    ) {
      this.setState({
        message: "Please input password",
      });
      return;
    }
    if (this.state.signupMethod === "sms") {
      if (this.state.form.phone === "" || this.state.form.phone === undefined) {
        this.setState({
          message: "Please input your phone number",
        });
        return;
      }
    } else {
      if (this.state.form.email === "" || this.state.form.email === undefined) {
        this.setState({
          message: "Please input your email",
        });
        return;
      }
    }

    AccountBackend.signup(this.state.form).then((res) => {
      if (res?.status === "ok") {
        this.props.refreshAccount();
        this.props.history.push("/");
      } else {
        this.setState({
          message: res?.msg,
        });
      }
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
    if (
      this.state.signupMethod === "sms" ||
      this.state.signupMethod === "email"
    ) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            <Link to="/signup">Sign up</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            <Link to="/settings">
              {this.state.signupMethod === "sms" ? "Phone" : "Email"}
            </Link>
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
                        this.updateFormField("email", event.target.value)
                      }
                      autoComplete="off"
                    />
                    {this.state.signupMethod === "email" ? (
                      <span>
                        <span className="negative"> * </span>
                        {this.state.sendStatus ? (
                          this.state.counting ? (
                            <span>
                              {i18next.t(
                                "signup:Send the verification code again in"
                              )}{" "}
                              {this.state.count} {i18next.t("signup:seconds")}
                            </span>
                          ) : (
                            <a
                              href="#;"
                              onClick={() => this.sendValidateCode()}
                            >
                              {i18next.t("signup:Click to send validate code")}
                            </a>
                          )
                        ) : (
                          <a href="#;" onClick={() => this.sendValidateCode()}>
                            {i18next.t("signup:Click to send validate code")}
                          </a>
                        )}
                      </span>
                    ) : null}
                  </td>
                </tr>
                {this.state.signupMethod === "email"
                  ? this.renderValidateCode()
                  : null}
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
                        style={{ width: "300px", fontSize: "14px" }}
                        data={Area_Code.map((code, i) => {
                          return { text: `${code.label}`, id: i };
                        })}
                        onSelect={(event) => {
                          const s = $(event.target).val();
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
                  {this.state.signupMethod === "sms" ? (
                    <td width="auto" align="left">
                      <input
                        type="text"
                        className="sl"
                        name="location"
                        maxLength="11"
                        onChange={(event) =>
                          this.updateFormField("phone", event.target.value)
                        }
                        autoComplete="off"
                      />
                      <span className="negative"> * </span>
                      {this.state.sendStatus ? (
                        this.state.counting ? (
                          <span>
                            {i18next.t(
                              "signup:Send the verification code again in"
                            )}{" "}
                            {this.state.count} {i18next.t("signup:seconds")}
                          </span>
                        ) : (
                          <a href="#;" onClick={() => this.sendValidateCode()}>
                            {i18next.t("signup:Click to send validate code")}
                          </a>
                        )
                      ) : (
                        <a href="#;" onClick={() => this.sendValidateCode()}>
                          {i18next.t("signup:Click to send validate code")}
                        </a>
                      )}
                    </td>
                  ) : (
                    <td width="auto" align="left">
                      <input
                        type="text"
                        className="sl"
                        name="location"
                        maxLength="11"
                        onChange={(event) =>
                          this.updateFormField("phone", event.target.value)
                        }
                        autoComplete="off"
                      />
                    </td>
                  )}
                </tr>
                {this.state.signupMethod === "sms"
                  ? this.renderValidateCode()
                  : null}
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

    return (
      <div className="box">
        <Header item={i18next.t("member:Sign Up")} />
        <div className="cell">
          <div className="topic_content markdown_body">
            <p
              style={{ marginBlockStart: "1em", marginBlockEnd: "1em" }}
            >{`${i18next.t(
              "member:Welcome to"
            )} ${Setting.getForumName()}${i18next.t(
              "member:, this is the official forum for Casbin developers and users."
            )}`}</p>
            <p style={{ marginBlockStart: "1em", marginBlockEnd: "1em" }}>
              {i18next.t(
                "member:You can use the following ways to sign up as a new user."
              )}
            </p>
            <p style={{ marginBlockStart: "1em", marginBlockEnd: "1em" }}>
              {i18next.t(
                "member:If you have previously signed up an account via Email, please click"
              )}{" "}
              <Link to="/signin">{i18next.t("member:here")}</Link>{" "}
              {i18next.t("member:to sign in.")}
            </p>
          </div>
        </div>
        <div className="dock_area">
          <div className="signup_methods">
            <div
              className="signup_method"
              onClick={() => this.props.history.push("/signup/sms")}
            >
              <div className="signup_method_icon signup_method_sms"></div>
              <div className="signup_method_label" style={{ width: 230 }}>
                {i18next.t("signup:Continue with Mobile Phone")}
              </div>
            </div>
            <div
              className="signup_method"
              onClick={() => this.props.history.push("/signup/email")}
            >
              <div className="signup_method_icon signup_method_email"></div>
              <div className="signup_method_label" style={{ width: 230 }}>
                {i18next.t("signup:Continue with Email")}
              </div>
            </div>
            {Conf.QQClientId !== "" ? (
              <div
                className="signup_method"
                onClick={() => Setting.getQQAuthCode("signup")}
              >
                <div className="signup_method_icon signup_method_qq"></div>
                <div className="signup_method_label" style={{ width: 230 }}>
                  {i18next.t("signup:Continue with QQ")}
                </div>
              </div>
            ) : null}
            {Conf.WechatClientId !== "" ? (
              <div
                className="signup_method"
                onClick={() => Setting.getWeChatAuthCode("signup")}
              >
                <div className="signup_method_icon signup_method_wechat"></div>
                <div className="signup_method_label" style={{ width: 230 }}>
                  {i18next.t("signup:Continue with WeChat")}
                </div>
              </div>
            ) : null}
            {Conf.GoogleClientId !== "" ? (
              <div
                className="signup_method"
                onClick={() => Setting.getGoogleAuthCode("signup")}
              >
                <div className="signup_method_icon signup_method_google"></div>
                <div className="signup_method_label" style={{ width: 230 }}>
                  {i18next.t("signup:Continue with Google")}
                </div>
              </div>
            ) : null}
            {Conf.GithubClientId !== "" ? (
              <div
                className="signup_method"
                onClick={() => Setting.getGithubAuthCode("signup")}
              >
                <div className="signup_method_icon signup_method_github"></div>
                <div className="signup_method_label" style={{ width: 230 }}>
                  {i18next.t("signup:Continue with Github")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(SignupBox);
