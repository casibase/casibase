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

import * as Setting from "../Setting";

export function updateTranslator(translator) {
  return fetch(`${Setting.ServerUrl}/api/update-translator`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(translator),
  }).then((res) => res.json());
}

export function getTranslator() {
  return fetch(`${Setting.ServerUrl}/api/get-translator`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function addTranslator(translator) {
  return fetch(`${Setting.ServerUrl}/api/add-translator`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(translator),
  }).then((res) => res.json());
}

export function delTranslator(id) {
  return fetch(`${Setting.ServerUrl}/api/del-translator?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function visibleTranslator() {
  return fetch(`${Setting.ServerUrl}/api/visible-translator`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}
