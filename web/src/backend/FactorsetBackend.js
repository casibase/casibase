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

export function getGlobalFactorsets() {
  return fetch(`${Setting.ServerUrl}/api/get-global-factorsets`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getFactorsets(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-factorsets?owner=${owner}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getFactorset(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-factorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getFactorsetGraph(owner, name, clusterNumber, distanceLimit) {
  return fetch(`${Setting.ServerUrl}/api/get-factorset-graph?id=${owner}/${encodeURIComponent(name)}&clusterNumber=${clusterNumber}&distanceLimit=${distanceLimit}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateFactorset(owner, name, factorset) {
  const newFactorset = Setting.deepCopy(factorset);
  return fetch(`${Setting.ServerUrl}/api/update-factorset?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newFactorset),
  }).then(res => res.json());
}

export function addFactorset(factorset) {
  const newFactorset = Setting.deepCopy(factorset);
  return fetch(`${Setting.ServerUrl}/api/add-factorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newFactorset),
  }).then(res => res.json());
}

export function deleteFactorset(factorset) {
  const newFactorset = Setting.deepCopy(factorset);
  return fetch(`${Setting.ServerUrl}/api/delete-factorset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newFactorset),
  }).then(res => res.json());
}
