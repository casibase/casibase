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
import * as Auth from "../auth/Auth";
import * as Conf from "../Conf";
import i18next from "i18next";
import "./rightSignin.css";

class RightSigninBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  redirectTo(link) {
    window.location.href = link;
  }

  renderWechatSignin(link) {
    return (
      <div className="cell" style={{ textAlign: "center" }}>
        <div className="signin_method" onClick={() => this.redirectTo(link)}>
          <div className="signin_method_icon signin_method_wechat" />
          <div className="signin_method_label" style={{ width: 140 }}>
            {i18next.t("signin:Sign in with WeChat")}
          </div>
        </div>
      </div>
    );
  }

  renderGoogleSignin(link) {
    return (
      <div className="cell" style={{ textAlign: "center" }}>
        <div className="signin_method" onClick={() => this.redirectTo(link)}>
          <div className="signin_method_icon signin_method_google" />
          <div className="signin_method_label" style={{ width: 140 }}>
            {i18next.t("signin:Sign in with Google")}
          </div>
        </div>
      </div>
    );
  }

  renderGithubSignin(link) {
    return (
      <div className="cell" style={{ textAlign: "center" }}>
        <div className="signin_method" onClick={() => this.redirectTo(link)}>
          <div className="signin_method_icon signin_method_github" />
          <div className="signin_method_label" style={{ width: 140 }}>
            {i18next.t("signin:Sign in with Github")}
          </div>
        </div>
      </div>
    );
  }

  renderQQSignin(link) {
    return (
      <div className="cell" style={{ textAlign: "center" }}>
        <div className="signin_method" onClick={() => this.redirectTo(link)}>
          <div className="signin_method_icon signin_method_qq" />
          <div className="signin_method_label" style={{ width: 140 }}>
            {i18next.t("signin:Sign in with QQ")}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (
      window.location.pathname === "/signin" &&
      this.props.OAuthObjects !== undefined &&
      this.props.OAuthObjects !== null &&
      this.props.OAuthObjects.length !== 0
    ) {
      return (
        <div className="box">
          <div className="header">{i18next.t("bar:Other Sign In Methods")}</div>
          {this.props.OAuthObjects.map((obj) => {
            switch (obj.type) {
              case "Google":
                return this.renderGoogleSignin(obj.link);
              case "GitHub":
                return this.renderGithubSignin(obj.link);
              case "WeChat":
                return this.renderWechatSignin(obj.link);
              case "QQ":
                return this.renderQQSignin(obj.link);
              default:
                return null;
            }
          })}
        </div>
      );
    }

    return (
      <div className="box">
        <div className="cell">
          <strong>{Conf.FrontConfig.signinBoxStrong}</strong>
          <div className="sep5" />
          <span className="fade">{Conf.FrontConfig.signinBoxSpan}</span>
        </div>
        <div className="inner">
          <div className="sep5" />
          <div align="center">
            <a href={Auth.getSignupUrl()} className="super normal button">
              {i18next.t("bar:Sign Up Now")}
            </a>
            <div className="sep5" />
            <div className="sep10" />
            {i18next.t("bar:For Existing Member")} &nbsp;
            <a href={Auth.getSigninUrl()}>{i18next.t("bar:Sign In")}</a>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(RightSigninBox);
