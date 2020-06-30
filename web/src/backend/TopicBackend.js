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

export function getTopics() {
  return fetch(`${Setting.ServerUrl}/api/get-topics`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function getTopic(id) {
  return fetch(`${Setting.ServerUrl}/api/get-topic?id=${id}`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function updateTopic(id, topic) {
  return fetch(`${Setting.ServerUrl}/api/update-topic?id=${id}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(topic),
  }).then(res => res.json());
}

export function addTopic(topic) {
  return fetch(`${Setting.ServerUrl}/api/add-topic`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(topic),
  }).then(res => res.json());
}

export function deleteTopic(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-topic?id=${id}`, {
    method: 'POST',
    credentials: 'include',
  }).then(res => res.json());
}

export function getAllCreatedTopics(id, tab, limit, page) {
  return fetch(`${Setting.ServerUrl}/api/get-all-created-topics?id=${id}&tab=${tab}&limit=${limit}&page=${page}`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json());
}

export function getTopicsWithNode(nodeId, limit, page) {
  return fetch(`${Setting.ServerUrl}/api/get-topics-by-node?node-id=${nodeId}&limit=${limit}&page=${page}`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json());
}
