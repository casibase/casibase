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

export function getApplications(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-applications?owner=${owner}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getApplication(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-application?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateApplication(owner, name, application) {
  return fetch(`${Setting.ServerUrl}/api/update-application?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(application),
  }).then(res => res.json());
}

export function addApplication(application) {
  return fetch(`${Setting.ServerUrl}/api/add-application`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(application),
  }).then(res => res.json());
}

export function deleteApplication(application) {
  return fetch(`${Setting.ServerUrl}/api/delete-application`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(application),
  }).then(res => res.json());
}

export function deployApplication(deploymentRequest) {
  return fetch(`${Setting.ServerUrl}/api/deploy-application`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(deploymentRequest),
  }).then(res => res.json());
}

export function undeployApplication(deploymentRequest) {
  return fetch(`${Setting.ServerUrl}/api/undeploy-application`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(deploymentRequest),
  }).then(res => res.json());
}

export function getApplicationStatus(id) {
  return fetch(`${Setting.ServerUrl}/api/get-application-status?id=${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}
