// Copyright 2024 The casbin Authors. All Rights Reserved.
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

import * as Setting from "../Setting";

export function getUsages(serverUrl, days, user) {
  if (serverUrl === "") {
    serverUrl = Setting.ServerUrl;
  }

  return fetch(`${serverUrl}/api/get-usages?days=${days}&user=${user}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getRangeUsages(serverUrl, rangeType, count, user) {
  if (serverUrl === "") {
    serverUrl = Setting.ServerUrl;
  }

  return fetch(`${serverUrl}/api/get-range-usages?rangeType=${rangeType}&count=${count}&user=${user}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getUsagesUser(serverUrl) {
  if (serverUrl === "") {
    serverUrl = Setting.ServerUrl;
  }

  return fetch(`${serverUrl}/api/get-usages-user`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}
