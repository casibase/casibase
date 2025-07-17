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

export function getTemplates(owner) {
  return fetch(`${Setting.ServerUrl}/api/get-templates?owner=${owner}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getTemplate(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-template?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateTemplate(owner, name, template) {
  const newTemplate = Setting.deepCopy(template);
  return fetch(`${Setting.ServerUrl}/api/update-template?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTemplate),
  }).then(res => res.json());
}

export function addTemplate(template) {
  const newTemplate = Setting.deepCopy(template);
  return fetch(`${Setting.ServerUrl}/api/add-template`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTemplate),
  }).then(res => res.json());
}

export function deleteTemplate(template) {
  const newTemplate = Setting.deepCopy(template);
  return fetch(`${Setting.ServerUrl}/api/delete-template`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newTemplate),
  }).then(res => res.json());
}

export function deployTemplate(deploymentData) {
  return fetch(`${Setting.ServerUrl}/api/deploy-template`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(deploymentData),
  }).then(res => res.json());
}

export function deleteDeployment(deploymentData) {
  return fetch(`${Setting.ServerUrl}/api/delete-deployment`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(deploymentData),
  }).then(res => res.json());
}

export function getK8sConfig() {
  return fetch(`${Setting.ServerUrl}/api/get-k8s-config`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function testK8sConnection() {
  return fetch(`${Setting.ServerUrl}/api/test-k8s-connection`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getDeploymentStatus(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-deployment-status?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}
