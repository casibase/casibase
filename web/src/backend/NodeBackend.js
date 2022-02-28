// Copyright 2020 The casbin Authors. All Rights Reserved.
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

export function getNodes() {
  return fetch(`${Setting.ServerUrl}/api/get-nodes`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNodesAdmin() {
  return fetch(`${Setting.ServerUrl}/api/get-nodes-admin`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNode(id) {
  return fetch(`${Setting.ServerUrl}/api/get-node?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateNode(id, node) {
  return fetch(`${Setting.ServerUrl}/api/update-node?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(node),
  }).then((res) => res.json());
}

export function addNode(node) {
  return fetch(`${Setting.ServerUrl}/api/add-node`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(node),
  }).then((res) => res.json());
}

export function deleteNode(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-node?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNodesNum() {
  return fetch(`${Setting.ServerUrl}/api/get-nodes-num`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNodeInfo(id) {
  return fetch(`${Setting.ServerUrl}/api/get-node-info?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNodeRelation(id) {
  return fetch(`${Setting.ServerUrl}/api/get-node-relation?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getLatestNode(limit) {
  return fetch(`${Setting.ServerUrl}/api/get-latest-node?limit=${limit}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getHotNode(limit) {
  return fetch(`${Setting.ServerUrl}/api/get-hot-node?limit=${limit}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function addNodeBrowseCount(id) {
  return fetch(`${Setting.ServerUrl}/api/add-node-browse-record?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function addNodeModerators(value) {
  return fetch(`${Setting.ServerUrl}/api/add-node-moderators`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(value),
  }).then((res) => res.json());
}

export function deleteNodeModerators(value) {
  return fetch(`${Setting.ServerUrl}/api/delete-node-moderators`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(value),
  }).then((res) => res.json());
}
