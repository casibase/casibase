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

export function getFrontConfById(id) {
  return fetch(`${Setting.ServerUrl}/api/get-front-conf-by-id?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getFrontConfsByField(field) {
  return fetch(`${Setting.ServerUrl}/api/get-front-confs-by-field?field=${field}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateFrontConfById(id, value) {
  return fetch(`${Setting.ServerUrl}/api/update-front-conf-by-id?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(value),
  }).then((res) => res.json());
}

export function updateFrontConfsByField(field, confs) {
  return fetch(`${Setting.ServerUrl}/api/update-front-confs-by-field?field=${field}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(confs),
  }).then((res) => res.json());
}

export function restoreFrontConfs(field) {
  return fetch(`${Setting.ServerUrl}/api/restore-front-confs?field=${field}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}
