
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

const chainConfig = {
  "provider": "admin/provider_blockchain_chainmaker_tc_demo_multicenter",
  "contractName": "ControlledUtilizationOfMultiCenterResearchData",
  "funcName": "",
  "data": ""
}

// 数据集ID Owner Id数据信息
const OwnerId = "23337679511404563151387937671769731783447702570"

const AUDIT_ACTION_MARK = "multi-center-use-dataset";


/**
 * 查询数据集信息
 * @param {string} dataset_id - 数据集ID
 * @returns {Promise}
 */
export function queryDataSetsInfo(dataset_id) {
  // 复制一份chainConfig
  var newChainConfig = JSON.parse(JSON.stringify(chainConfig));

  var data = {
    "dataset_id": dataset_id
  }
  newChainConfig.funcName = "ReadDataset"

  newChainConfig.data = JSON.stringify(data);

  return fetch(`${Setting.ServerUrl}/api/query-blockchain-commit`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newChainConfig),
  }).then(res => res.json());
}

/**
 * 查询使用情况信息
 * @param {string} dataset_id - 数据集ID
 * @returns {Promise}
 */
export function queryDataSetsUsage(datasetusage_id) {
  // 复制一份chainConfig
  var newChainConfig = JSON.parse(JSON.stringify(chainConfig));

  var data = {
    "datasetusage_id": datasetusage_id
  }
  newChainConfig.funcName = "ReadDatasetusage"

  newChainConfig.data = JSON.stringify(data);

  return fetch(`${Setting.ServerUrl}/api/query-blockchain-commit`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newChainConfig),
  }).then(res => res.json());
}

/**
 * 使用数据
 * 
 * @param {string} datasetusage_id - 使用ID
 * @param {string} dataset_id - 数据集ID
 * @returns {Promise}
 */
export function useDataSet(datasetusage_id, dataset_id) {
  // 复制一份chainConfig
  var newChainConfig = JSON.parse(JSON.stringify(chainConfig));

  var data = {
    "dataset_usage_id": datasetusage_id,
    "dataset_id": dataset_id
  }
  newChainConfig.funcName = "UseDataset"

  newChainConfig.data = JSON.stringify(data);

  return fetch(`${Setting.ServerUrl}/api/send-blockchain-commit`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newChainConfig),
  }).then(res => res.json());
}




export function addDataUsageAuditRecord(account, datasetusage_id, dataset_id) {
  // 获取owner和organization
  var object = {
    "dataset_usage_id": datasetusage_id,
    "dataset_id": dataset_id

  }

  var response = {
    "status": "ok"
  }

  const newRecord = {
    "owner": account.owner,
    "organization": Setting.getRequestOrganization(account),
    "user": account.name,
    "method": "",
    "requestUri": "",
    "action": AUDIT_ACTION_MARK,
    "object": JSON.stringify(object),
    "response": JSON.stringify(response),
    "isTriggered": true,
    "needCommit": true,

  }

  return fetch(`${Setting.ServerUrl}/api/add-record`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newRecord),
  }).then(res => res.json());
}

/**
 * getDataSetUsageAuditRecord
 * @returns {Promise}
 */
export function getDataSetUsageAuditRecord() {
  return fetch(`${Setting.ServerUrl}/api/get-records-by-action?action=${AUDIT_ACTION_MARK}`, {
    method: "GET",
    credentials: "include",

  }).then(res => res.json());
}


export function generateSRPicture(image) {
  const formData = new FormData();
  formData.append("file", image); // image 可以是 File 或 Blob

  return fetch(`https://srapi.casibase.com/super-resolution?return_metrics=false`, {
    method: "POST",
    // credentials: "include",
    body: formData
  }).then();
}

// === DataUsage ===

export function getDatasets() {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-datasets`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function getDatasetById(id) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-dataset-by-id?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function addDataset(dataset) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/add-dataset`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(dataset),
  }).then(res => res.json())
}

export function updateDataset(id, dataset) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/update-dataset?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(dataset),
  }).then(res => res.json())
}

export function searchDatasetsMarket(keyword) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/search-dataset-market?query=${encodeURIComponent(keyword)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function addAccessRequest(request) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/add-access-request`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  }).then(res => res.json())
}

export function getAccessRequestByIdAndCurUser(id) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-access-request-by-id-and-cur-user?id=${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}
export function getAccessRequestsByReviewerAndStatus(status) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-access-request-by-reviewer-and-status?status=${encodeURIComponent(status)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function getAccessRequestsByRequesterAndStatus(status) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-access-request-by-requester-and-status?status=${encodeURIComponent(status)}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function cancelAccessRequest(id) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/cancel-access-request?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json())
}

export function reviewAccessRequest(id, approved, comment) {
  const approvedStr = approved ? "true" : "false"
  return fetch(`${Setting.ServerUrl}/api/multicenter/review-access-request?id=${id}&approved=${approvedStr}&comment=${encodeURIComponent(comment)}`, {
    method: "POST",
    credentials: "include",
  }).then(res => res.json())
}

export function getAssetGrantByIdAndUser(grantedId) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-grants-by-grantedId?grantedId=${grantedId}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function getGrantedAssetsByOwner() {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-granted-assets-by-owner`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

export function getGrantedAssetsByRequester() {
  return fetch(`${Setting.ServerUrl}/api/multicenter/get-granted-assets-by-requester`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json())
}

// -- check-and-get-dataset-source

export function checkUsage(grantedId) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/check-usage?grantedId=${grantedId}`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}

export function checkAndGetDatasetSource(isGranted, id) {
  return fetch(`${Setting.ServerUrl}/api/multicenter/check-and-get-dataset-source`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ isGranted: isGranted.toString(), id }),
  }).then(res => res.json());
}


export function getAuditUsage() {
  return fetch(`${Setting.ServerUrl}/api/multicenter/audit-usage`, {
    method: "GET",
    credentials: "include",
  }).then(res => res.json());
}
