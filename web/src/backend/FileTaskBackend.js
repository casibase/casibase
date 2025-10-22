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

export function getGlobalFileTasks() {
  return fetch(`${Setting.ServerUrl}/api/get-global-file-tasks`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getFileTasks(owner, store) {
  return fetch(`${Setting.ServerUrl}/api/get-file-tasks?owner=${owner}${store ? `&store=${store}` : ""}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getFileTask(id) {
  return fetch(`${Setting.ServerUrl}/api/get-file-task?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getFileTaskByFileKey(store, fileKey) {
  return fetch(`${Setting.ServerUrl}/api/get-file-task-by-file-key?store=${store}&fileKey=${encodeURIComponent(fileKey)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateFileTask(id, fileTask) {
  const newFileTask = Setting.deepCopy(fileTask);
  return fetch(`${Setting.ServerUrl}/api/update-file-task?id=${id}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileTask),
  }).then(res => res.json());
}

export function addFileTask(fileTask) {
  const newFileTask = Setting.deepCopy(fileTask);
  return fetch(`${Setting.ServerUrl}/api/add-file-task`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileTask),
  }).then(res => res.json());
}

export function deleteFileTask(fileTask) {
  const newFileTask = Setting.deepCopy(fileTask);
  return fetch(`${Setting.ServerUrl}/api/delete-file-task`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newFileTask),
  }).then(res => res.json());
}
