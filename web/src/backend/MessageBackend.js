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

export function getGlobalMessages(page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-global-messages?p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getMessages(user, selectedUser = "") {
  return fetch(`${Setting.ServerUrl}/api/get-messages?user=${user}&selectedUser=${selectedUser}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getChatMessages(owner, chat) {
  return fetch(`${Setting.ServerUrl}/api/get-messages?owner=${owner}&chat=${chat}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

const eventSourceMap = new Map();

export function getMessageAnswer(owner, name, onMessage, onReason, onError, onEnd) {
  if (eventSourceMap.has(`${owner}/${name}`)) {
    return;
  }
  const eventSource = new EventSource(`${Setting.ServerUrl}/api/get-message-answer?id=${owner}/${encodeURIComponent(name)}`, {
    withCredentials: true,
  });
  eventSourceMap.set(`${owner}/${name}`, eventSource);

  eventSource.addEventListener("message", (e) => {
    onMessage(e.data);
  });

  eventSource.addEventListener("reason", (e) => {
    onReason(e.data);
  });

  eventSource.addEventListener("myerror", (e) => {
    onError(e.data);
    eventSource.close();
    eventSourceMap.delete(`${owner}/${name}`);
  });

  eventSource.addEventListener("error", (e) => {
    let error = e.data;
    if (!error) {
      error = "Unknown error";
    }
    onError(error);
    eventSource.close();
    eventSourceMap.delete(`${owner}/${name}`);
  });

  eventSource.addEventListener("end", (e) => {
    onEnd(e.data);
    eventSource.close();
    eventSourceMap.delete(`${owner}/${name}`);
  });
}

export function getAnswer(provider, question, framework, video) {
  return fetch(`${Setting.ServerUrl}/api/get-answer?provider=${provider}&question=${encodeURIComponent(question)}&framework=${encodeURIComponent(framework)}&video=${encodeURIComponent(video)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getMessage(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-message?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateMessage(owner, name, message, isHitOnly = false) {
  const newMessage = Setting.deepCopy(message);
  return fetch(`${Setting.ServerUrl}/api/update-message?id=${owner}/${encodeURIComponent(name)}&isHitOnly=${isHitOnly}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newMessage),
  }).then(res => res.json());
}

export function addMessage(message) {
  const newMessage = Setting.deepCopy(message);
  return fetch(`${Setting.ServerUrl}/api/add-message`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newMessage),
  }).then(res => res.json());
}

export function deleteMessage(message) {
  const newMessage = Setting.deepCopy(message);
  return fetch(`${Setting.ServerUrl}/api/delete-message`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newMessage),
  }).then(res => res.json());
}

export function deleteWelcomeMessage(message) {
  const newMessage = Setting.deepCopy(message);
  return fetch(`${Setting.ServerUrl}/api/delete-welcome-message`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newMessage),
  }).then(res => res.json());
}
