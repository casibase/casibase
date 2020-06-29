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

export function getMembers() {
  return fetch(`${Setting.ServerUrl}/api/get-members`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function getMember(id) {
  return fetch(`${Setting.ServerUrl}/api/get-member?id=${id}`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.json());
}

export function updateMember(id, member) {
  return fetch(`${Setting.ServerUrl}/api/update-member?id=${id}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(member),
  }).then(res => res.json());
}

export function addMember(member) {
  return fetch(`${Setting.ServerUrl}/api/add-member`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(member),
  }).then(res => res.json());
}

export function deleteMember(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-member?id=${id}`, {
    method: 'POST',
    credentials: 'include',
  }).then(res => res.json());
}

export function googleLogin(code, state, redirectUrl) {
  return fetch(`${Setting.ServerUrl}/api/auth/google?code=${code}&state=${state}&redirect_url=${redirectUrl}`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json());
}
  