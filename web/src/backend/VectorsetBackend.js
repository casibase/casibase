// Copyright 2023 The casbin Authors. All Rights Reserved.
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

export function getGlobalVectorsets() {
  return fetch(`${Setting.ServerUrl}/api/get-global-vectorsets`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorsets(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorsets?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorset(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getVectorsetGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-vectorset-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateVectorset(owner, name, vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/update-vectorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}

export function addVectorset(vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/add-vectorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}

export function deleteVectorset(vectorset) {
  const newVectorset = Setting.deepCopy(vectorset);
  return fetch(`${Setting.ServerUrl}/api/delete-vectorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newVectorset),
  }).then(res => res.json());
}
