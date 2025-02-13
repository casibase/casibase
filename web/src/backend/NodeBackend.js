// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

export function getNodes(page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-nodes?p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getNode(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-node?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateNode(owner, name, node) {
  const newNode = Setting.deepCopy(node);
  return fetch(`${Setting.ServerUrl}/api/update-node?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newNode),
  }).then(res => res.json());
}

export function addNode(node) {
  const newNode = Setting.deepCopy(node);
  return fetch(`${Setting.ServerUrl}/api/add-node`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newNode),
  }).then(res => res.json());
}

export function deleteNode(node) {
  const newNode = Setting.deepCopy(node);
  return fetch(`${Setting.ServerUrl}/api/delete-node`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newNode),
  }).then(res => res.json());
}
