// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

export function getGlobalPermissions() {
  return fetch(`${Setting.ServerUrl}/api/get-global-permissions`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getPermissions(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-permissions?owner=${owner}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getPermission(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-permission?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updatePermission(owner, name, permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/update-permission?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}

export function addPermission(permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/add-permission`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}

export function deletePermission(permission) {
  const newPermission = Setting.deepCopy(permission);
  return fetch(`${Setting.ServerUrl}/api/delete-permission`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newPermission),
  }).then(res => res.json());
}
