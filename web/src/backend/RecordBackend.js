// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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

export function getRecords(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-records?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getRecord(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-record?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateRecord(owner, name, record) {
  const newRecord = Setting.deepCopy(record);
  return fetch(`${Setting.ServerUrl}/api/update-record?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newRecord),
  }).then(res => res.json());
}

export function addRecord(record) {
  const newRecord = Setting.deepCopy(record);
  return fetch(`${Setting.ServerUrl}/api/add-record`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newRecord),
  }).then(res => res.json());
}

export function deleteRecord(record) {
  const newRecord = Setting.deepCopy(record);
  return fetch(`${Setting.ServerUrl}/api/delete-record`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newRecord),
  }).then(res => res.json());
}

export function commitRecord(record) {
  const newRecord = Setting.deepCopy(record);
  return fetch(`${Setting.ServerUrl}/api/commit-record`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newRecord),
  }).then(res => res.json());
}

export function queryRecord(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/query-record?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}
