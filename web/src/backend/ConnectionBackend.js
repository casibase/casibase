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
import {Connected} from "../ConnectionListPage";

export function getConnections(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "", status = Connected) {
  return fetch(`${Setting.ServerUrl}/api/get-connections?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}&status=${status}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getConnection(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-connection?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateConnection(owner, name, connection) {
  const newConnection = Setting.deepCopy(connection);
  return fetch(`${Setting.ServerUrl}/api/update-connection?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newConnection),
  }).then(res => res.json());
}

export function addNodeTunnel(nodeId, mode = "guacd") {
  return fetch(`${Setting.ServerUrl}/api/add-node-tunnel?nodeId=${nodeId}&mode=${mode}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

export function deleteConnection(connection) {
  const newConnection = Setting.deepCopy(connection);
  return fetch(`${Setting.ServerUrl}/api/delete-connection`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newConnection),
  }).then(res => res.json());
}

export function connect(connectionId) {
  return fetch(`${Setting.ServerUrl}/api/start-connection?id=${connectionId}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

export function disconnect(connectionId) {
  return fetch(`${Setting.ServerUrl}/api/stop-connection?id=${connectionId}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}
