
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
  "funcName": "ReadDataset",
  "data": ""
}


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

  newChainConfig.data = JSON.stringify(data);

  return fetch(`${Setting.ServerUrl}/api/query-blockchain-commit`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(newChainConfig),
  }).then(res => res.json());
}

