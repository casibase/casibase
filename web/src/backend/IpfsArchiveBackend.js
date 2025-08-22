
// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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
 * 获取ipfs_archive记录列表
 * @param {string} page - 页码
 * @param {string} pageSize - 每页条数
 * @param {string} field - 搜索字段
 * @param {string} value - 搜索值
 * @param {string} sortField - 排序字段
 * @param {string} sortOrder - 排序顺序
 * @returns {Promise}
 */
export function getIpfsArchives(page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-ipfs-archives?p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 获取单个ipfs_archive记录
 * @param {string} correlationId - 索引id
 * @returns {Promise}
 */
export function getIpfsArchiveByCorrelationId(correlationId) {
  return fetch(`${Setting.ServerUrl}/api/get-ipfs-archive-by-correlation-id?correlation_id=${encodeURIComponent(correlationId)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 获取ipfs_archive记录列表 by correlationId and dataType
 * @param {string} page - 页码
 * @param {string} pageSize - 每页条数
 * @param {string} dataType - 数据类型
 * @param {string} correlationId - 索引id
 * @param {string} sortField - 排序字段
 * @param {string} sortOrder - 排序顺序
 * @returns {Promise}
 */
export function getIpfsArchivesByCorrelationIdAndDataType(page = "", pageSize = "", dataType = "", correlationId = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-ipfs-archives-by-correlation-id-and-data-type?p=${page}&pageSize=${pageSize}&dataType=${dataType}&correlationId=${correlationId}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}



/**
 * 获取单个ipfs_archive记录
 * @param {int} id - id
 * @returns {Promise}
 */
export function getIpfsArchiveById(id) {
  return fetch(`${Setting.ServerUrl}/api/get-ipfs-archive-by-id?id=${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 添加ipfs_archive记录
 * @param {Object} archive - ipfs_archive记录对象
 * @returns {Promise}
 */
export function addIpfsArchive(archive) {
  const newArchive = Setting.deepCopy(archive);
  return fetch(`${Setting.ServerUrl}/api/add-ipfs-archive`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newArchive),
  }).then(res => res.json());
}

/**
 * 更新ipfs_archive记录
 * @param {int} id - id
 * @param {Object} archive - ipfs_archive记录对象
 * @returns {Promise}
 */
export function updateIpfsArchive(id, archive) {
  const newArchive = Setting.deepCopy(archive);
  return fetch(`${Setting.ServerUrl}/api/update-ipfs-archive?id=${encodeURIComponent(id)}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newArchive),
  }).then(res => res.json());
}

/**
 * 删除ipfs_archive记录
 * @param {Object} archive - ipfs_archive记录对象
 * @returns {Promise}
 */
export function deleteIpfsArchiveById(archive) {
  const newArchive = Setting.deepCopy(archive);
  return fetch(`${Setting.ServerUrl}/api/delete-ipfs-archive-by-id`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newArchive),
  }).then(res => res.json());
}