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

import React from "react";
import {message} from "antd";
import moment from "moment";
import {animateScroll as scroll} from "react-scroll";

export let ServerUrl = '';
export let ClientUrl = '';

export function initServerUrl() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    ServerUrl = `http://${hostname}:7000`;
  }
}

export function initClientUrl() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    ClientUrl = `http://${hostname}:3000`;
  }
}

export function parseJson(s) {
  if (s === "") {
    return null;
  } else {
    return JSON.parse(s);
  }
}

export function scrollToTop() {
  scroll.scrollToTop();
}

export function scrollToBottom() {
  scroll.scrollToBottom();
}

export function refresh() {
  window.location.reload();
}

export function goToLink(link) {
  window.location.href = link;
}

export function openLink(link) {
  const w = window.open('about:blank');
  w.location.href = link;
}

export function getLink(link) {
  return <a target="_blank" href={link}>{link}</a>
}

export function showMessage(type, text) {
  if (type === "") {
    return;
  } else if (type === "success") {
    message.success(text);
  } else if (type === "error") {
    message.error(text);
  }
}

export function addRow(array, row) {
  return [...array, row];
}

export function deleteRow(array, i) {
  return [...array.slice(0, i), ...array.slice(i + 1)];
}

export function getFormattedDate(date) {
  date = date?.replace('T', ' ');
  date = date?.replace('+08:00', ' +08:00');
  return date;
}

export function getPrettyDate(date) {
  date = moment(date).fromNow();
  return date;
}

export function getDiffDays(date) {
  date = moment().diff(moment(date), 'days');
  return date;
}

export function getStatic(path) {
  return `https://cdn.jsdelivr.net/gh/casbin${path}`;
}

export function getUserAvatar(username, isLarge=false) {
  return getStatic(`/static@18114c607de851939b077a090946dc0623e4989c/gravatar/${username}${isLarge ? "" : "_48x48"}.png`);
}

export function getForumName() {
  return "Casbin Forum";
}
