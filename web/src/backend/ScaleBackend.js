// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.

import * as Setting from "../Setting";

export function getGlobalScales() {
  return fetch(`${Setting.ServerUrl}/api/get-global-scales`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getScales(owner, page = "", pageSize = "", field = "", value = "", sortField = "", sortOrder = "") {
  return fetch(`${Setting.ServerUrl}/api/get-scales?owner=${owner}&p=${page}&pageSize=${pageSize}&field=${field}&value=${value}&sortField=${sortField}&sortOrder=${sortOrder}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getScale(owner, name) {
  return fetch(`${Setting.ServerUrl}/api/get-scale?id=${owner}/${encodeURIComponent(name)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function getPublicScales() {
  return fetch(`${Setting.ServerUrl}/api/get-public-scales`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => res.json());
}

export function updateScale(owner, name, scale) {
  const newScale = Setting.deepCopy(scale);
  return fetch(`${Setting.ServerUrl}/api/update-scale?id=${owner}/${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newScale),
  }).then(res => res.json());
}

export function addScale(scale) {
  const newScale = Setting.deepCopy(scale);
  return fetch(`${Setting.ServerUrl}/api/add-scale`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newScale),
  }).then(res => res.json());
}

export function deleteScale(scale) {
  const newScale = Setting.deepCopy(scale);
  return fetch(`${Setting.ServerUrl}/api/delete-scale`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
    body: JSON.stringify(newScale),
  }).then(res => res.json());
}
