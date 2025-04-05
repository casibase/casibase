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

export function getGlobalTasks() {
  return fetch(`${Setting.ServerUrl}/api/get-global-tasks`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getTasks(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-tasks?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getTask(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-task?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateTask(owner, name, task) {
  const newTask = Setting.deepCopy(task);
  return fetch(`${Setting.ServerUrl}/api/update-task?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTask),
  }).then(res => res.json());
}

export function addTask(task) {
  const newTask = Setting.deepCopy(task);
  return fetch(`${Setting.ServerUrl}/api/add-task`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTask),
  }).then(res => res.json());
}

export function deleteTask(task) {
  const newTask = Setting.deepCopy(task);
  return fetch(`${Setting.ServerUrl}/api/delete-task`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTask),
  }).then(res => res.json());
}
