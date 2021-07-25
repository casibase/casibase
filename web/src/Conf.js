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

export const AuthConfig = {
  // serverUrl: "https://door.casbin.com",
  serverUrl: "http://localhost:7001",
  clientId: "014ae4bd048734ca2dea",
  appName: "app-casbin-forum",
  organizationName: "casbin-forum",
};

export const FrontConfig = {
  forumName: "Casnode",
  logoImage: "https://cdn.casbin.com/forum/static/img/logo.png",
  logoFooterImage: "https://cdn.casbin.com/forum/static/img/logo-footer.png",
  logoFooterUrl: "https://www.digitalocean.com/",
  signinBoxStrong: "Casbin = way to authorization",
  signinBoxSpan: "A place for Casbin developers and users",
  footerDeclaration: "World is powered by code",
  footerAdvise: "♥ Do have faith in what you're doing.",
};

export const ShowGithubCorner = true;
export const GithubRepo = "https://github.com/casbin/casnode";

export const Domain = "forum.casbin.com";

export const ForceLanguage = "";
export const DefaultLanguage = "en";

// Support: richtext | markdown
export const DefaultEditorType = "markdown";

//Default search engine
//Support: baidu(www.baidu.com) | google(www.google.com) | cn-bing(cn.bing.com)
export const DefaultSearchSite = "google";

export const EnableNotificationAutoUpdate = false;

export const NotificationAutoUpdatePeriod = 10; // second

export const DefaultTopicPageReplyNum = 100;
