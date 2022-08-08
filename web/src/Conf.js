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
  organizationName: "casbin",
  appName: "app-casnode",
  redirectPath: "/callback",
};

export const FrontConfig = {
  forumName: "",
  logoImage: "",
  footerLogoImage: "",
  footerLogoUrl: "",
  signinBoxStrong: "",
  signinBoxSpan: "",
  footerDeclaration: "",
  footerAdvise: "",
};

export const ShowEmbedButtons = false;

export const ShowGithubCorner = false;
export const GithubRepo = "https://github.com/casbin/casnode";

export const Domain = "forum.casbin.com";

export const ForceLanguage = "";
export const DefaultLanguage = "en";

// Support: richtext | markdown
export const DefaultEditorType = "markdown";

// attachment file can be no larger than 20MB by default
export const AttachmentSizeLimitInMb = 20;

// Default search engine
// Support: baidu(www.baidu.com) | google(www.google.com) | cn-bing(cn.bing.com)
export const DefaultSearchSite = "google";

export const EnableNotificationAutoUpdate = false;

export const NotificationAutoUpdatePeriod = 10; // second

export const DefaultTopicPageReplyNum = 100;

export const ReplyMaxDepth = 10;
export const ReplyMobileMaxDepth = 3;

export const AvatarAnonymousUrl = "https://cdn.casbin.com/avatar-pool/anonymous.png";
export const AvatarErrorUrl = "https://cdn.casbin.com/avatar-pool/error.png";

export const ShowLoadingIndicator = false;
