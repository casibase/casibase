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

import { CasdoorOAuthObject } from "./OAuth";

export class Casdoor {
  constructor(endpoint, organization, application, clientId, redirectUri) {
    if (endpoint === "http://localhost:7001") {
      // if Casdoor runs on port 7001 localhost, we think we are in dev mode
      endpoint = "http://localhost:8000";
    }
    this.endpoint = endpoint;
    this.organizationName = organization;
    this.applicationName = application;
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  connect() {
    return fetch(
      `${this.endpoint}/api/get-app-login?clientId=${this.clientId}&responseType=code&redirectUri=${this.redirectUri}&scope=read&state=${this.application}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "ok") return;
        this.application = res.data;
        return this;
      });
  }

  signin(username, password, remember) {
    if (this.application === undefined) return;
    if (this.application === null) return;
    if (!this.application.enablePassword) return;

    let values = {};
    values["application"] = this.applicationName;
    values["organization"] = this.organizationName;
    values["username"] = username;
    values["password"] = password;
    values["remember"] = remember;
    values["autoSignin"] = remember;
    values["type"] = "code";

    return fetch(
      `${this.endpoint}/api/login?clientId=${this.clientId}&responseType=code&redirectUri=${this.redirectUri}$scope=read&state=${this.applicationName}`,
      {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(values),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.status !== "ok") return res.msg;
        let code = res.data;
        window.location.href = `${this.redirectUri}?code=${code}&state=${this.applicationName}`;
        return "";
      });
  }

  getCaptcha() {
    return fetch(`${this.endpoint}/api/get-human-check`, {
      method: "GET",
      credentials: "include",
    }).then((res) => res.json());
  }

  sendCode(captchaId, captchaCode, type, dest) {
    let fd = new FormData();
    fd.append("checkType", "captcha");
    fd.append("checkId", captchaId);
    fd.append("checkKey", captchaCode);
    fd.append("dest", dest);
    fd.append("type", type);
    fd.append("organizationId", `admin/${this.organizationName}`);
    return fetch(`${this.endpoint}/api/send-verification-code`, {
      method: "POST",
      credentials: "include",
      body: fd,
    })
      .then((res) => res.json())
      .then((res) => {
        return res.status === "ok";
      });
  }

  sendPhoneCode(captchaId, captchaCode, phone) {
    return this.sendCode(captchaId, captchaCode, "phone", phone);
  }

  sendEmailCode(captchaId, captchaCode, email) {
    return this.sendCode(captchaId, captchaCode, "email", email);
  }

  signup(
    username,
    displayName,
    password,
    email,
    emailCode,
    phone,
    phoneCode,
    phonePrefix
  ) {
    let data = {};
    data["agreement"] = true;
    data["application"] = this.applicationName;
    data["organization"] = this.organizationName;
    data["password"] = password;
    data["confirm"] = password;
    data["email"] = email;
    data["emailCode"] = emailCode;
    data["username"] = username;
    data["name"] = displayName;
    data["phone"] = phone;
    data["phoneCode"] = phoneCode;
    data["phonePrefix"] = phonePrefix;
    return fetch(`${this.endpoint}/api/signup`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        return res.msg;
      });
  }

  getOAuthSigninObjects() {
    let ret = [];
    if (this.application === undefined || this.application === null) return ret;
    let providers = this.application.providers;
    if (providers === undefined || providers === null) return ret;
    providers.forEach((provider) => {
      if (provider.canSignIn) {
        ret.push(
          new CasdoorOAuthObject(
            this,
            provider.provider,
            "signup",
            this.redirectUri
          )
        );
      }
    });
    return ret;
  }
}
