// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

export function getHospitals(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-hospitals?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getHospital(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-hospital?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateHospital(owner, name, hospital) {
  const newHospital = Setting.deepCopy(hospital);
  return fetch(`${Setting.ServerUrl}/api/update-hospital?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newHospital),
  }).then(res => res.json());
}

export function addHospital(hospital) {
  const newHospital = Setting.deepCopy(hospital);
  return fetch(`${Setting.ServerUrl}/api/add-hospital`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newHospital),
  }).then(res => res.json());
}

export function deleteHospital(hospital) {
  const newHospital = Setting.deepCopy(hospital);
  return fetch(`${Setting.ServerUrl}/api/delete-hospital`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newHospital),
  }).then(res => res.json());
}
