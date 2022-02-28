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

export function getReplies(topicId, limit, page, init) {
  return fetch(`${Setting.ServerUrl}/api/get-replies?topicId=${topicId}&limit=${limit}&page=${page}&init=${init}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getRepliesOfTopic(topicId) {
  return fetch(`${Setting.ServerUrl}/api/get-replies-of-topic?topicId=${topicId}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getReply(id) {
  return fetch(`${Setting.ServerUrl}/api/get-reply?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getReplyWithDetails(id) {
  return fetch(`${Setting.ServerUrl}/api/get-reply-with-details?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateReply(id, reply) {
  return fetch(`${Setting.ServerUrl}/api/update-reply?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(reply),
  }).then((res) => res.json());
}

export function addReply(reply) {
  return fetch(`${Setting.ServerUrl}/api/add-reply`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(reply),
  }).then((res) => res.json());
}

export function deleteReply(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-reply?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function getLatestReplies(id, limit, page) {
  return fetch(`${Setting.ServerUrl}/api/get-latest-replies?id=${id}&limit=${limit}&page=${page}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function getMemberRepliesNum(id) {
  return fetch(`${Setting.ServerUrl}/api/get-member-replies-num?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function editReplyContent(topic) {
  return fetch(`${Setting.ServerUrl}/api/edit-content?editType=reply`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(topic),
  }).then((res) => res.json());
}
