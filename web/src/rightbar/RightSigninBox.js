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
import * as Conf from "../Conf";
import { withRouter, Link } from "react-router-dom";
import "./rightSignin.css";
import i18next from "i18next";

class RightSigninBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    if (window.location.pathname === "/signin") {
      return (
        <div class="box">
          <div class="header">{i18next.t("bar:Other Sign In Methods")}</div>
          {Conf.QQClientId !== "" ? (
            <div className="cell" style={{ textAlign: "center" }}>
              <div
                className="signin_method"
                onClick={() => Setting.getQQAuthCode("signup")}
              >
                <div className="signin_method_icon signin_method_qq"></div>
                <div className="signin_method_label" style={{ width: 140 }}>
                  {i18next.t("signin:Sign in with QQ")}
                </div>
              </div>
            </div>
          ) : null}
          {Conf.WechatClientId !== "" ? (
            <div className="cell" style={{ textAlign: "center" }}>
              <div
                className="signin_method"
                onClick={() => Setting.getWeChatAuthCode("signup")}
              >
                <div className="signin_method_icon signin_method_wechat"></div>
                <div className="signin_method_label" style={{ width: 140 }}>
                  {i18next.t("signin:Sign in with WeChat")}
                </div>
              </div>
            </div>
          ) : null}
          {Conf.GoogleClientId !== "" ? (
            <div className="cell" style={{ textAlign: "center" }}>
              <div
                className="signin_method"
                onClick={() => Setting.getGoogleAuthCode("signup")}
              >
                <div className="signin_method_icon signin_method_google"></div>
                <div className="signin_method_label" style={{ width: 140 }}>
                  {i18next.t("signin:Sign in with Google")}
                </div>
              </div>
            </div>
          ) : null}
          {Conf.GithubClientId !== "" ? (
            <div className="cell" style={{ textAlign: "center" }}>
              <div
                className="signin_method"
                onClick={() => Setting.getGithubAuthCode("signup")}
              >
                <div className="signin_method_icon signin_method_github"></div>
                <div className="signin_method_label" style={{ width: 140 }}>
                  {i18next.t("signin:Sign in with Github")}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="box">
        <div className="cell">
          <strong>Casbin = way to authorization</strong>
          <div className="sep5" />
          <span className="fade">A place for Casbin developers and users</span>
        </div>
        <div className="inner">
          <div className="sep5" />
          <div align="center">
            <Link to="/signup" className="super normal button">
              {i18next.t("bar:Sign Up Now")}
            </Link>
            <div className="sep5" />
            <div className="sep10" />
            {i18next.t("bar:For Existing Member")} &nbsp;
            <Link to="/signin">{i18next.t("bar:Sign In")}</Link>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(RightSigninBox);
