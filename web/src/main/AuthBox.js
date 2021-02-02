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
import * as MemberBackend from "../backend/MemberBackend";
import { withRouter } from "react-router-dom";
import i18next from "i18next";

class CallbackBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      authType: props.match.params.authType,
      addition: props.match.params.addition,
      state: "",
      code: "",
      isAuthenticated: false,
      isSignedUp: false,
      email: "",
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.code = params.get("code");
    this.state.state = params.get("state");
  }

  getAuthenticatedInfo() {
    let redirectUrl;
    redirectUrl = `${Setting.ClientUrl}/callback/${this.state.authType}/${this.state.addition}`;
    switch (this.state.authType) {
      case "google":
        MemberBackend.googleLogin(
          this.state.code,
          this.state.state,
          redirectUrl,
          this.state.addition
        ).then((res) => {
          if (res.status === "ok") {
            if (this.state.addition === "link") {
              if (res.data) {
                window.location.href = "/settings";
                return;
              }
            }
            if (!res.data.isAuthenticated) {
              window.location.href = "/signup";
              return;
            }
            if (!res.data.isSignedUp) {
              window.location.href = `/settings/username?email=${res.data.email}&method=google&addition=${res.data.addition}&avatar=${res.data.avatar}`;
              return;
            }
            window.location.href = "/";
          } else {
            alert(i18next.t(`error:${res?.msg}`));
            Setting.showMessage("error", i18next.t(`error:${res?.msg}`));
          }
        });
        break;
      case "github":
        MemberBackend.githubLogin(
          this.state.code,
          this.state.state,
          redirectUrl,
          this.state.addition
        ).then((res) => {
          if (res.status === "ok") {
            if (this.state.addition === "link") {
              if (res.data) {
                window.location.href = "/settings";
                return;
              }
            }
            if (!res.data.isAuthenticated) {
              window.location.href = "/signup";
              return;
            }
            if (!res.data.isSignedUp) {
              window.location.href = `/settings/username?email=${res.data.email}&method=github&addition=${res.data.addition}&avatar=${res.data.avatar}`;
              return;
            }
            window.location.href = "/";
          } else {
            alert(i18next.t(`error:${res?.msg}`));
            Setting.showMessage("error", i18next.t(`error:${res?.msg}`));
          }
        });
        break;
      case "qq":
        MemberBackend.qqLogin(
          this.state.code,
          this.state.state,
          redirectUrl,
          this.state.addition
        ).then((res) => {
          if (res.status === "ok") {
            if (this.state.addition === "link") {
              if (res.data) {
                window.location.href = "/settings";
                return;
              }
            }
            if (!res.data.isAuthenticated) {
              window.location.href = "/signup";
              return;
            }
            if (!res.data.isSignedUp) {
              window.location.href = `/settings/username?email=${res.data.email}&method=qq&addition=${res.data.addition}&addition2=${res.data2}&avatar=${res.data.avatar}`;
              return;
            }
            window.location.href = "/";
          } else {
            alert(i18next.t(`error:${res?.msg}`));
            Setting.showMessage("error", i18next.t(`error:${res?.msg}`));
          }
        });
        break;
      case "wechat":
        MemberBackend.wechatLogin(
          this.state.code,
          this.state.state,
          redirectUrl,
          this.state.addition
        ).then((res) => {
          if (res.status === "ok") {
            if (this.state.addition === "link") {
              if (res.data) {
                window.location.href = "/settings";
                return;
              }
            }
            if (!res.data.isAuthenticated) {
              window.location.href = "/signup";
              return;
            }
            if (!res.data.isSignedUp) {
              window.location.href = `/settings/username?email=${res.data.email}&method=wechat&addition=${res.data.addition}&addition2=${res.data2}&avatar=${res.data.avatar}`;
              return;
            }
            window.location.href = "/";
          } else {
            alert(i18next.t(`error:${res?.msg}`));
            Setting.showMessage("error", i18next.t(`error:${res?.msg}`));
          }
        });
        break;
    }
  }

  componentDidMount() {
    this.getAuthenticatedInfo();
  }

  render() {
    return (
      <div>
        <h3>{i18next.t("loading:Logging in ...")}</h3>
      </div>
    );
  }
}

export default withRouter(CallbackBox);
