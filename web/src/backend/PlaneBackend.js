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

export function getPlaneList() {
  return fetch(`${Setting.ServerUrl}/api/get-plane-list`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getPlaneAdmin(id) {
  return fetch(`${Setting.ServerUrl}/api/get-plane-admin?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getPlanesAdmin() {
  return fetch(`${Setting.ServerUrl}/api/get-planes-admin`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function deletePlane(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-plane?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function updatePlane(id, plane) {
  return fetch(`${Setting.ServerUrl}/api/update-plane?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(plane),
  }).then((res) => res.json());
}

export function addPlane(plane) {
  return fetch(`${Setting.ServerUrl}/api/add-plane`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(plane),
  }).then((res) => res.json());
}
