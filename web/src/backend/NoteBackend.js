// Copyright 2021 The casbin Authors. All Rights Reserved.
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

export function getNote(id) {
  return fetch(`${Setting.ServerUrl}/api/get-note?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getNotesByParent(parent) {
  return fetch(
    `${Setting.ServerUrl}/api/get-notes-by-parent?parent=${parent}`,
    {
      method: "GET",
      credentials: "include",
    }
  ).then((res) => res.json());
}

export function deleteNote(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-note?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateNote(note) {
  return fetch(`${Setting.ServerUrl}/api/update-note`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(note),
  }).then((res) => res.json());
}

export function addNote(note) {
  return fetch(`${Setting.ServerUrl}/api/add-note`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(note),
  }).then((res) => res.json());
}
