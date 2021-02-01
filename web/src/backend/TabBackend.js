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

export function getTabs() {
  return fetch(`${Setting.ServerUrl}/api/get-tabs`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getTabWithNode(id) {
  return fetch(`${Setting.ServerUrl}/api/get-tab-with-nodes?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getTabNodes(id) {
  return fetch(`${Setting.ServerUrl}/api/get-tab-nodes?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getAllTabs() {
  return fetch(`${Setting.ServerUrl}/api/get-all-tabs`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getTabsAdmin() {
  return fetch(`${Setting.ServerUrl}/api/get-tabs-admin`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getTabAdmin(id) {
  return fetch(`${Setting.ServerUrl}/api/get-tab-admin?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateTab(id, tab) {
  return fetch(`${Setting.ServerUrl}/api/update-tab?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(tab),
  }).then((res) => res.json());
}

export function addTab(tab) {
  return fetch(`${Setting.ServerUrl}/api/add-tab`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(tab),
  }).then((res) => res.json());
}

export function deleteTab(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-tab?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}
