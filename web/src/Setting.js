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

import {Tag, Tooltip, message} from "antd";
import {QuestionCircleTwoTone, SyncOutlined} from "@ant-design/icons";
import {isMobile as isMobileDevice} from "react-device-detect";
import i18next from "i18next";
import Sdk from "casdoor-js-sdk";
import XLSX from "xlsx";
import moment from "moment/moment";
import * as StoreBackend from "./backend/StoreBackend";
import {ThemeDefault} from "./Conf";
import Identicon from "identicon.js";
import md5 from "md5";
import React from "react";
import {v4 as uuidv4} from "uuid";

export let ServerUrl = "";
export let CasdoorSdk;

export function initServerUrl() {
  const hostname = window.location.hostname;
  if (hostname === "localhost") {
    ServerUrl = `http://${hostname}:14000`;
  }
}

export function isLocalhost() {
  const hostname = window.location.hostname;
  return hostname === "localhost";
}

export function initCasdoorSdk(config) {
  CasdoorSdk = new Sdk(config);
}

function getUrlWithLanguage(url) {
  if (url.includes("?")) {
    return `${url}&language=${getLanguage()}`;
  } else {
    return `${url}?language=${getLanguage()}`;
  }
}

export function getSignupUrl() {
  return getUrlWithLanguage(CasdoorSdk.getSignupUrl());
}

export function getSigninUrl() {
  return getUrlWithLanguage(CasdoorSdk.getSigninUrl());
}

export function getUserProfileUrl(userName, account) {
  return getUrlWithLanguage(CasdoorSdk.getUserProfileUrl(userName, account));
}

export function getMyProfileUrl(account) {
  return getUrlWithLanguage(CasdoorSdk.getMyProfileUrl(account));
}

export function getUserAvatar(message, account) {
  if (message.author === "AI") {
    return AiAvatar;
  }

  // If account exists and has an avatar, construct URL for other users
  if (account && account.avatar) {
    // Find the last slash position
    const lastSlashIndex = account.avatar.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      // Get the base URL
      const baseUrl = account.avatar.substring(0, lastSlashIndex + 1);
      // Get the original filename
      const originalFilename = account.avatar.substring(lastSlashIndex + 1);

      const extension = originalFilename.substring(originalFilename.lastIndexOf("."));

      return `${baseUrl}${message.author}${extension}`;
    }
  }

  // If message author does not have an avatar, generate an Identicon
  const identicon = new Identicon(md5(message.author), 420);
  return "data:image/png;base64," + identicon;
}

export function signin() {
  return CasdoorSdk.signin(ServerUrl);
}

export function parseJson(s) {
  if (s === "") {
    return null;
  } else {
    return JSON.parse(s);
  }
}

export function myParseInt(i) {
  const res = parseInt(i);
  return isNaN(res) ? 0 : res;
}

export function myParseFloat(f) {
  const res = parseFloat(f);
  return isNaN(res) ? 0.0 : res;
}

export function openLink(link) {
  // this.props.history.push(link);
  const w = window.open("about:blank");
  w.location.href = link;
}

export function goToLink(link) {
  window.location.href = link;
}

