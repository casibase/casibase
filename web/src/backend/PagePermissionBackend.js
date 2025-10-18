// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

/**
 * 检查用户是否有访问指定页面的权限
 * @param {string} pagePath - 页面路径，例如 "/multi-center"
 * @returns {Promise} - 返回包含权限检查结果的 Promise
 */
export function checkPagePermission(pagePath) {
    return fetch(`${Setting.ServerUrl}/api/check-page-permission?pagePath=${encodeURIComponent(pagePath)}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept-Language": Setting.getAcceptLanguage(),
        },
    }).then(res => res.json());
}


