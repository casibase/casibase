// Copyright 2020 The casbin Authors. All Rights Reserved.
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

export function addThanks(id, thanksType) {
  return fetch(`${Setting.ServerUrl}/api/add-thanks?id=${id}&thanksType=${thanksType}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function getConsumptionRecord(limit, page) {
  return fetch(`${Setting.ServerUrl}/api/get-consumption-record?limit=${limit}&page=${page}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getCheckinBonusStatus() {
  return fetch(`${Setting.ServerUrl}/api/get-checkin-bonus-status`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getCheckinBonus() {
  return fetch(`${Setting.ServerUrl}/api/get-checkin-bonus`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}
