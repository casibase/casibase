// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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

import i18next from "i18next";
import * as Setting from "@/lib/setting";

export function getGlobalMessages(page: any = "", pageSize: any = "", field: any = "", value: any = "", sortField: any = "", sortOrder: any = "", store: any = "") {
  return fetch(`${Setting.ServerUrl}/api/get-global-messages?p=${page}&pageSize=${pageSize}&field=${field}&value=${encodeURIComponent(value)}&sortField=${sortField}&sortOrder=${sortOrder}&store=${encodeURIComponent(store)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}

export function getMessages(user, selectedUser: any = "") {
  return fetch(`${Setting.ServerUrl}/api/get-messages?user=${user}&selectedUser=${selectedUser}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}

export function getChatMessages(owner, chat) {
  return fetch(`${Setting.ServerUrl}/api/get-messages?owner=${owner}&chat=${chat}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}

const eventSourceMap = new Map();

/**
 * Streams an answer and returns a function that stops listening. Asking again for an answer
 * already streaming (a page opened again, a chat switched back to) takes the stream over:
 * the old listener is closed and the backend replays the answer from its start.
 */
export function getMessageAnswer(owner, name, onMessage, onReason, onTool, onSearch, onVector, onError, onEnd, onInfo, onChat, onToolDelta, onStatus, onGuardrail?) {
  const key = `${owner}/${name}`;
  eventSourceMap.get(key)?.close();
  // EventSource cannot set Accept-Language, so pass the UI language as a query
  // param. Backend's GetAcceptLanguage() prefers this over the header.
  const lang = i18next.language || "en";
  const eventSource = new EventSource(`${Setting.ServerUrl}/api/get-message-answer?id=${owner}/${encodeURIComponent(name)}&language=${encodeURIComponent(lang)}`, {
    withCredentials: true,
  });
  eventSourceMap.set(key, eventSource);
  const stop = () => {
    eventSource.close();
    if (eventSourceMap.get(key) === eventSource) {
      eventSourceMap.delete(key);
    }
  };

  eventSource.addEventListener("message", (e: any) => {
    onMessage(e.data);
  });

  eventSource.addEventListener("reason", (e: any) => {
    onReason(e.data);
  });

  eventSource.addEventListener("tool-start", (e: any) => {
    onTool(e.data);
  });

  eventSource.addEventListener("tool", (e: any) => {
    onTool(e.data);
  });

  if (onToolDelta) {
    eventSource.addEventListener("tool-delta", (e: any) => {
      onToolDelta(e.data);
    });
  }

  eventSource.addEventListener("search", (e: any) => {
    onSearch(e.data);
  });

  if (onVector) {
    eventSource.addEventListener("vector", (e: any) => {
      onVector(e.data);
    });
  }

  if (onInfo) {
    eventSource.addEventListener("myinfo", (e: any) => {
      onInfo(e.data);
    });
  }

  if (onStatus) {
    eventSource.addEventListener("status", (e: any) => {
      onStatus(e.data);
    });
  }

  if (onChat) {
    eventSource.addEventListener("chat", (e: any) => {
      try {
        onChat(JSON.parse(e.data));
      } catch {
        // ignore malformed chat events
      }
    });
  }

  if (onGuardrail) {
    eventSource.addEventListener("guardrail", (e: any) => {
      try {
        onGuardrail(JSON.parse(e.data));
      } catch {
        // ignore malformed guardrail events
      }
    });
  }

  eventSource.addEventListener("myerror", (e: any) => {
    onError(e.data);
    stop();
  });

  eventSource.addEventListener("error", (e: any) => {
    let error = e.data;
    if (!error) {
      error = "Unknown error";
    }
    onError(error);
    stop();
  });

  eventSource.addEventListener("end", (e: any) => {
    onEnd(e.data);
    stop();
  });

  return stop;
}

export function getAnswer(provider, question, framework, video, tool: any = "") {
  return fetch(`${Setting.ServerUrl}/api/get-answer?provider=${provider}&question=${encodeURIComponent(question)}&framework=${encodeURIComponent(framework)}&video=${encodeURIComponent(video)}&tool=${encodeURIComponent(tool)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}

export function getMessage(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-message?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}

export function updateMessage(owner, name, message, isHitOnly: any = false) {
  const newMessage = Setting.deepCopy(message);
  return fetch(`${Setting.ServerUrl}/api/update-message?id=${owner}/${encodeURIComponent(name)}&isHitOnly=${isHitOnly}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newMessage),
  }).then(res => Setting.handleFetchResponse(res));
}

export function closeMessageEventSource(owner, name, cancel: any = false) {
  const key = `${owner}/${name}`;
  const found = eventSourceMap.has(key);
  if (found) {
    eventSourceMap.get(key).close();
    eventSourceMap.delete(key);
  }
  if (cancel) {
    cancelMessageAnswer(owner, name).catch(() => {});
  }
  return found;
}

export function cancelMessageAnswer(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/cancel-message-answer?id=${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
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
  }).then(res => Setting.handleFetchResponse(res));
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
  }).then(res => Setting.handleFetchResponse(res));
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
  }).then(res => Setting.handleFetchResponse(res));
}
