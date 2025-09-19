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

export function getDynamicConfigs() {
    return fetch(`${Setting.ServerUrl}/api/get-dynamic-configs`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
        },
    }).then(res => res.json());
}

export function getDynamicConfig(id) {
    return fetch(`${Setting.ServerUrl}/api/get-dynamic-config?id=${encodeURIComponent(id)}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
        },
    }).then(res => res.json());
}

export function getDynamicConfigValueByKey(key, defaultValue) {
    return fetch(`${Setting.ServerUrl}/api/get-dynamic-config-by-key?key=${encodeURIComponent(key)}&defaultValue=${encodeURIComponent(defaultValue)}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
        },
    }).then(res => res.json());
}

export function addDynamicConfig(config) {
    return fetch(`${Setting.ServerUrl}/api/add-dynamic-config`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
    }).then(res => res.json());
}

export function updateDynamicConfig(id, config) {
    return fetch(`${Setting.ServerUrl}/api/update-dynamic-config?id=${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
    }).then(res => res.json());
}

export function deleteDynamicConfig(config) {
    return fetch(`${Setting.ServerUrl}/api/delete-dynamic-config`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
    }).then(res => res.json());
}
