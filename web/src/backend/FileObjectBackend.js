// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

export function getGlobalFileObjects(page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-global-file-objects?p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getFileObjects(owner, store = "") {
  return fetch(`${Setting.ServerUrl}/api/get-file-objects?owner=${owner}&store=${store}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getFileObject(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-file-object?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateFileObject(owner, name, fileObject) {
  const newFileObject = Setting.deepCopy(fileObject);
  return fetch(`${Setting.ServerUrl}/api/update-file-object?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileObject),
  }).then(res => res.json());
}

export function addFileObject(fileObject) {
  const newFileObject = Setting.deepCopy(fileObject);
  return fetch(`${Setting.ServerUrl}/api/add-file-object`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileObject),
  }).then(res => res.json());
}

export function deleteFileObject(fileObject) {
  const newFileObject = Setting.deepCopy(fileObject);
  return fetch(`${Setting.ServerUrl}/api/delete-file-object`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileObject),
  }).then(res => res.json());
}
