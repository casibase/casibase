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

export function getScans(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-scans?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getScan(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-scan?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateScan(owner, name, scan) {
  const newScan = Setting.deepCopy(scan);
  return fetch(`${Setting.ServerUrl}/api/update-scan?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newScan),
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function addScan(scan) {
  const newScan = Setting.deepCopy(scan);
  return fetch(`${Setting.ServerUrl}/api/add-scan`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newScan),
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function deleteScan(scan) {
  const newScan = Setting.deepCopy(scan);
  return fetch(`${Setting.ServerUrl}/api/delete-scan`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newScan),
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function startScan(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/start-scan?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function scanAsset(providerId, scanId, targetMode, target, asset, command, saveToScan) {
  let url = `${Setting.ServerUrl}/api/scan-asset?providerId=${encodeURIComponent(providerId)}&targetMode=${encodeURIComponent(targetMode)}`;

  if (scanId) {
    url += `&scanId=${encodeURIComponent(scanId)}`;
  }
  if (target) {
    url += `&target=${encodeURIComponent(target)}`;
  }
  if (asset) {
    url += `&asset=${encodeURIComponent(asset)}`;
  }
  if (command) {
    url += `&command=${encodeURIComponent(command)}`;
  }
  if (saveToScan !== undefined) {
    url += `&saveToScan=${saveToScan}`;
  }

  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}
