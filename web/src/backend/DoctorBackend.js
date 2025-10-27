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

export function getDoctors(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-doctors?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function getDoctor(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-doctor?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function updateDoctor(owner, name, doctor) {
  const newDoctor = Setting.deepCopy(doctor);
  return fetch(`${Setting.ServerUrl}/api/update-doctor?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newDoctor),
  }).then(res => res.json());
}

export function addDoctor(doctor) {
  const newDoctor = Setting.deepCopy(doctor);
  return fetch(`${Setting.ServerUrl}/api/add-doctor`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newDoctor),
  }).then(res => res.json());
}

export function deleteDoctor(doctor) {
  const newDoctor = Setting.deepCopy(doctor);
  return fetch(`${Setting.ServerUrl}/api/delete-doctor`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newDoctor),
  }).then(res => res.json());
}
