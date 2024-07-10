// Copyright 2024 The casbin Authors. All Rights Reserved.
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

export function getAllScans() {
  return fetch(`${Setting.ServerUrl}/api/get-scans`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getAScan(id) {
  return fetch(`${Setting.ServerUrl}/api/get-a-scan?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function deleteAssetsScan(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-a-scan?id=${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function saveAssetsScanConfig(scan) {
  const newScan = Setting.deepCopy(scan);
  return fetch(`${Setting.ServerUrl}/api/save-assets-config`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newScan),
  }).then(res => res.json());
}

// export function startScan(id) {
//   return fetch(`${Setting.ServerUrl}/api/start-scan?id=${id}`, {
//     method: "GET",
//     credentials: "include",
//     headers: {
//       "Accept-Language": Setting.getAcceptLanguage(),
//     },
//   }).then(res => res.json());
// }

export function startScan(id, onStart, onMessage, onEnd, onError) {
  const eventSource = new EventSource(`${Setting.ServerUrl}/api/start-scan?id=${id}`);

  eventSource.addEventListener("start", (event) => {
    onStart(event);
  });

  eventSource.onmessage = (event) => {
    onMessage(event);
  };

  eventSource.addEventListener("error", (event) => {
    eventSource.close();
    onError(event);
  });

  eventSource.addEventListener("end", (event) => {
    eventSource.close();
    onEnd(event);
  });
}
