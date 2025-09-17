
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