export function goToLinkSoft(ths, link) {
  ths.props.history.push(link);
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

export function isAdminUser(account) {
  if (account === undefined || account === null) {
    return false;
  }
  return account.owner === "built-in" || account.isGlobalAdmin === true;
}

export function isLocalAdminUser(account) {
  if (account === undefined || account === null) {
    return false;
  }
  return account.isAdmin === true || isAdminUser(account);
}

export function isAnonymousUser(account) {
  if (account === undefined || account === null) {
    return false;
  }
  return account.type === "anonymous-user";
}

export function isChatUser(account) {
  if (account === undefined || account === null) {
    return false;
  }
  return account.type === "chat-user";
}

export function deepCopy(obj) {
  if (obj === null) {
    showMessage("error", "deepCopy obj is null.");
  }
  return Object.assign({}, obj);
}

export function insertRow(array, row, i) {
  return [...array.slice(0, i), row, ...array.slice(i)];
}

export function addRow(array, row) {
  return [...array, row];
}

export function prependRow(array, row) {
  return [row, ...array];
}

export function deleteRow(array, i) {
  // return array = array.slice(0, i).concat(array.slice(i + 1));
  return [...array.slice(0, i), ...array.slice(i + 1)];
}

export function swapRow(array, i, j) {
  return [...array.slice(0, i), array[j], ...array.slice(i + 1, j), array[i], ...array.slice(j + 1)];
}

export function trim(str, ch) {
  if (str === undefined) {
    return undefined;
  }

  let start = 0;
  let end = str.length;

  while (start < end && str[start] === ch) {++start;}

  while (end > start && str[end - 1] === ch) {--end;}

  return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}

export function isMobile() {
  // return getIsMobileView();
  return isMobileDevice;
}

export function getFormattedDate(date) {
  if (date === undefined || date === null) {
    return null;
  }

  date = date.replace("T", " ");
  date = date.replace("+08:00", " ");
  return date;
}

export function getFormattedDateShort(date) {
  return date.slice(0, 10);
}

export function getShortName(s) {
  return s.split("/").slice(-1)[0];
}

export function getShortText(s, maxLength = 35) {
  if (s.length > maxLength) {
    return `${s.slice(0, maxLength)}...`;
  } else {
    return s;
  }
}

function getRandomInt(s) {
  let hash = 0;
  if (s.length !== 0) {
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
  }

  return hash;
}

export function getAvatarColor(s) {
  const colorList = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae"];
  let random = getRandomInt(s);
  if (random < 0) {
    random = -random;
  }
  return colorList[random % 4];
}

export function getLanguage() {
  return i18next.language;
}

export function setLanguage(language) {
  localStorage.setItem("language", language);
  i18next.changeLanguage(language);
}

export function setThemeColor(color) {
  localStorage.setItem("themeColor", color);
  updateTheme(color);
}

export function getThemeColor() {
  return localStorage.getItem("themeColor") ?? "#5734d3";
}

export function getAcceptLanguage() {
  if (i18next.language === null || i18next.language === "") {
    return "en;q=0.9,en;q=0.8";
  }
  return i18next.language + ";q=0.9,en;q=0.8";
}

export function getUrlParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

export function getTag(text, type, state) {
  let icon = null;
  let style = {};
  if (state === "Pending") {
    icon = <SyncOutlined spin />;
    style = {borderStyle: "dashed", backgroundColor: "white"};
  }

  if (type === "Read") {
    return (
      <Tooltip placement="top" title={"Read"}>
        <Tag icon={icon} style={style} color={"success"}>
          {text}
        </Tag>
      </Tooltip>
    );
  } else if (type === "Write") {
    return (
      <Tooltip placement="top" title={"Write"}>
        <Tag icon={icon} style={style} color={"processing"}>
          {text}
        </Tag>
      </Tooltip>
    );
  } else if (type === "Admin") {
    return (
      <Tooltip placement="top" title={"Admin"}>
        <Tag icon={icon} style={style} color={"error"}>
          {text}
        </Tag>
      </Tooltip>
    );
  } else {
    return null;
  }
}

export function getRemarkTag(score) {
  let color;
  let text;
  if (score === "Excellent") {
    color = "success";
    text = i18next.t("video:Excellent");
  } else if (score === "Good") {
    color = "processing";
    text = i18next.t("video:Good");
  } else if (score === "Pass") {
    color = "warning";
    text = i18next.t("video:Pass");
  } else if (score === "Fail") {
    color = "error";
    text = i18next.t("video:Fail");
  } else {
    color = "default";
    text = `Unknown score: ${score}`;
  }

  return (
    <Tag style={{width: "60px", textAlign: "center"}} color={color}>
      {text}
    </Tag>
  );
}

export function getLabelTags(labels) {
  if (!labels) {
    return [];
  }

  const res = [];
  labels.forEach((label, i) => {
    res.push(
      <Tooltip placement="top" title={getShortText(JSON.stringify(label.text), 500)}>
        <Tag color={"processing"}>
          {`${label.startTime}: ${label.text !== "" ? label.text : "(Empty)"}`}
        </Tag>
      </Tooltip>
    );
  });
  return res;
}

export function getPercentage(f) {
  if (f === undefined) {
    return 0.0;
  }

  return (100 * f).toFixed(1);
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

export function sheet2blob(sheet, sheetName) {
  const workbook = {
    SheetNames: [sheetName],
    Sheets: {},
  };
  workbook.Sheets[sheetName] = sheet;
  return workbook2blob(workbook);
}

export function workbook2blob(workbook) {
  const wopts = {
    bookType: "xlsx",
    bookSST: false,
    type: "binary",
  };
  const wbout = XLSX.write(workbook, wopts);
  return new Blob([s2ab(wbout)], {type: "application/octet-stream"});
}

export function toggleElementFromSet(array, element) {
  if (!array) {
    array = [];
  }
  if (array.includes(element)) {
    return array.filter(e => e !== element);
  } else {
    return [...array, element];
  }
}

export function addElementToSet(set, newUser) {
  if (!set) {
    set = [];
  }
  if (!set.includes(newUser)) {
    set.push(newUser);
  }
  return set;
}

export function deleteElementFromSet(set, newUser) {
  if (!set) {
    return [];
  }
  return set.filter(user => user !== newUser);
}

export const redirectCatchJsonError = async(url) => {
  try {
    const response = await fetch(url);
    const msg = await response.json();
    if (response.ok) {
      this.props.history.push(url);
    } else {
      showMessage("error", `error in redirect: ${msg}`);
    }
  } catch (error) {
    showMessage("error", `failed to redirect: ${error.message}`);
  }
};

export function toFixed(f, n) {
  return parseFloat(f.toFixed(n));
}

export function getRandomName() {
  return Math.random().toString(36).slice(-6);
}

export function getFriendlyFileSize(size) {
  if (size < 1024) {
    return size + " B";
  }

  const i = Math.floor(Math.log(size) / Math.log(1024));
  let num = (size / Math.pow(1024, i));
  const round = Math.round(num);
  num = round < 10 ? num.toFixed(2) : round < 100 ? num.toFixed(1) : round;
  return `${num} ${"KMGTPEZY"[i - 1]}B`;
}

export function getTreeWithParents(tree) {
  const res = deepCopy(tree);
  res.children = tree.children.map((file, index) => {
    file.parent = tree;
    return getTreeWithParents(file);
  });
  return res;
}

export function getTreeWithSearch(tree, s) {
  const res = deepCopy(tree);
  res.children = tree.children.map((file, index) => {
    if (file.children.length === 0) {
      if (file.title.includes(s)) {
        return file;
      } else {
        return null;
      }
    } else {
      const tmpTree = getTreeWithSearch(file, s);
      if (tmpTree.children.length !== 0) {
        return tmpTree;
      } else {
        if (file.title.includes(s)) {
          return file;
        } else {
          return null;
        }
      }
    }
  }).filter((file, index) => {
    return file !== null;
  });
  return res;
}

export function getExtFromPath(path) {
  const filename = path.split("/").pop();
  if (filename.includes(".")) {
    return filename.split(".").pop().toLowerCase();
  } else {
    return "";
  }
}

export function getExtFromFile(file) {
  const res = file.title.split(".")[1];
  if (res === undefined) {
    return "";
  } else {
    return res;
  }
}

export function getFileCategory(file) {
  if (file.isLeaf) {
    return i18next.t("store:File");
  } else {
    return i18next.t("store:Folder");
  }
}

export function getDistinctArray(arr) {
  return [...new Set(arr)];
}

export function getCollectedTime(filename) {
  // 20220827_210300_CH~Logo.png
  const tokens = filename.split("~");
  if (tokens.length < 2) {
    return null;
  }

  const time = tokens[0].slice(0, -3);
  const m = new moment(time, "YYYYMMDD_HH:mm:ss");
  return m.format();
}

export function getSubject(filename) {
  // 20220827_210300_CH~Logo.png
  const tokens = filename.split("~");
  if (tokens.length < 2) {
    return null;
  }

  const subject = tokens[0].slice(tokens[0].length - 2);
  if (subject === "MA") {
    return i18next.t("store:Math");
  } else if (subject === "CH") {
    return i18next.t("store:Chinese");
  } else if (subject === "NU") {
    return null;
  } else {
    return subject;
  }
}

export function submitStoreEdit(storeObj) {
  const store = deepCopy(storeObj);
  store.fileTree = undefined;
  StoreBackend.updateStore(storeObj.owner, storeObj.name, store)
    .then((res) => {
      if (res.status === "ok") {
        if (res.data) {
          showMessage("success", "Successfully saved");
        } else {
          showMessage("error", "failed to save: server side failure");
        }
      } else {
        showMessage("error", `failed to save: ${res.msg}`);
      }
    })
    .catch(error => {
      showMessage("error", `failed to save: ${error}`);
    });
}

export const StaticBaseUrl = "https://cdn.casibase.org";

export const AiAvatar = `${StaticBaseUrl}/img/casibase.png`;

export const Countries = [{label: "English", key: "en", country: "US", alt: "English"},
  {label: "中文", key: "zh", country: "CN", alt: "中文"},
  {label: "Español", key: "es", country: "ES", alt: "Español"},
  {label: "Français", key: "fr", country: "FR", alt: "Français"},
  {label: "Deutsch", key: "de", country: "DE", alt: "Deutsch"},
  {label: "Indonesia", key: "id", country: "ID", alt: "Indonesia"},
  {label: "日本語", key: "ja", country: "JP", alt: "日本語"},
  {label: "한국어", key: "ko", country: "KR", alt: "한국어"},
  {label: "Русский", key: "ru", country: "RU", alt: "Русский"},
];

export function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

export function getOption(label, value) {
  return {
    label,
    value,
  };
}

export function scrollToDiv(divId) {
  if (divId) {
    const ele = document.getElementById(divId);
    if (ele) {
      ele.scrollIntoView({behavior: "smooth"});
    }
  }
}

export function renderExternalLink() {
  return (
    <svg style={{marginLeft: "5px"}} width="13.5" height="13.5" aria-hidden="true" viewBox="0 0 24 24" className="iconExternalLink_nPIU">
      <path fill="currentColor"
        d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"></path>
    </svg>
  );
}

export function isResponseDenied(data) {
  return data.msg === "Unauthorized operation";
}

export function getCompitableProviderOptions(category) {
  if (category === "Model") {
    return (
      [
        {"id": "gpt-3.5-turbo-0125", "name": "gpt-3.5-turbo-0125"},
        {"id": "gpt-3.5-turbo", "name": "gpt-3.5-turbo"},
        {"id": "gpt-3.5-turbo-1106", "name": "gpt-3.5-turbo-1106"},
        {"id": "gpt-3.5-turbo-instruct", "name": "gpt-3.5-turbo-instruct"},
        {"id": "gpt-3.5-turbo-16k-0613", "name": "gpt-3.5-turbo-16k-0613"},
        {"id": "gpt-3.5-turbo-16k", "name": "gpt-3.5-turbo-16k"},
        {"id": "gpt-4-0125-preview", "name": "gpt-4-0125-preview"},
        {"id": "gpt-4-1106-preview", "name": "gpt-4-1106-preview"},
        {"id": "gpt-4-turbo-preview", "name": "gpt-4-turbo-preview"},
        {"id": "gpt-4-vision-preview", "name": "gpt-4-vision-preview"},
        {"id": "gpt-4-1106-vision-preview", "name": "gpt-4-1106-vision-preview"},
        {"id": "gpt-4", "name": "gpt-4"},
        {"id": "gpt-4-0613", "name": "gpt-4-0613"},
        {"id": "gpt-4-32k", "name": "gpt-4-32k"},
        {"id": "gpt-4-32k-0613", "name": "gpt-4-32k-0613"},
        {"id": "gpt-4o", "name": "gpt-4o"},
        {"id": "gpt-4o-2024-05-13", "name": "gpt-4o-2024-05-13"},
        {"id": "gpt-4o-mini", "name": "gpt-4o-mini"},
        {"id": "gpt-4o-mini-2024-07-18", "name": "gpt-4o-mini-2024-07-18"},
      ]
    );
  } else if (category === "Embedding") {
    return (
      [
        {id: "text-embedding-ada-002", name: "text-embedding-ada-002"},
        {id: "text-embedding-3-small", name: "text-embedding-3-small"},
        {id: "text-embedding-3-large", name: "text-embedding-3-large"},
      ]
    );
  }
}

export function getProviderTypeOptions(category) {
  if (category === "Storage") {
    return (
      [
        {id: "Local File System", name: "Local File System"},
      ]
    );
  } else if (category === "Model") {
    return (
      [
        {id: "OpenAI", name: "OpenAI"},
        {id: "Gemini", name: "Gemini"},
        {id: "Hugging Face", name: "Hugging Face"},
        {id: "Claude", name: "Claude"},
        {id: "OpenRouter", name: "OpenRouter"},
        {id: "Baidu Cloud", name: "Baidu Cloud"},
        {id: "iFlytek", name: "iFlytek"},
        {id: "ChatGLM", name: "ChatGLM"},
        {id: "MiniMax", name: "MiniMax"},
        {id: "Ollama", name: "Ollama"},
        {id: "Local", name: "Local"},
        {id: "Azure", name: "Azure"},
        {id: "Cohere", name: "Cohere"},
        {id: "Moonshot", name: "Moonshot"},
        {id: "Amazon Bedrock", name: "Amazon Bedrock"},
        {id: "Dummy", name: "Dummy"},
        {id: "Alibaba Cloud", name: "Alibaba Cloud"},
        {id: "Baichuan", name: "Baichuan"},
        {id: "Doubao", name: "Doubao"},
        {id: "DeepSeek", name: "DeepSeek"},
        {id: "StepFun", name: "StepFun"},
        {id: "Tencent Cloud", name: "Tencent Cloud"},
        {id: "Yi", name: "Yi"},
        {id: "Silicon Flow", name: "Silicon Flow"},
        {id: "GitHub", name: "GitHub"},
      ]
    );
  } else if (category === "Embedding") {
    return (
      [
        {id: "OpenAI", name: "OpenAI"},
        {id: "Gemini", name: "Gemini"},
        {id: "Hugging Face", name: "Hugging Face"},
        {id: "Cohere", name: "Cohere"},
        {id: "Baidu Cloud", name: "Baidu Cloud"},
        {id: "Ollama", name: "Ollama"},
        {id: "Local", name: "Local"},
        {id: "Azure", name: "Azure"},
        {id: "MiniMax", name: "MiniMax"},
        {id: "Alibaba Cloud", name: "Alibaba Cloud"},
        {id: "Tencent Cloud", name: "Tencent Cloud"},
        {id: "Jina", name: "Jina"},
        {id: "Dummy", name: "Dummy"},
      ]
    );
  } else if (category === "Public Cloud") {
    return ([
      {value: "Amazon Web Services", name: "Amazon Web Services"},
      {value: "Azure", name: "Azure"},
      {value: "Google Cloud", name: "Google Cloud"},
      {value: "Aliyun", name: "Aliyun"},
      {value: "Tencent Cloud", name: "Tencent Cloud"},
    ]);
  } else if (category === "Private Cloud") {
    return ([
      {value: "KVM", name: "KVM"},
      {value: "Xen", name: "Xen"},
      {value: "VMware", name: "VMware"},
      {value: "PVE", name: "PVE"},
    ]);
  } else if (category === "Blockchain") {
    return ([
      {value: "Hyperledger Fabric", name: "Hyperledger Fabric"},
      {value: "ChainMaker", name: "ChainMaker"},
      {value: "Tencent ChainMaker", name: "Tencent ChainMaker"},
      {value: "Tencent ChainMaker (Demo Network)", name: "Tencent ChainMaker (Demo Network)"},
    ]);
  } else if (category === "Video") {
    return (
      [
        {id: "AWS", name: "AWS"},
        {id: "Azure", name: "Azure"},
        {id: "Alibaba Cloud", name: "Alibaba Cloud"},
      ]
    );
  } else {
    return [];
  }
}

const openaiModels = [
  {id: "dall-e-3", name: "dall-e-3"},
  {id: "gpt-3.5-turbo-0125", name: "gpt-3.5-turbo-0125"},
  {id: "gpt-3.5-turbo", name: "gpt-3.5-turbo"},
  {id: "gpt-3.5-turbo-1106", name: "gpt-3.5-turbo-1106"},
  {id: "gpt-3.5-turbo-instruct", name: "gpt-3.5-turbo-instruct"},
  {id: "gpt-3.5-turbo-16k-0613", name: "gpt-3.5-turbo-16k-0613"},
  {id: "gpt-3.5-turbo-16k", name: "gpt-3.5-turbo-16k"},
  {id: "gpt-4-0125-preview", name: "gpt-4-0125-preview"},
  {id: "gpt-4-1106-preview", name: "gpt-4-1106-preview"},
  {id: "gpt-4-turbo-preview", name: "gpt-4-turbo-preview"},
  {id: "gpt-4-vision-preview", name: "gpt-4-vision-preview"},
  {id: "gpt-4-1106-vision-preview", name: "gpt-4-1106-vision-preview"},
  {id: "gpt-4", name: "gpt-4"},
  {id: "gpt-4-0613", name: "gpt-4-0613"},
  {id: "gpt-4-32k", name: "gpt-4-32k"},
  {id: "gpt-4-32k-0613", name: "gpt-4-32k-0613"},
  {id: "gpt-4o", name: "gpt-4o"},
  {id: "gpt-4o-2024-05-13", name: "gpt-4o-2024-05-13"},
  {id: "gpt-4o-mini", name: "gpt-4o-mini"},
  {id: "gpt-4o-mini-2024-07-18", name: "gpt-4o-mini-2024-07-18"},
  {id: "gpt-4.5-preview", name: "gpt-4.5-preview"},
  {id: "gpt-4.5-preview-2025-02-27", name: "gpt-4.5-preview-2025-02-27"},
];

const openaiEmbeddings = [
  {id: "text-embedding-ada-002", name: "text-embedding-ada-002"},
  {id: "text-embedding-3-small", name: "text-embedding-3-small"},
  {id: "text-embedding-3-large", name: "text-embedding-3-large"},
];

export function getProviderSubTypeOptions(category, type) {
  if (type === "OpenAI") {
    if (category === "Model") {
      return (
        openaiModels
      );
    } else if (category === "Embedding") {
      return (
        openaiEmbeddings
      );
    } else {
      return [];
    }
  } else if (type === "Gemini") {
    if (category === "Model") {
      return (
        [
          {id: "gemini-pro", name: "Gemini Pro"},
          {id: "gemini-pro-vision", name: "Gemini Pro Vision"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "embedding-001", name: "embedding-001"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "GitHub") {
    if (category === "Model") {
      return (
        [
          {id: "gpt-4o", name: "GPT-4o"},
          {id: "gpt-4o-mini", name: "GPT-4o-mini"},
          {id: "Phi-4-multimodal-instruct", name: "Phi-4-multimodal-instruct"},
          {id: "Phi-4-mini-instruct", name: "Phi-4-mini-instruct"},
          {id: "Phi-4", name: "Phi-4"},
          {id: "Mistral-Large-2411", name: "Mistral-Large-2411"},
          {id: "AI21-Jamba-1.5-Large", name: "AI21-Jamba-1.5-Large"},
          {id: "AI21-Jamba-1.5-Mini", name: "AI21-Jamba-1.5-Mini"},
          {id: "Cohere-command-r-08-2024", name: "Cohere-command-r-08-2024"},
          {id: "Cohere-command-r-plus-08-2024", name: "Cohere-command-r-plus-08-2024"},
          {id: "Llama-3.3-70B-Instruct", name: "Llama-3.3-70B-Instruct"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "Hugging Face") {
    if (category === "Model") {
      return (
        [
          {id: "meta-llama/Llama-2-7b", name: "meta-llama/Llama-2-7b"},
          {id: "tiiuae/falcon-180B", name: "tiiuae/falcon-180B"},
          {id: "bigscience/bloom", name: "bigscience/bloom"},
          {id: "gpt2", name: "gpt2"},
          {id: "baichuan-inc/Baichuan2-13B-Chat", name: "baichuan-inc/Baichuan2-13B-Chat"},
          {id: "THUDM/chatglm2-6b", name: "THUDM/chatglm2-6b"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "sentence-transformers/all-MiniLM-L6-v2", name: "sentence-transformers/all-MiniLM-L6-v2"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "Claude") {
    return [
      {id: "claude-2.0", name: "claude-2.0"},
      {id: "claude-2.1", name: "claude-2.1"},
      {id: "claude-instant-1.2", name: "claude-instant-1.2"},
      {id: "claude-3-sonnet-20240229", name: "claude-3-sonnet-20240229"},
      {id: "claude-3-opus-20240229", name: "claude-3-opus-20240229"},
      {id: "claude-3-haiku-20240307", name: "claude-3-haiku-20240307"},
      {id: "claude-3-7-sonnet-20250219", name: "claude-3-7-sonnet-20250219"},
    ];
  } else if (type === "OpenRouter") {
    return (
      [
        {id: "google/palm-2-codechat-bison", name: "google/palm-2-codechat-bison"},
        {id: "google/palm-2-chat-bison", name: "google/palm-2-chat-bison"},
        {id: "openai/gpt-3.5-turbo", name: "openai/gpt-3.5-turbo"},
        {id: "openai/gpt-3.5-turbo-16k", name: "openai/gpt-3.5-turbo-16k"},
        {id: "openai/gpt-4", name: "openai/gpt-4"},
        {id: "openai/gpt-4-32k", name: "openai/gpt-4-32k"},
        {id: "anthropic/claude-2", name: "anthropic/claude-2"},
        {id: "anthropic/claude-instant-v1", name: "anthropic/claude-instant-v1"},
        {id: "meta-llama/llama-2-13b-chat", name: "meta-llama/llama-2-13b-chat"},
        {id: "meta-llama/llama-2-70b-chat", name: "meta-llama/llama-2-70b-chat"},
        {id: "palm-2-codechat-bison", name: "palm-2-codechat-bison"},
        {id: "palm-2-chat-bison", name: "palm-2-chat-bison"},
        {id: "gpt-3.5-turbo", name: "gpt-3.5-turbo"},
        {id: "gpt-3.5-turbo-16k", name: "gpt-3.5-turbo-16k"},
        {id: "gpt-4", name: "gpt-4"},
        {id: "gpt-4-32k", name: "gpt-4-32k"},
        {id: "claude-2", name: "claude-2"},
        {id: "claude-instant-v1", name: "claude-instant-v1"},
        {id: "llama-2-13b-chat", name: "llama-2-13b-chat"},
        {id: "llama-2-70b-chat", name: "llama-2-70b-chat"},
      ]
    );
  } else if (type === "Baidu Cloud") {
    if (category === "Model") {
      return (
        [
          {id: "ernie-4.0-8k", name: "ernie-4.0-8k"},
          {id: "ernie-4.0-8k-latest", name: "ernie-4.0-8k-latest"},
          {id: "ernie-4.0-8k-preview", name: "ernie-4.0-8k-preview"},
          {id: "ernie-4.0-turbo-8k", name: "ernie-4.0-turbo-8k"},
          {id: "ernie-4.0-turbo-128k", name: "ernie-4.0-turbo-128k"},
          {id: "ernie-4.0-turbo-8k-preview", name: "ernie-4.0-turbo-8k-preview"},
          {id: "ernie-4.0-turbo-8k-latest", name: "ernie-4.0-turbo-8k-latest"},
          {id: "ernie-3.5-8k", name: "ernie-3.5-8k"},
          {id: "ernie-3.5-128k", name: "ernie-3.5-128k"},
          {id: "ernie-3.5-8k-preview", name: "ernie-3.5-8k-preview"},
          {id: "ernie-speed-8k", name: "ernie-speed-8k"},
          {id: "ernie-speed-128k", name: "ernie-speed-128k"},
          {id: "ernie-speed-pro-128k", name: "ernie-speed-pro-128k"},
          {id: "ernie-lite-8k", name: "ernie-lite-8k"},
          {id: "ernie-lite-pro-128k", name: "ernie-lite-pro-128k"},
          {id: "ernie-tiny-8k", name: "ernie-tiny-8k"},
          {id: "ernie-character-8k", name: "ernie-character-8k"},
          {id: "ernie-character-fiction-8k", name: "ernie-character-fiction-8k"},
          {id: "ernie-novel-8k", name: "ernie-novel-8k"},
          {id: "deepseek-v3", name: "deepseek-v3"},
          {id: "deepseek-r1", name: "deepseek-r1"},
          {id: "deepseek-r1-distill-qwen-1.5b", name: "deepseek-r1-distill-qwen-1.5b"},
          {id: "deepseek-r1-distill-qwen-7b", name: "deepseek-r1-distill-qwen-7b"},
          {id: "deepseek-r1-distill-qwen-14b", name: "deepseek-r1-distill-qwen-14b"},
          {id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b"},
          {id: "deepseek-r1-distill-llama-8b", name: "deepseek-r1-distill-llama-8b"},
          {id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b"},
          {id: "deepseek-r1-distill-qianfan-llama-8b", name: "deepseek-r1-distill-qianfan-llama-8b"},
          {id: "deepseek-r1-distill-qianfan-llama-70b", name: "deepseek-r1-distill-qianfan-llama-70b"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "Embedding-V1", name: "Embedding-V1"},
          {id: "bge-large-zh", name: "bge-large-zh"},
          {id: "bge-large-en", name: "bge-large-en"},
          {id: "tao-8k", name: "tao-8k"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "Cohere") {
    if (category === "Model") {
      return (
        [
          {id: "command-light", name: "command-light"},
          {id: "command", name: "command"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "embed-english-v2.0", name: "embed-english-v2.0"},
          {id: "embed-english-light-v2.0", name: "embed-english-light-v2.0"},
          {id: "embed-multilingual-v2.0", name: "embed-multilingual-v2.0"},
          {id: "embed-english-v3.0", name: "embed-english-v3.0"},
        ]
      );
    }
  } else if (type === "iFlytek") {
    return (
      [
        {id: "spark-v1.5", name: "spark-v1.5"},
        {id: "spark-v2.0", name: "spark-v2.0"},
      ]
    );
  } else if (type === "ChatGLM") {
    return (
      [
        {id: "glm-3-turbo", name: "glm-3-turbo"},
        {id: "glm-4", name: "glm-4"},
        {id: "glm-4V", name: "glm-4V"},
      ]
    );
  } else if (type === "MiniMax") {
    if (category === "Model") {
      return (
        [
          {id: "abab5-chat", name: "abab5-chat"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "embo-01", name: "embo-01"},
        ]
      );
    }
  } else if (type === "Ollama") {
    if (category === "Model") {
      return [
        {id: "deepseek-r1:671b", name: "deepseek-r1:671b"},
        {id: "deepseek-r1:1.5b", name: "deepseek-r1-distill-qwen-1.5b"},
        {id: "deepseek-r1:7b", name: "deepseek-r1-distill-qwen-7b"},
        {id: "deepseek-r1:14b", name: "deepseek-r1-distill-qwen-14b"},
        {id: "deepseek-r1:32b", name: "deepseek-r1-distill-qwen-32b"},
        {id: "deepseek-r1:8b", name: "deepseek-r1-distill-llama-8b"},
        {id: "deepseek-r1:70b", name: "deepseek-r1-distill-llama-70b"},
        {id: "llama3.3:70b", name: "llama3.3:70b"},
        {id: "qwen2.5:7b", name: "qwen2.5:7b"},
        {id: "qwen2.5:14b", name: "qwen2.5:14b"},
        {id: "qwen2.5:32b", name: "qwen2.5:32b"},
        {id: "qwen2.5:72b", name: "qwen2.5:72b"},
        {id: "deepseek-v3:671b", name: "deepseek-v3:671b"},
        {id: "llama3.2:1b", name: "llama3.2:1b"},
        {id: "llama3.2:3b", name: "llama3.2:3b"},
        {id: "llama3:8b", name: "llama3:8b"},
        {id: "llama3:70b", name: "llama3:70b"},
      ];
    } else if (category === "Embedding") {
      return [
        {id: "nomic-embed-text", name: "nomic-embed-text"},
        {id: "mxbai-embed-large", name: "mxbai-embed-large"},
        {id: "snowflake-arctic-embed:335m", name: "snowflake-arctic-embed:335m"},
        {id: "snowflake-arctic-embed:137m", name: "snowflake-arctic-embed:137m"},
        {id: "snowflake-arctic-embed:110m", name: "snowflake-arctic-embed:110m"},
        {id: "snowflake-arctic-embed:33m", name: "snowflake-arctic-embed:33m"},
        {id: "snowflake-arctic-embed:22m", name: "snowflake-arctic-embed:22m"},
        {id: "bge-m3", name: "bge-m3"},
      ];
    }
  } else if (type === "Local") {
    if (category === "Model") {
      return (
        [
          {id: "custom-model", name: "custom-model"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "custom-embedding", name: "custom-embedding"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "Azure") {
    if (category === "Model") {
      return (
        openaiModels
      );
    } else if (category === "Embedding") {
      return (
        openaiEmbeddings
      );
    }
  } else if (type === "Moonshot") {
    return (
      [
        {id: "moonshot-v1-8k", name: "moonshot-v1-8k"},
        {id: "moonshot-v1-32k", name: "moonshot-v1-32k"},
        {id: "moonshot-v1-128k", name: "moonshot-v1-128k"},
      ]
    );
  } else if (type === "Amazon Bedrock") {
    return ([
      {id: "claude", name: "Claude"},
      {id: "claude-instant", name: "Claude Instant"},
      {id: "command", name: "Command"},
      {id: "command-light", name: "Command Light"},
      {id: "embed-english", name: "Embed - English"},
      {id: "embed-multilingual", name: "Embed - Multilingual"},
      {id: "jurassic-2-mid", name: "Jurassic-2 Mid"},
      {id: "jurassic-2-ultra", name: "Jurassic-2 Ultra"},
      {id: "llama-2-chat-13b", name: "Llama 2 Chat (13B)"},
      {id: "llama-2-chat-70b", name: "Llama 2 Chat (70B)"},
      {id: "titan-text-lite", name: "Titan Text Lite"},
      {id: "titan-text-express", name: "Titan Text Express"},
      {id: "titan-embeddings", name: "Titan Embeddings"},
      {id: "titan-multimodal-embeddings", name: "Titan Multimodal Embeddings"},
    ]);
  } else if (type === "Alibaba Cloud") {
    if (category === "Model") {
      return (
        [
          {id: "qwen-long", name: "qwen-long"},
          {id: "qwen-turbo", name: "qwen-turbo"},
          {id: "qwen-plus", name: "qwen-plus"},
          {id: "qwen-max", name: "qwen-max"},
          {id: "qwen-max-longcontext", name: "qwen-max-longcontext"},
          {id: "deepseek-r1", name: "deepseek-r1"},
          {id: "deepseek-v3", name: "deepseek-v3"},
          {id: "deepseek-r1-distill-qwen-1.5b", name: "deepseek-r1-distill-qwen-1.5b"},
          {id: "deepseek-r1-distill-qwen-7b", name: "deepseek-r1-distill-qwen-7b"},
          {id: "deepseek-r1-distill-qwen-14b ", name: "deepseek-r1-distill-qwen-14b "},
          {id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b"},
          {id: "deepseek-r1-distill-llama-8b", name: "deepseek-r1-distill-llama-8b"},
          {id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b"},
        ]);
    } else if (category === "Embedding") {
      return (
        [
          {id: "text-embedding-v1", name: "text-embedding-v1"},
          {id: "text-embedding-v2", name: "text-embedding-v2"},
          {id: "text-embedding-v3", name: "text-embedding-v3"},
        ]
      );
    }
  } else if (type === "Baichuan") {
    return ([
      {id: "Baichuan2-Turbo", name: "Baichuan2-Turbo"},
      {id: "Baichuan3-Turbo", name: "Baichuan3-Turbo"},
      {id: "Baichuan4", name: "Baichuan4"},
    ]);
  } else if (type === "Doubao") {
    return ([
      {id: "Doubao-lite-4k", name: "Doubao-lite-4k"},
      {id: "Doubao-lite-32k", name: "Doubao-lite-32k"},
      {id: "Doubao-lite-128k", name: "Doubao-lite-128k"},
      {id: "Doubao-pro-4k", name: "Doubao-pro-4k"},
      {id: "Doubao-pro-32k", name: "Doubao-pro-32k"},
      {id: "Doubao-pro-128k", name: "Doubao-pro-128k"},
    ]);
  } else if (type === "DeepSeek") {
    return ([
      {id: "deepseek-chat", name: "deepseek-chat"},
    ]);
  } else if (type === "StepFun") {
    return ([
      {id: "step-1-8k", name: "step-1-8k"},
      {id: "step-1-32k", name: "step-1-32k"},
      {id: "step-1-128k", name: "step-1-128k"},
      {id: "step-1-256k", name: "step-1-256k"},
      {id: "step-1-flash", name: "step-1-flash"},
      {id: "step-2-16k", name: "step-2-16k"},
    ]);
  } else if (type === "Tencent Cloud") {
    if (category === "Model") {
      return (
        [
          {id: "hunyuan-lite", name: "hunyuan-lite"},
          {id: "hunyuan-standard", name: "hunyuan-standard"},
          {id: "hunyuan-standard-256K", name: "hunyuan-standard-256K"},
          {id: "hunyuan-pro", name: "hunyuan-pro"},
          {id: "hunyuan-code", name: " hunyuan-code"},
          {id: "hunyuan-role", name: "hunyuan-role"},
          {id: "hunyuan-turbo", name: "hunyuan-turbo"},
          {id: "deepseek-r1", name: "deepseek-r1"},
          {id: "deepseek-v3", name: "deepseek-v3"},
          {id: "deepseek-r1-distill-qwen-1.5b", name: "deepseek-r1-distill-qwen-1.5b"},
          {id: "deepseek-r1-distill-qwen-7b", name: "deepseek-r1-distill-qwen-7b"},
          {id: "deepseek-r1-distill-qwen-14b ", name: "deepseek-r1-distill-qwen-14b "},
          {id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b"},
          {id: "deepseek-r1-distill-llama-8b", name: "deepseek-r1-distill-llama-8b"},
          {id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b"},
        ]);
    } else if (category === "Embedding") {
      return (
        [
          {id: "hunyuan-embedding", name: "hunyuan-embedding"},
        ]
      );
    }
  } else if (type === "Jina") {
    if (category === "Embedding") {
      return (
        [
          {id: "jina-embeddings-v2-base-zh", name: "jina-embeddings-v2-base-zh"},
          {id: "jina-embeddings-v2-base-en", name: "jina-embeddings-v2-base-en"},
          {id: "jina-embeddings-v2-base-de", name: "jina-embeddings-v2-base-de"},
          {id: "jina-embeddings-v2-base-code", name: "jina-embeddings-v2-base-code"},
        ]
      );
    }
  } else if (type === "Mistral") {
    return ([
      {id: "mistral-large-latest", name: "mistral-large-latest"},
      {id: "pixtral-large-latest", name: "pixtral-large-latest"},
      {id: "mistral-small-latest", name: "mistral-small-latest"},
      {id: "codestral-latest", name: "codestral-latest"},
      {id: "ministral-8b-latest", name: "ministral-8b-latest"},
      {id: "ministral-3b-latest", name: "ministral-3b-latest"},
      {id: "pixtral-12b", name: "pixtral-12b"},
      {id: "mistral-nemo", name: "mistral-nemo"},
      {id: "open-mistral-7b", name: "open-mistral-7b"},
      {id: "open-mixtral-8x7b", name: "open-mixtral-8x7b"},
      {id: "open-mixtral-8x22b", name: "open-mixtral-8x22b"},
    ]);
  } else if (type === "Yi") {
    return ([
      {id: "yi-lightning", name: "yi-lightning"},
      {id: "yi-vision-v2", name: "yi-vision-v2"},
    ]);
  } else if (type === "Silicon Flow") {
    return ([
      {id: "deepseek-ai/DeepSeek-R1", name: "deepseek-ai/DeepSeek-R1"},
      {id: "deepseek-ai/DeepSeek-V3", name: "deepseek-ai/DeepSeek-V3"},
      {id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", name: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"},
      {id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", name: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"},
      {id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", name: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"},
      {id: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B", name: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B"},
      {id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", name: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"},
      {id: "deepseek-ai/DeepSeek-V2.5", name: "deepseek-ai/DeepSeek-V2.5"},
      {id: "meta-llama/Llama-3.3-70B-Instruct", name: "meta-llama/Llama-3.3-70B-Instruct"},
      {id: "meta-llama/Meta-Llama-3.1-405B-Instruct", name: "meta-llama/Meta-Llama-3.1-405B-Instruct"},
      {id: "meta-llama/Meta-Llama-3.1-70B-Instruct", name: "meta-llama/Meta-Llama-3.1-70B-Instruct"},
      {id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "meta-llama/Meta-Llama-3.1-8B-Instruct"},
      {id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen/Qwen2.5-72B-Instruct"},
      {id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen/Qwen2.5-32B-Instruct"},
      {id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen/Qwen2.5-14B-Instruct"},
      {id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen/Qwen2.5-7B-Instruct"},
      {id: "THUDM/glm-4-9b-chat", name: "THUDM/glm-4-9b-chat"},
      {id: "01-ai/Yi-1.5-34B-Chat-16K", name: "01-ai/Yi-1.5-34B-Chat-16K"},
      {id: "01-ai/Yi-1.5-9B-Chat-16K", name: "01-ai/Yi-1.5-9B-Chat-16K"},
      {id: "google/gemma-2-27b-it", name: "google/gemma-2-27b-it"},
      {id: "google/gemma-2-9b-it", name: "google/gemma-2-9b-it"},
    ]);
  } else if (type === "Dummy") {
    return ([
      {id: "Dummy", name: "Dummy"},
    ]);
  } else {
    return [];
  }
}

export function getProviderAzureApiVersionOptions() {
  return ([
    {id: "", name: ""},
    {id: "2023-03-15-preview", name: "2023-03-15-preview"},
    {id: "2023-05-15", name: "2023-05-15"},
    {id: "2023-06-01-preview", name: "2023-06-01-preview"},
    {id: "2023-07-01-preview", name: "2023-07-01-preview"},
    {id: "2023-08-01-preview", name: "2023-08-01-preview"},
  ]);
}

export function getOrganization() {
  const organization = localStorage.getItem("organization");
  return organization !== null ? organization : "All";
}

export function getRequestOrganization(account) {
  if (isAdminUser(account)) {
    return getOrganization() === "All" ? account.owner : getOrganization();
  }
  return account.owner;
}

export function getBoolValue(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value === "true";
}

export function setBoolValue(key, value) {
  localStorage.setItem(key, `${value}`);
}

export function parseJsonFromText(text) {
  const regex = /\[\[(.*?)\]\]/;
  const match = regex.exec(text);

  if (match) {
    try {
      // const parsedJSON = JSON.parse(match[1]);
      const parsedJSON = match[1];
      return parsedJSON;
    } catch (error) {
      showMessage("error", error);
      return "";
    }
  }

  return "";
}

export function getSubdomain() {
  const url = window.location.origin;
  const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/;
  const matches = url.match(regex);
  if (matches && matches[1]) {
    const domainParts = matches[1].split(".");
    if (domainParts.length > 2) {
      return domainParts[0];
    }
  }
  return null;
}

export function getTimeFromSeconds(seconds) {
  const duration = moment.duration(seconds, "seconds");
  // const hours = Math.floor(duration.asHours()).toString().padStart(2, "0");
  const minutes = duration.minutes().toString().padStart(2, "0");
  const sec = duration.seconds().toString().padStart(2, "0");
  const millisec = duration.milliseconds().toString().padStart(3, "0").substring(0, 3);
  return `${minutes} : ${sec}.${millisec}`;
}

export function getSpeakerTag(speaker) {
  if (speaker.startsWith("Unknown")) {
    speaker = "Unknown";
  }

  return (
    <Tag color={speaker === "Teacher" ? "success" : speaker.startsWith("Student") ? "error" : "processing"}>
      {speaker}
    </Tag>
  );
}

export function getDisplayPrice(price, currency) {
  if (!price) {
    return "";
  }

  const tmp = price.toFixed(7);
  let numberStr = tmp.toString();
  if (numberStr.includes(".")) {
    numberStr = numberStr.replace(/(\.\d*?[1-9])0+$/, "$1");
    numberStr = numberStr.replace(/\.$/, "");
  }

  if (price === 0) {
    numberStr = "0";
  }

  let prefix = "$";
  if (currency === "CNY") {
    prefix = "￥";
  }

  return (
    <Tag style={{fontWeight: "bold"}} color={price === 0 ? "default" : "orange"}>
      {`${prefix}${numberStr}`}
    </Tag>
  );
}

export function getDisplayTag(s) {
  return (
    <Tag style={{fontWeight: "bold"}} color={"default"}>
      {s}
    </Tag>
  );
}

export function sumFields(chats, field) {
  if (!chats) {
    return 0;
  }

  if (field === "count") {
    return chats.reduce((sum, chat) => sum + 1, 0);
  } else {
    return chats.reduce((sum, chat) => sum + chat[field], 0);
  }
}

export function uniqueFields(chats, field) {
  if (!chats) {
    return 0;
  }

  const res = new Set(chats.map(chat => chat[field]));
  return res.size;
}

export function getRefinedErrorText(errorText) {
  if (errorText.startsWith("error, status code: 400, message: The response was filtered due to the prompt triggering")) {
    return i18next.t("chat:Your chat text involves sensitive content. This chat has been forcibly terminated.");
  } else if (errorText.startsWith("write tcp ")) {
    return i18next.t("chat:The response has been interrupted. Please do not refresh the page during responding.");
  } else {
    return i18next.t("chat:An error occurred during responding.");
  }
}

export function lighten(hexColor, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  const rgbColor = hexToRgb(hexColor.slice(1));

  const hsl = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);

  hsl.l += amount;

  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return {
    r: r,
    g: g,
    b: b,
  };
}

function rgbToHsl(r, g, b) {
  r %= 256;
  g %= 256;
  b %= 256;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2 / 255;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (s < 0) {s = -s;}
    switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.floor(h * 360);
  s = Math.floor(s * 100);
  l = Math.floor(l * 100);
  return {h, s, l};
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function hueToRgb(p, q, t) {
  if (t < 0) {t += 1;}
  if (t > 1) {t -= 1;}
  if (t < 1 / 6) {return p + (q - p) * 6 * t;}
  if (t < 1 / 2) {return q;}
  if (t < 2 / 3) {return p + (q - p) * (2 / 3 - t) * 6;}
  return p;
}

export function updateTheme(color) {
  ThemeDefault.colorPrimary = color ? color : getThemeColor();
  ThemeDefault.colorBackground = lighten(ThemeDefault.colorPrimary, 45).toString();
  ThemeDefault.colorButton = lighten(ThemeDefault.colorPrimary, 20).toString();
  ThemeDefault.colorBackgroundSecondary = "rgb(242 242 242)";
  document.documentElement.style.setProperty("--theme-color", ThemeDefault.colorPrimary);
  document.documentElement.style.setProperty("--theme-background", ThemeDefault.colorBackground);
  document.documentElement.style.setProperty("--theme-button", ThemeDefault.colorButton);
  document.documentElement.style.setProperty("--theme-background-secondary", ThemeDefault.colorBackgroundSecondary);
}

export const suggestionsDivider = "|||";

export function parseAnswerAndSuggestions(answer) {
  const parts = answer.split(suggestionsDivider);
  const suggestionTexts = parts.slice(1);

  const suggestions = suggestionTexts.map(text => {
    return {
      text: text,
      isHit: false,
    };
  });

  return {
    answer: parts[0],
    suggestions: suggestions,
  };
}

export function formatSuggestion(suggestionText) {
  suggestionText = suggestionText.trim().replace(/^</, "").replace(/>$/, "");
  if (!suggestionText.endsWith("?") && !suggestionText.endsWith("？")) {
    suggestionText += "?";
  }
  return suggestionText;
}

export function getLabel(text, tooltip) {
  return (
    <React.Fragment>
      <span style={{marginRight: 4}}>{text}</span>
      <Tooltip placement="top" title={tooltip}>
        <QuestionCircleTwoTone twoToneColor="rgb(45,120,213)" />
      </Tooltip>
    </React.Fragment>
  );
}

export function GetIdFromObject(obj) {
  if (obj === undefined || obj === null) {
    return "";
  }
  return `${obj.owner}/${obj.name}`;
}

export function GenerateId() {
  return uuidv4();
}

export function getBlockBrowserUrl(providerMap, providerName, block) {
  const provider = providerMap[providerName];
  if (!provider || provider.browserUrl === "") {
    return block;
  }

  const url = provider.browserUrl.replace("{bh}", block).replace("{chainId}", 1).replace("{clusterId}", provider.network);
  return (
    <a target="_blank" rel="noreferrer" href={url}>
      {block}
    </a>
  );
}

export function formatJsonString(s) {
  if (s === "") {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch (error) {
    return s;
  }
}
