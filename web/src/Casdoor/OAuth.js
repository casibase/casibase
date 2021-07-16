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

// This file refers to Casdoor
// Casdoor/web/src/auth/Util.js
// Casdoor/web/src/auth/Provider.js

const GoogleAuthScope = "profile+email";
const GoogleAuthUri = "https://accounts.google.com/signin/oauth";

const GithubAuthScope = "user:email+read:user";
const GithubAuthUri = "https://github.com/login/oauth/authorize";

const QqAuthScope = "get_user_info";
const QqAuthUri = "https://graph.qq.com/oauth2.0/authorize";

const WeChatAuthScope = "snsapi_login";
const WeChatAuthUri = "https://open.weixin.qq.com/connect/qrconnect";

const FacebookAuthScope = "email,public_profile";
const FacebookAuthUri = "https://www.facebook.com/dialog/oauth";

// const DingTalkAuthScope = "email,public_profile";
const DingTalkAuthUri =
  "https://oapi.dingtalk.com/connect/oauth2/sns_authorize";

const WeiboAuthScope = "email";
const WeiboAuthUri = "https://api.weibo.com/oauth2/authorize";

const GiteeAuthScope = "user_info,emails";
const GiteeAuthUri = "https://gitee.com/oauth/authorize";

function getAuthUrl(casdoor, provider, method, redirectUri) {
  if (casdoor.application === null || provider === null) {
    return "";
  }

  const state = getQueryParamsToState(casdoor, provider, method, redirectUri);
  if (provider.type === "Google") {
    return `${GoogleAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${GoogleAuthScope}&response_type=code&state=${state}`;
  } else if (provider.type === "GitHub") {
    return `${GithubAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${GithubAuthScope}&response_type=code&state=${state}`;
  } else if (provider.type === "QQ") {
    return `${QqAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${QqAuthScope}&response_type=code&state=${state}`;
  } else if (provider.type === "WeChat") {
    return `${WeChatAuthUri}?appid=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${WeChatAuthScope}&response_type=code&state=${state}#wechat_redirect`;
  } else if (provider.type === "Facebook") {
    return `${FacebookAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${FacebookAuthScope}&response_type=code&state=${state}`;
  } else if (provider.type === "DingTalk") {
    return `${DingTalkAuthUri}?appid=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=snsapi_login&response_type=code&state=${state}`;
  } else if (provider.type === "Weibo") {
    return `${WeiboAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${WeiboAuthScope}&response_type=code&state=${state}`;
  } else if (provider.type === "Gitee") {
    return `${GiteeAuthUri}?client_id=${provider.clientId}&redirect_uri=${casdoor.endpoint}/callback&scope=${GiteeAuthScope}&response_type=code&state=${state}`;
  }
}

function getQueryParamsToState(casdoor, provider, method, redirectUri) {
  let query = window.location.search;
  query = `${query}&client_id=${casdoor.clientId}&application=${casdoor.application.name}&provider=${provider.name}&method=${method}&redirect_uri=${redirectUri}&response_type=code`;
  if (method === "link") {
    query = `${query}&from=${window.location.pathname}`;
  }
  return btoa(query);
}

export class CasdoorOAuthObject {
  constructor(casdoor, provider, method, redirectUri) {
    this.type = provider.type;
    this.link = getAuthUrl(casdoor, provider, method, redirectUri);
  }
}
