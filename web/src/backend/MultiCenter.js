
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

/**
 * 获取所有队列数据
 * @returns {Promise}
 */
export function getAllQueueData() {
  return fetch(`${Setting.ServerUrl}/api/get-ipfs-archive-all-queue-data`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 添加未上传IPFS数据到队列
 * @returns {Promise}
 */
export function addUnUploadIpfsDataToQueue() {
  return fetch(`${Setting.ServerUrl}/api/add-ipfs-archive-unupload-queue-data`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 按记录ID和数据类型添加到队列
 * @param {string} recordIds - 记录ID的逗号分隔字符串
 * @param {string} dataTypes - 数据类型的逗号分隔字符串
 * @returns {Promise}
 */
export function addRecordsWithDataTypesToQueue(recordIds, dataTypes) {
  // 构建查询字符串
  const params = new URLSearchParams();
  params.append('recordIds', recordIds);
  params.append('dataTypes', dataTypes);

  return fetch(`${Setting.ServerUrl}/api/add-ipfs-archive-queue-data-by-record-id?${params}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 按记录ID和数据类型从队列中移除记录
 * @param {string} recordId - 记录ID
 * @param {string} dataType - 数据类型
 * @returns {Promise}
 */
export function removeRecordFromQueueByRecordIdAndDataType(recordId, dataType) {
  // 构建查询字符串
  const params = new URLSearchParams();
  params.append('recordId', recordId);
  params.append('dataType', dataType);

  return fetch(`${Setting.ServerUrl}/api/remove-ipfs-archive-queue-data-by-record-id-and-data-type?${params}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}

/**
 * 触发特定数据类型的IPFS归档
 * @param {string} dataType - 数据类型
 * @returns {Promise}
 */
export function archiveToIPFS(dataType) {
  // 构建查询字符串
  const params = new URLSearchParams();
  params.append('dataType', dataType);

  return fetch(`${Setting.ServerUrl}/api/archive-to-ipfs?${params}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json());
}