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

export function addFileRecord(values) {
  return fetch(`${Setting.ServerUrl}/api/add-file-record`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(values),
  }).then((res) => res.json());
}

export function getFiles(limit, page) {
  return fetch(`${Setting.ServerUrl}/api/get-files?limit=${limit}&page=${page}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function deleteFile(id) {
  return fetch(`${Setting.ServerUrl}/api/delete-file?id=${id}`, {
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());
}

export function getFile(id) {
  return fetch(`${Setting.ServerUrl}/api/get-file?id=${id}`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function updateFileDesc(id, values) {
  return fetch(`${Setting.ServerUrl}/api/update-file-desc?id=${id}`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(values),
  }).then((res) => res.json());
}

export function getFileNum() {
  return fetch(`${Setting.ServerUrl}/api/get-file-num`, {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());
}

export function uploadTopicPic(base64, filetype) {
  const formData = new FormData();
  formData.append("pic", base64);
  formData.append("type", filetype);
  return fetch(`${Setting.ServerUrl}/api/upload-topic-pic`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((res) => res.json());
}

export function uploadFile(base64, filename, filetype) {
  const formData = new FormData();
  formData.append("file", base64);
  formData.append("name", filename);
  formData.append("type", filetype);
  return fetch(`${Setting.ServerUrl}/api/upload-file`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((res) => res.json());
}

export function moderatorUpload(base64, filename, filepath) {
  const formData = new FormData();
  formData.append("file", base64);
  formData.append("name", filename);
  formData.append("filepath", filepath);
  return fetch(`${Setting.ServerUrl}/api/upload-moderator`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((res) => res.json());
}
