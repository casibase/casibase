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

import {Tag, Tooltip, message, theme} from "antd";
import {QuestionCircleTwoTone, SyncOutlined} from "@ant-design/icons";
import {isMobile as isMobileDevice} from "react-device-detect";
import i18next from "i18next";
import Sdk from "casdoor-js-sdk";
import xlsx from "xlsx";
import FileSaver from "file-saver";
import moment from "moment/moment";
import * as StoreBackend from "./backend/StoreBackend";
import {DisablePreviewMode, StaticBaseUrl, ThemeDefault} from "./Conf";
import Identicon from "identicon.js";
import md5 from "md5";
import React from "react";
import {v4 as uuidv4} from "uuid";
import * as Conf from "./Conf";
import * as Cookie from "cookie";

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

export function initWebConfig() {
  const curCookie = Cookie.parse(document.cookie);
  if (curCookie["jsonWebConfig"] && curCookie["jsonWebConfig"] !== "null") {
    const encoded = curCookie["jsonWebConfig"];
    const decoded = decodeURIComponent(encoded.replace(/\+/g, " "));
    const config = JSON.parse(decoded);
    Conf.setConfig(config);
  }
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
    return getDefaultAiAvatar();
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
  return account.owner === "built-in" || account.isAdmin === true;
}

export function isLocalAdminUser(account) {
  if (account === undefined || account === null) {
    return false;
  }

  if (!DisablePreviewMode && isAnonymousUser(account)) {
    return true;
  }

  if (account.type === "chat-admin") {
    return true;
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
    return null;
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
  if (!s) {
    return "";
  }
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

export function getApplicationStatusTag(status) {
  let color;
  let translationKey;

  switch (status) {
  case "Running":
    color = "green";
    translationKey = i18next.t("application:Running");
    break;
  case "Pending":
    color = "orange";
    translationKey = i18next.t("application:Pending");
    break;
  case "Terminating":
    color = "orange";
    translationKey = i18next.t("application:Terminating");
    break;
  case "Failed":
    color = "red";
    translationKey = i18next.t("application:Failed");
    break;
  case "Not Deployed":
    color = "default";
    translationKey = i18next.t("application:Not Deployed");
    break;
  default:
    color = "default";
    translationKey = i18next.t("application:Unknown");
  }

  return (
    <Tag color={color}>
      {translationKey}
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

export function workbook2blob(workbook) {
  const wopts = {
    bookType: "xlsx",
    bookSST: false,
    type: "binary",
  };
  const wbout = xlsx.write(workbook, wopts);
  return new Blob([s2ab(wbout)], {type: "application/octet-stream"});
}

export function sheet2blob(sheet, sheetName) {
  const workbook = {
    SheetNames: [sheetName],
    Sheets: {},
  };
  workbook.Sheets[sheetName] = sheet;
  return workbook2blob(workbook);
}

export function saveSheetToFile(sheet, sheetName, filename) {
  try {
    const blob = sheet2blob(sheet, sheetName);
    FileSaver.saveAs(blob, filename);
  } catch (error) {
    showMessage("error", `${i18next.t("general:Failed to save")}: ${error.message}`);
  }
}

export function json2sheet(data) {
  return xlsx.utils.json_to_sheet(data);
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
      showMessage("error", `${i18next.t("general:Failed to redirect")}: ${msg}`);
    }
  } catch (error) {
    showMessage("error", `${i18next.t("general:Failed to redirect")}: ${error.message}`);
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
          showMessage("success", i18next.t("general:Successfully saved"));
        } else {
          showMessage("error", i18next.t("general:Failed to save"));
        }
      } else {
        showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
      }
    })
    .catch(error => {
      showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
    });
}

export function getDefaultAiAvatar() {
  return `${StaticBaseUrl}/img/casibase.png`;
}

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

export function getOtherProviderInfo() {
  const res = {
    Model: {
      "OpenAI": {
        logo: `${StaticBaseUrl}/img/social_openai.svg`,
        url: "https://platform.openai.com",
      },
      "Gemini": {
        logo: `${StaticBaseUrl}/img/social_gemini.png`,
        url: "https://gemini.google.com/",
      },
      "Hugging Face": {
        logo: `${StaticBaseUrl}/img/social_huggingface.png`,
        url: "https://huggingface.co/",
      },
      "Claude": {
        logo: `${StaticBaseUrl}/img/social_claude.png`,
        url: "https://www.anthropic.com/claude",
      },
      "Grok": {
        logo: `${StaticBaseUrl}/img/social_xai.png`,
        url: "https://x.ai/",
      },
      "OpenRouter": {
        logo: `${StaticBaseUrl}/img/social_openrouter.png`,
        url: "https://openrouter.ai/",
      },
      "Baidu Cloud": {
        logo: `${StaticBaseUrl}/img/social_baidu_cloud.png`,
        url: "https://cloud.baidu.com/",
      },
      "iFlytek": {
        logo: `${StaticBaseUrl}/img/social_iflytek.png`,
        url: "https://www.iflytek.com/",
      },
      "ChatGLM": {
        logo: `${StaticBaseUrl}/img/social_chatglm.png`,
        url: "https://chatglm.cn/",
      },
      "MiniMax": {
        logo: `${StaticBaseUrl}/img/social_minimax.png`,
        url: "https://www.minimax.dev/",
      },
      "Ollama": {
        logo: `${StaticBaseUrl}/img/social_ollama.png`,
        url: "https://ollama.ai/",
      },
      "Local": {
        logo: `${StaticBaseUrl}/img/social_local.jpg`,
        url: "",
      },
      "Azure": {
        logo: `${StaticBaseUrl}/img/social_azure.png`,
        url: "https://azure.microsoft.com/",
      },
      "Cohere": {
        logo: `${StaticBaseUrl}/img/social_cohere.png`,
        url: "https://cohere.ai/",
      },
      "Moonshot": {
        logo: `${StaticBaseUrl}/img/social_moonshot.png`,
        url: "https://www.moonshot.cn/",
      },
      "Amazon Bedrock": {
        logo: `${StaticBaseUrl}/img/social_aws.png`,
        url: "https://aws.amazon.com/bedrock/",
      },
      "Dummy": {
        logo: `${StaticBaseUrl}/img/social_default.png`,
        url: "",
      },
      "Alibaba Cloud": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
      "Baichuan": {
        logo: `${StaticBaseUrl}/img/social_baichuan-color.png`,
        url: "https://www.baichuan-ai.com/",
      },
      "Volcano Engine": {
        logo: `${StaticBaseUrl}/img/social_volc_engine.jpg`,
        url: "https://www.volcengine.com/",
      },
      "DeepSeek": {
        logo: `${StaticBaseUrl}/img/social_deepseek.png`,
        url: "https://www.deepseek.com/",
      },
      "StepFun": {
        logo: `${StaticBaseUrl}/img/social_stepfun.png`,
        url: "https://www.stepfun.com/",
      },
      "Tencent Cloud": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/",
      },
      "Yi": {
        logo: `${StaticBaseUrl}/img/social_yi.png`,
        url: "https://01.ai/",
      },
      "Silicon Flow": {
        logo: `${StaticBaseUrl}/img/social_silicon_flow.png`,
        url: "https://www.siliconflow.com/",
      },
      "GitHub": {
        logo: `${StaticBaseUrl}/img/social_github.png`,
        url: "https://github.com/",
      },
      "Writer": {
        logo: `${StaticBaseUrl}/img/social_writer.png`,
        url: "https://writer.com/",
      },
    },
    Embedding: {
      "OpenAI": {
        logo: `${StaticBaseUrl}/img/social_openai.svg`,
        url: "https://platform.openai.com",
      },
      "Gemini": {
        logo: `${StaticBaseUrl}/img/social_gemini.png`,
        url: "https://gemini.google.com/",
      },
      "Hugging Face": {
        logo: `${StaticBaseUrl}/img/social_huggingface.png`,
        url: "https://huggingface.co/",
      },
      "Cohere": {
        logo: `${StaticBaseUrl}/img/social_cohere.png`,
        url: "https://cohere.ai/",
      },
      "Baidu Cloud": {
        logo: `${StaticBaseUrl}/img/social_baidu_cloud.png`,
        url: "https://cloud.baidu.com/",
      },
      "Ollama": {
        logo: `${StaticBaseUrl}/img/social_ollama.png`,
        url: "https://ollama.ai/",
      },
      "Local": {
        logo: `${StaticBaseUrl}/img/social_local.jpg`,
        url: "",
      },
      "Azure": {
        logo: `${StaticBaseUrl}/img/social_azure.png`,
        url: "https://azure.microsoft.com/",
      },
      "MiniMax": {
        logo: `${StaticBaseUrl}/img/social_minimax.png`,
        url: "https://www.minimax.dev/",
      },
      "Alibaba Cloud": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
      "Tencent Cloud": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/",
      },
      "Jina": {
        logo: `${StaticBaseUrl}/img/social_jina.png`,
        url: "https://jina.ai/",
      },
      "Word2Vec": {
        logo: `${StaticBaseUrl}/img/social_local.jpg`,
        url: "",
      },
      "Dummy": {
        logo: `${StaticBaseUrl}/img/social_default.png`,
        url: "",
      },
    },
    Storage: {
      "Local File System": {
        logo: `${StaticBaseUrl}/img/social_file.png`,
        url: "",
      },
      "AWS S3": {
        logo: `${StaticBaseUrl}/img/social_aws.png`,
        url: "https://aws.amazon.com/s3",
      },
      "MinIO": {
        logo: "https://min.io/resources/img/logo.svg",
        url: "https://min.io/",
      },
      "Aliyun OSS": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://aliyun.com/product/oss",
      },
      "Tencent Cloud COS": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/product/cos",
      },
      "Azure Blob": {
        logo: `${StaticBaseUrl}/img/social_azure.png`,
        url: "https://azure.microsoft.com/en-us/services/storage/blobs/",
      },
      "Qiniu Cloud Kodo": {
        logo: `${StaticBaseUrl}/img/social_qiniu_cloud.png`,
        url: "https://www.qiniu.com/solutions/storage",
      },
      "Google Cloud Storage": {
        logo: `${StaticBaseUrl}/img/social_google_cloud.png`,
        url: "https://cloud.google.com/storage",
      },
      "Synology": {
        logo: `${StaticBaseUrl}/img/social_synology.png`,
        url: "https://www.synology.com/en-global/dsm/feature/file_sharing",
      },
      "Casdoor": {
        logo: `${StaticBaseUrl}/img/casdoor.png`,
        url: "https://casdoor.org/docs/provider/storage/overview",
      },
      "CUCloud OSS": {
        logo: `${StaticBaseUrl}/img/social_cucloud.png`,
        url: "https://www.cucloud.cn/product/oss.html",
      },
      "OpenAI File System": {
        logo: `${StaticBaseUrl}/img/social_openai.svg`,
        url: "https://platform.openai.com",
      },
    },
    Blockchain: {
      "Hyperledger Fabric": {
        logo: `${StaticBaseUrl}/img/social_hyperledger.png`,
        url: "https://www.hyperledger.org/use/fabric",
      },
      "ChainMaker": {
        logo: `${StaticBaseUrl}/img/social_chainmaker.jpg`,
        url: "https://chainmaker.org.cn/",
      },
      "Tencent ChainMaker": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/product/tcm",
      },
      "Tencent ChainMaker (Demo Network)": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/product/tcm",
      },
      "Ethereum": {
        logo: `${StaticBaseUrl}/img/social_ethereum.png`,
        url: "https://ethereum.org/en/",
      },
    },
    Video: {
      "AWS": {
        logo: `${StaticBaseUrl}/img/social_aws.png`,
        url: "https://aws.amazon.com/",
      },
      "Azure": {
        logo: `${StaticBaseUrl}/img/social_azure.png`,
        url: "https://azure.microsoft.com/",
      },
      "Alibaba Cloud": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
    },
    Agent: {
      "MCP": {
        logo: `${StaticBaseUrl}/img/social_mcp.png`,
        url: "https://modelcontextprotocol.io/",
      },
      "A2A": {
        logo: `${StaticBaseUrl}/img/social_a2a.png`,
        url: "https://agent2agent.info/",
      },
    },
    "Public Cloud": {
      "Aliyun": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
      "Amazon Web Services": {
        logo: `${StaticBaseUrl}/img/social_aws.png`,
        url: "https://aws.amazon.com/",
      },
      "Azure": {
        logo: `${StaticBaseUrl}/img/social_azure.png`,
        url: "https://azure.microsoft.com/",
      },
      "Google Cloud": {
        logo: `${StaticBaseUrl}/img/social_google_cloud.png`,
        url: "https://cloud.google.com/",
      },
      "Tencent Cloud": {
        logo: `${StaticBaseUrl}/img/social_tencent_cloud.jpg`,
        url: "https://cloud.tencent.com/",
      },
    },
    "Private Cloud": {
      "KVM": {
        logo: `${StaticBaseUrl}/img/social_kvm.png`,
        url: "https://www.linux-kvm.org/",
      },
      "Xen": {
        logo: `${StaticBaseUrl}/img/social_xen.png`,
        url: "https://xenproject.org/",
      },
      "VMware": {
        logo: `${StaticBaseUrl}/img/social_vmware.png`,
        url: "https://www.vmware.com/",
      },
      "PVE": {
        logo: `${StaticBaseUrl}/img/social_pve.png`,
        url: "https://www.proxmox.com/",
      },
      "Kubernetes": {
        logo: `${StaticBaseUrl}/img/social_kubernetes.png`,
        url: "https://kubernetes.io/",
      },
      "Docker": {
        logo: `${StaticBaseUrl}/img/social_docker.png`,
        url: "https://www.docker.com/",
      },
    },
    "Text-to-Speech": {
      "Alibaba Cloud": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
    },
    "Speech-to-Text": {
      "Alibaba Cloud": {
        logo: `${StaticBaseUrl}/img/social_aliyun.png`,
        url: "https://www.alibabacloud.com/",
      },
    },
  };

  return res;
}

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
  return data.msg === "Unauthorized operation" || data.msg === "this operation requires admin privilege";
}

export function getCompatibleProviderOptions(category) {
  if (category === "Model") {
    return (
      [
        {"id": "gpt-3.5-turbo", "name": "gpt-3.5-turbo"},
        {"id": "gpt-4", "name": "gpt-4"},
        {"id": "gpt-4-turbo", "name": "gpt-4-turbo"},
        {"id": "gpt-4o", "name": "gpt-4o"},
        {"id": "gpt-4o-2024-08-06", "name": "gpt-4o-2024-08-06"},
        {"id": "gpt-4o-mini", "name": "gpt-4o-mini"},
        {"id": "gpt-4o-mini-2024-07-18", "name": "gpt-4o-mini-2024-07-18"},
        {"id": "gpt-4.1", "name": "gpt-4.1"},
        {"id": "gpt-4.1-mini", "name": "gpt-4.1-mini"},
        {"id": "gpt-4.1-nano", "name": "gpt-4.1-nano"},
        {"id": "gpt-4.5-preview", "name": "gpt-4.5-preview"},
        {"id": "o1", "name": "o1"},
        {"id": "o1-pro", "name": "o1-pro"},
        {"id": "o3", "name": "o3"},
        {"id": "o3-mini", "name": "o3-mini"},
        {"id": "o4-mini", "name": "o4-mini"},
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

export function getProviderLogoURL(provider) {
  const otherProviderInfo = getOtherProviderInfo();
  if (!provider || !otherProviderInfo[provider.category] || !otherProviderInfo[provider.category][provider.type]) {
    return "";
  }

  return otherProviderInfo[provider.category][provider.type].logo;
}

export function getProviderTypeOptions(category) {
  if (category === "Storage") {
    return (
      [
        {id: "Local File System", name: "Local File System"},
        {id: "OpenAI File System", name: "OpenAI File System"},
      ]
    );
  } else if (category === "Model") {
    return (
      [
        {id: "OpenAI", name: "OpenAI"},
        {id: "Gemini", name: "Gemini"},
        {id: "Hugging Face", name: "Hugging Face"},
        {id: "Claude", name: "Claude"},
        {id: "Grok", name: "Grok"},
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
        {id: "Volcano Engine", name: "Volcano Engine"},
        {id: "DeepSeek", name: "DeepSeek"},
        {id: "StepFun", name: "StepFun"},
        {id: "Tencent Cloud", name: "Tencent Cloud"},
        {id: "Yi", name: "Yi"},
        {id: "Silicon Flow", name: "Silicon Flow"},
        {id: "GitHub", name: "GitHub"},
        {id: "Writer", name: "Writer"},
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
        {id: "Word2Vec", name: "Word2Vec"},
        {id: "Dummy", name: "Dummy"},
      ]
    );
  } else if (category === "Agent") {
    return ([
      {id: "MCP", name: "MCP"},
      {id: "A2A", name: "A2A"},
    ]);
  } else if (category === "Public Cloud") {
    return ([
      {id: "Amazon Web Services", name: "Amazon Web Services"},
      {id: "Azure", name: "Azure"},
      {id: "Google Cloud", name: "Google Cloud"},
      {id: "Aliyun", name: "Aliyun"},
      {id: "Tencent Cloud", name: "Tencent Cloud"},
    ]);
  } else if (category === "Private Cloud") {
    return ([
      {id: "KVM", name: "KVM"},
      {id: "Xen", name: "Xen"},
      {id: "VMware", name: "VMware"},
      {id: "PVE", name: "PVE"},
      {id: "Kubernetes", name: "Kubernetes"},
      {id: "Docker", name: "Docker"},
    ]);
  } else if (category === "Blockchain") {
    return ([
      {id: "Hyperledger Fabric", name: "Hyperledger Fabric"},
      {id: "ChainMaker", name: "ChainMaker"},
      {id: "Tencent ChainMaker", name: "Tencent ChainMaker"},
      {id: "Tencent ChainMaker (Demo Network)", name: "Tencent ChainMaker (Demo Network)"},
      {id: "Ethereum", name: "Ethereum"},
    ]);
  } else if (category === "Video") {
    return (
      [
        {id: "AWS", name: "AWS"},
        {id: "Azure", name: "Azure"},
        {id: "Alibaba Cloud", name: "Alibaba Cloud"},
      ]
    );
  } else if (category === "Text-to-Speech") {
    return [
      {id: "Alibaba Cloud", name: "Alibaba Cloud"},
    ];
  } else if (category === "Speech-to-Text") {
    return [
      {id: "Alibaba Cloud", name: "Alibaba Cloud"},
    ];
  } else {
    return [];
  }
}

export function redirectToLogin() {
  sessionStorage.setItem("from", window.location.pathname);
  window.location.replace(getSigninUrl());
  return null;
}

const openaiModels = [
  {id: "dall-e-3", name: "dall-e-3"},
  {id: "gpt-3.5-turbo", name: "gpt-3.5-turbo"},
  {id: "gpt-4", name: "gpt-4"},
  {id: "gpt-4-turbo", name: "gpt-4-turbo"},
  {id: "gpt-4o", name: "gpt-4o"},
  {id: "gpt-4o-2024-08-06", name: "gpt-4o-2024-08-06"},
  {id: "gpt-4o-mini", name: "gpt-4o-mini"},
  {id: "gpt-4o-mini-2024-07-18", name: "gpt-4o-mini-2024-07-18"},
  {id: "gpt-4.1", name: "gpt-4.1"},
  {id: "gpt-4.1-mini", name: "gpt-4.1-mini"},
  {id: "gpt-4.1-nano", name: "gpt-4.1-nano"},
  {id: "o1", name: "o1"},
  {id: "o1-pro", name: "o1-pro"},
  {id: "o3", name: "o3"},
  {id: "o3-mini", name: "o3-mini"},
  {id: "o4-mini", name: "o4-mini"},
  {id: "gpt-5", name: "gpt-5"},
  {id: "gpt-5-mini", name: "gpt-5-mini"},
  {id: "gpt-5-nano", name: "gpt-5-nano"},
  {id: "gpt-5-chat-latest", name: "gpt-5-chat-latest"},
];

const openaiEmbeddings = [
  {id: "text-embedding-ada-002", name: "text-embedding-ada-002"},
  {id: "text-embedding-3-small", name: "text-embedding-3-small"},
  {id: "text-embedding-3-large", name: "text-embedding-3-large"},
];

export function getTtsFlavorOptions(type, subType) {
  if (type === "Alibaba Cloud" && subType === "cosyvoice-v1") {
    return [
      {id: "longwan", name: "龙婉，女，中文普通话。龙婉声音温柔甜美，富有亲和力，给人温暖陪伴感。"},
      {id: "longcheng", name: "龙橙，男，中文普通话。龙橙声音温柔清澈，富有亲和力，是邻家的温暖大哥哥。"},
      {id: "longhua", name: "龙华，女童，中文普通话。龙华声音活泼可爱，有趣生动，是孩子们的好朋友。"},
      {id: "longxiaochun", name: "龙小淳，女，中英双语。龙小淳的嗓音如丝般柔滑，温暖中流淌着亲切与抚慰，恰似春风吹过心田。"},
      {id: "longxiaoxia", name: "龙小夏，女，中文普通话。龙小夏以温润磁性的声线，宛如夏日细雨，悄然滋润听者心灵，营造恬静氛围。"},
      {id: "longxiaocheng", name: "龙小诚，男，中英双语。龙小诚深邃而稳重的嗓音，犹如醇厚佳酿，散发出成熟魅力。"},
      {id: "longxiaobai", name: "龙小白，女，中文普通话。龙小白以轻松亲和的声调，演绎闲适日常，其嗓音如邻家女孩般亲切自然。"},
      {id: "longlaotie", name: "龙老铁，男，东北口音。龙老铁以纯正东北腔，豪爽直率，幽默风趣，为讲述增添浓郁地方特色与生活气息。"},
      {id: "longshu", name: "龙书，男，中文普通话。龙书以专业、沉稳的播报风格，传递新闻资讯，其嗓音富含权威与信赖感。"},
      {id: "longjing", name: "龙婧，女，中文普通话。龙婧的嗓音庄重而凛然，精准传达严肃主题，赋予话语以权威与力量。"},
      {id: "longmiao", name: "龙妙，女，中文普通话。龙妙声音清澈透亮，优雅如泉水叮咚，赋予朗诵空灵之美，令人陶醉其中。"},
      {id: "longyue", name: "龙悦，女，中文普通话。龙悦以抑扬顿挫、韵味十足的评书腔调，生动讲述故事，引领听众步入传奇世界！"},
      {id: "longyuan", name: "龙媛，女，中文普通话。龙媛以细腻入微、情感丰富的嗓音，将小说人物与情节娓娓道来，引人入胜。"},
      {id: "longfei", name: "龙飞，男，中文普通话。龙飞以冷静而睿智的声线，如高山上的清泉，经久流长，透出庄严的宁静。"},
      {id: "longjielidou", name: "龙杰力豆，儿童，中英双语。龙杰力豆以和煦如春阳的童声娓娓道来，透出了欣欣向荣的生命力，温暖每一个倾听的耳朵。"},
      {id: "longshuo", name: "龙硕，男，中文普通话。龙硕嗓音充满活力与阳光，如暖阳照耀，增添无限正能量，使人精神焕发。"},
      {id: "longtong", name: "龙彤，儿童，中文普通话。龙彤以稚嫩的童声撒欢，像是春日里的小溪，清脆跳跃，流淌着生机勃勃的旋律。"},
      {id: "longxiang", name: "龙祥，男，中文普通话。龙祥以稳如老茶的沉着和淡然，仿佛时光在其声音中慢慢沉淀，让心灵得以安放。"},
      {id: "loongstella", name: "Stella2.0，女，中英双语。Stella2.0以其飒爽利落的嗓音，演绎独立女性风采，展现坚韧与力量之美。"},
      {id: "loongbella", name: "Bella2.0，女，中文普通话。Bella2.0以精准干练的播报风格，传递全球资讯，其专业女声犹如新闻现场的引导者。"},
    ];
  }

  return [];
}

export function getModelSubTypeOptions(type) {
  if (type === "OpenAI" || type === "Azure") {
    return openaiModels;
  } else if (type === "Gemini") {
    return [
      {id: "gemini-1.0-pro-vision-latest", name: "gemini-1.0-pro-vision-latest"},
      {id: "gemini-pro-vision", name: "gemini-pro-vision"},
      {id: "gemini-1.5-pro-latest", name: "gemini-1.5-pro-latest"},
      {id: "gemini-1.5-pro-001", name: "gemini-1.5-pro-001"},
      {id: "gemini-1.5-pro-002", name: "gemini-1.5-pro-002"},
      {id: "gemini-1.5-pro", name: "gemini-1.5-pro"},
      {id: "gemini-1.5-flash-latest", name: "gemini-1.5-flash-latest"},
      {id: "gemini-1.5-flash-001", name: "gemini-1.5-flash-001"},
      {id: "gemini-1.5-flash-001-tuning", name: "gemini-1.5-flash-001-tuning"},
      {id: "gemini-1.5-flash", name: "gemini-1.5-flash"},
      {id: "gemini-1.5-flash-002", name: "gemini-1.5-flash-002"},
      {id: "gemini-1.5-flash-8b", name: "gemini-1.5-flash-8b"},
      {id: "gemini-1.5-flash-8b-001", name: "gemini-1.5-flash-8b-001"},
      {id: "gemini-1.5-flash-8b-latest", name: "gemini-1.5-flash-8b-latest"},
      {id: "gemini-1.5-flash-8b-exp-0827", name: "gemini-1.5-flash-8b-exp-0827"},
      {id: "gemini-1.5-flash-8b-exp-0924", name: "gemini-1.5-flash-8b-exp-0924"},
      {id: "gemini-2.5-pro-exp-03-25", name: "gemini-2.5-pro-exp-03-25"},
      {id: "gemini-2.5-pro-preview-03-25", name: "gemini-2.5-pro-preview-03-25"},
      {id: "gemini-2.5-flash-preview-04-17", name: "gemini-2.5-flash-preview-04-17"},
      {id: "gemini-2.5-flash-preview-05-20", name: "gemini-2.5-flash-preview-05-20"},
      {id: "gemini-2.5-flash-preview-04-17-thinking", name: "gemini-2.5-flash-preview-04-17-thinking"},
      {id: "gemini-2.5-pro-preview-05-06", name: "gemini-2.5-pro-preview-05-06"},
      {id: "gemini-2.5-pro-preview-06-05", name: "gemini-2.5-pro-preview-06-05"},
      {id: "gemini-2.0-flash-exp", name: "gemini-2.0-flash-exp"},
      {id: "gemini-2.0-flash", name: "gemini-2.0-flash"},
      {id: "gemini-2.0-flash-001", name: "gemini-2.0-flash-001"},
      {id: "gemini-2.0-flash-exp-image-generation", name: "gemini-2.0-flash-exp-image-generation"},
      {id: "gemini-2.0-flash-lite-001", name: "gemini-2.0-flash-lite-001"},
      {id: "gemini-2.0-flash-lite", name: "gemini-2.0-flash-lite"},
      {id: "gemini-2.0-flash-preview-image-generation", name: "gemini-2.0-flash-preview-image-generation"},
      {id: "gemini-2.0-flash-lite-preview-02-05", name: "gemini-2.0-flash-lite-preview-02-05"},
      {id: "gemini-2.0-flash-lite-preview", name: "gemini-2.0-flash-lite-preview"},
      {id: "gemini-2.0-pro-exp", name: "gemini-2.0-pro-exp"},
      {id: "gemini-2.0-pro-exp-02-05", name: "gemini-2.0-pro-exp-02-05"},
      {id: "gemini-exp-1206", name: "gemini-exp-1206"},
      {id: "gemini-2.0-flash-thinking-exp-01-21", name: "gemini-2.0-flash-thinking-exp-01-21"},
      {id: "gemini-2.0-flash-thinking-exp", name: "gemini-2.0-flash-thinking-exp"},
      {id: "gemini-2.0-flash-thinking-exp-1219", name: "gemini-2.0-flash-thinking-exp-1219"},
      {id: "gemini-2.5-flash-preview-tts", name: "gemini-2.5-flash-preview-tts"},
      {id: "gemini-2.5-pro-preview-tts", name: "gemini-2.5-pro-preview-tts"},
      {id: "learnlm-2.0-flash-experimental", name: "learnlm-2.0-flash-experimental"},
      {id: "gemma-3-1b-it", name: "gemma-3-1b-it"},
      {id: "gemma-3-4b-it", name: "gemma-3-4b-it"},
      {id: "gemma-3-12b-it", name: "gemma-3-12b-it"},
      {id: "gemma-3-27b-it", name: "gemma-3-27b-it"},
      {id: "gemma-3n-e4b-it", name: "gemma-3n-e4b-it"},
      {id: "aqa", name: "aqa"},
      {id: "imagen-3.0-generate-002", name: "imagen-3.0-generate-002"},
      {id: "veo-2.0-generate-001", name: "veo-2.0-generate-001"},
      {id: "gemini-2.5-flash-preview-native-audio-dialog", name: "gemini-2.5-flash-preview-native-audio-dialog"},
      {id: "gemini-2.5-flash-preview-native-audio-dialog-rai-v3", name: "gemini-2.5-flash-preview-native-audio-dialog-rai-v3"},
      {id: "gemini-2.5-flash-exp-native-audio-thinking-dialog", name: "gemini-2.5-flash-exp-native-audio-thinking-dialog"},
      {id: "gemini-2.0-flash-live-001", name: "gemini-2.0-flash-live-001"},
    ];
  } else if (type === "GitHub") {
    return [
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
    ];
  } else if (type === "Hugging Face") {
    return [
      {id: "meta-llama/Llama-2-7b", name: "meta-llama/Llama-2-7b"},
      {id: "tiiuae/falcon-180B", name: "tiiuae/falcon-180B"},
      {id: "bigscience/bloom", name: "bigscience/bloom"},
      {id: "gpt2", name: "gpt2"},
      {id: "baichuan-inc/Baichuan2-13B-Chat", name: "baichuan-inc/Baichuan2-13B-Chat"},
      {id: "THUDM/chatglm2-6b", name: "THUDM/chatglm2-6b"},
    ];
  } else if (type === "Claude") {
    return [
      {id: "claude-opus-4-1", name: "claude-opus-4-1"},
      {id: "claude-opus-4-0", name: "claude-opus-4-0"},
      {id: "claude-opus-4-20250514", name: "claude-opus-4-20250514"},
      {id: "claude-4-opus-20250514", name: "claude-4-opus-20250514"},
      {id: "claude-sonnet-4-0", name: "claude-sonnet-4-0"},
      {id: "claude-sonnet-4-20250514", name: "claude-sonnet-4-20250514"},
      {id: "claude-4-sonnet-20250514", name: "claude-4-sonnet-20250514"},
      {id: "claude-3-7-sonnet-latest", name: "claude-3-7-sonnet-latest"},
      {id: "claude-3-7-sonnet-20250219", name: "claude-3-7-sonnet-20250219"},
      {id: "claude-3-5-haiku-latest", name: "claude-3-5-haiku-latest"},
      {id: "claude-3-5-haiku-20241022", name: "claude-3-5-haiku-20241022"},
      {id: "claude-3-5-sonnet-latest", name: "claude-3-5-sonnet-latest"},
      {id: "claude-3-opus-latest", name: "claude-3-opus-latest"},
      {id: "claude-3-haiku-20240307", name: "claude-3-haiku-20240307"},
    ];
  } else if (type === "OpenRouter") {
    return [
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
    ];
  } else if (type === "Baidu Cloud") {
    return [
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
    ];
  } else if (type === "Cohere") {
    return [
      {id: "command-light", name: "command-light"},
      {id: "command", name: "command"},
    ];
  } else if (type === "iFlytek") {
    return [
      {id: "spark4.0-ultra", name: "Spark4.0 Ultra"},
      {id: "spark-max", name: "Spark Max"},
      {id: "spark-max-32k", name: "Spark Max-32K"},
      {id: "spark-pro", name: "Spark Pro"},
      {id: "spark-pro-128k", name: "Spark Pro-128K"},
      {id: "spark-lite", name: "Spark Lite"},
    ];
  } else if (type === "ChatGLM") {
    return [
      {id: "glm-3-turbo", name: "glm-3-turbo"},
      {id: "glm-4", name: "glm-4"},
      {id: "glm-4V", name: "glm-4V"},
    ];
  } else if (type === "MiniMax") {
    return [
      {id: "abab5-chat", name: "abab5-chat"},
    ];
  } else if (type === "Ollama") {
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
  } else if (type === "Local") {
    return [
      {id: "custom-model", name: "custom-model"},
    ];
  } else if (type === "Moonshot") {
    return [
      {id: "moonshot-v1-8k", name: "moonshot-v1-8k"},
      {id: "moonshot-v1-32k", name: "moonshot-v1-32k"},
      {id: "moonshot-v1-128k", name: "moonshot-v1-128k"},
    ];
  } else if (type === "Amazon Bedrock") {
    return [
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
    ];
  } else if (type === "Alibaba Cloud") {
    return [
      {id: "qwen-long", name: "qwen-long"},
      {id: "qwen-max", name: "qwen-max"},
      {id: "qwen-max-latest", name: "qwen-max-latest"},
      {id: "qwen-max-2025-01-25", name: "qwen-max-2025-01-25"},
      {id: "qwen-max-2024-09-19", name: "qwen-max-2024-09-19"},
      {id: "qwen-plus", name: "qwen-plus"},
      {id: "qwen-plus-2025-07-14", name: "qwen-plus-2025-07-14"},
      {id: "qwen-plus-2025-04-28", name: "qwen-plus-2025-04-28"},
      {id: "qwen-turbo", name: "qwen-turbo"},
      {id: "qwen-turbo-latest", name: "qwen-turbo-latest"},
      {id: "qwen-turbo-2025-07-15", name: "qwen-turbo-2025-07-15"},
      {id: "qwen-turbo-2025-04-28", name: "qwen-turbo-2025-04-28"},
      {id: "qwq-plus", name: "qwq-plus"},
      {id: "qwq-plus-latest", name: "qwq-plus-latest"},
      {id: "qwq-plus-2025-03-05", name: "qwq-plus-2025-03-05"},
      {id: "qwen-long", name: "qwen-long"},
      {id: "qwen-long-latest", name: "qwen-long-latest"},
      {id: "qwen-long-2025-01-25", name: "qwen-long-2025-01-25"},
      {id: "qwen3-235b-a22b-thinking-2507", name: "qwen3-235b-a22b-thinking-2507"},
      {id: "qwen3-235b-a22b-instruct-2507", name: "qwen3-235b-a22b-instruct-2507"},
      {id: "qwq-32b", name: "qwq-32b"},
      {id: "deepseek-v3.1", name: "deepseek-v3.1"},
      {id: "deepseek-r1", name: "deepseek-r1"},
      {id: "Moonshot-Kimi-K2-Instruct", name: "Moonshot-Kimi-K2-Instruct"},
    ];
  } else if (type === "Baichuan") {
    return [
      {id: "Baichuan2-Turbo", name: "Baichuan2-Turbo"},
      {id: "Baichuan2-53B", name: "Baichuan2-53B"},
      {id: "Baichuan3-Turbo", name: "Baichuan3-Turbo"},
      {id: "Baichuan3-Turbo-128k", name: "Baichuan3-Turbo-128k"},
      {id: "Baichuan4", name: "Baichuan4"},
      {id: "Baichuan4-Air", name: "Baichuan4-Air"},
      {id: "Baichuan4-Turbo", name: "Baichuan4-Turbo"},
    ];
  } else if (type === "Volcano Engine") {
    return [
      {id: "doubao-seed-1-6-thinking", name: "doubao-seed-1-6-thinking"},
      {id: "doubao-1-5-ui-tars", name: "doubao-1-5-ui-tars"},
      {id: "doubao-seed-1-6-flash", name: "doubao-seed-1-6-flash"},
      {id: "doubao-seedance-1-0-pro", name: "doubao-seedance-1-0-pro"},
      {id: "doubao-seed-1-6", name: "doubao-seed-1-6"},
      {id: "doubao-1-5-thinking-pro", name: "doubao-1-5-thinking-pro"},
      {id: "doubao-1-5-thinking-vision-pro", name: "doubao-1-5-thinking-vision-pro"},
      {id: "doubao-realtime", name: "doubao-realtime"},
      {id: "doubao-seedance-1-0-lite-i2v", name: "doubao-seedance-1-0-lite-i2v"},
      {id: "doubao-seedance-1-0-lite-t2v", name: "doubao-seedance-1-0-lite-t2v"},
      {id: "doubao-seedream-3-0-t2i", name: "doubao-seedream-3-0-t2i"},
      {id: "doubao-seaweed", name: "doubao-seaweed"},
      {id: "wan2-1-14b", name: "wan2-1-14b"},
      {id: "seedasr-auc", name: "seedasr-auc"},
      {id: "ve-tts", name: "ve-tts"},
      {id: "ve-voiceclone", name: "ve-voiceclone"},
      {id: "doubao-pro-256k", name: "doubao-pro-256k"},
      {id: "doubao-1-5-pro-256k", name: "doubao-1-5-pro-256k"},
      {id: "deepseek-r1-distill-qwen-7b", name: "deepseek-r1-distill-qwen-7b"},
      {id: "seedasr-streaming", name: "seedasr-streaming"},
      {id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b"},
      {id: "doubao-lite-128k", name: "doubao-lite-128k"},
      {id: "doubao-lite-4k", name: "doubao-lite-4k"},
      {id: "doubao-lite-32k", name: "doubao-lite-32k"},
      {id: "doubao-1-5-lite-32k", name: "doubao-1-5-lite-32k"},
      {id: "doubao-pro-32k", name: "doubao-pro-32k"},
      {id: "doubao-vision-pro-32k", name: "doubao-vision-pro-32k"},
      {id: "doubao-vision-lite-32k", name: "doubao-vision-lite-32k"},
      {id: "doubao-1-5-vision-pro-32k", name: "doubao-1-5-vision-pro-32k"},
      {id: "doubao-embedding-large", name: "doubao-embedding-large"},
      {id: "doubao-embedding", name: "doubao-embedding"},
      {id: "doubao-embedding-vision", name: "doubao-embedding-vision"},
      {id: "deepseek-v3", name: "deepseek-v3"},
      {id: "doubao-1-5-pro-32k", name: "doubao-1-5-pro-32k"},
      {id: "doubao-1-5-vision-lite", name: "doubao-1-5-vision-lite"},
      {id: "doubao-1-5-vision-pro", name: "doubao-1-5-vision-pro"},
      {id: "deepseek-r1", name: "deepseek-r1"},
      {id: "doubao-t2i-drawinglite", name: "doubao-t2i-drawinglite"},
      {id: "doubao-i2i-style", name: "doubao-i2i-style"},
      {id: "doubao-t2i-drawing", name: "doubao-t2i-drawing"},
      {id: "mistral-7b", name: "mistral-7b"},
      {id: "doubao-clasi", name: "doubao-clasi"},
      {id: "doubao-pro-128k", name: "doubao-pro-128k"},
      {id: "doubao-pro-4k", name: "doubao-pro-4k"},
      {id: "doubao-music", name: "doubao-music"},
      {id: "moonshot-v1-128k", name: "moonshot-v1-128k"},
      {id: "moonshot-v1-32k", name: "moonshot-v1-32k"},
      {id: "moonshot-v1-8k", name: "moonshot-v1-8k"},
    ];
  } else if (type === "DeepSeek") {
    return [
      {id: "deepseek-chat", name: "deepseek-chat"},
      {id: "deepseek-reasoner", name: "deepseek-reasoner"},
    ];
  } else if (type === "StepFun") {
    return [
      {id: "step-1-8k", name: "step-1-8k"},
      {id: "step-1-32k", name: "step-1-32k"},
      {id: "step-1-256k", name: "step-1-256k"},
      {id: "step-2-mini", name: "step-2-mini"},
      {id: "step-2-16k", name: "step-2-16k"},
      {id: "step-2-16k-exp", name: "step-2-16k-exp"},
    ];
  } else if (type === "Tencent Cloud") {
    return [
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
      {id: "deepseek-r1-distill-qwen-14b", name: "deepseek-r1-distill-qwen-14b"},
      {id: "deepseek-r1-distill-qwen-32b", name: "deepseek-r1-distill-qwen-32b"},
      {id: "deepseek-r1-distill-llama-8b", name: "deepseek-r1-distill-llama-8b"},
      {id: "deepseek-r1-distill-llama-70b", name: "deepseek-r1-distill-llama-70b"},
    ];
  } else if (type === "Mistral") {
    return [
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
    ];
  } else if (type === "Yi") {
    return [
      {id: "yi-lightning", name: "yi-lightning"},
      {id: "yi-vision-v2", name: "yi-vision-v2"},
    ];
  } else if (type === "Silicon Flow") {
    return [
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
    ];
  } else if (type === "Grok") {
    return [
      {id: "grok-3-latest", name: "grok-3-latest"},
      {id: "grok-3-fast-latest", name: "grok-3-fast-latest"},
      {id: "grok-3-mini-latest", name: "grok-3-mini-latest"},
      {id: "grok-2-vision-latest", name: "grok-2-vision-latest"},
      {id: "grok-2-latest", name: "grok-2-latest"},
      {id: "grok-2-image-latest", name: "grok-2-image-latest"},
    ];
  } else if (type === "Writer") {
    return [
      {id: "palmyra-x5", name: "Palmyra X5"},
      {id: "palmyra-x4", name: "Palmyra X4"},
      {id: "palmyra-med", name: "Palmyra Med"},
      {id: "palmyra-fin", name: "Palmyra Fin"},
      {id: "palmyra-creative", name: "Palmyra Creative"},
    ];
  } else if (type === "Dummy") {
    return [
      {id: "Dummy", name: "Dummy"},
    ];
  } else {
    return [];
  }
}

export function getEmbeddingSubTypeOptions(type) {
  if (type === "OpenAI" || type === "Azure") {
    return openaiEmbeddings;
  } else if (type === "Gemini") {
    return [
      {id: "embedding-001", name: "embedding-001"},
    ];
  } else if (type === "Hugging Face") {
    return [
      {id: "sentence-transformers/all-MiniLM-L6-v2", name: "sentence-transformers/all-MiniLM-L6-v2"},
    ];
  } else if (type === "Cohere") {
    return [
      {id: "embed-english-v2.0", name: "embed-english-v2.0"},
      {id: "embed-english-light-v2.0", name: "embed-english-light-v2.0"},
      {id: "embed-multilingual-v2.0", name: "embed-multilingual-v2.0"},
      {id: "embed-english-v3.0", name: "embed-english-v3.0"},
    ];
  } else if (type === "MiniMax") {
    return [
      {id: "embo-01", name: "embo-01"},
    ];
  } else if (type === "Ollama") {
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
  } else if (type === "Local") {
    return [
      {id: "custom-embedding", name: "custom-embedding"},
    ];
  } else if (type === "Baidu Cloud") {
    return [
      {id: "Embedding-V1", name: "Embedding-V1"},
      {id: "bge-large-zh", name: "bge-large-zh"},
      {id: "bge-large-en", name: "bge-large-en"},
      {id: "tao-8k", name: "tao-8k"},
    ];
  } else if (type === "Alibaba Cloud") {
    return [
      {id: "text-embedding-v1", name: "text-embedding-v1"},
      {id: "text-embedding-v2", name: "text-embedding-v2"},
      {id: "text-embedding-v3", name: "text-embedding-v3"},
    ];
  } else if (type === "Tencent Cloud") {
    return [
      {id: "hunyuan-embedding", name: "hunyuan-embedding"},
    ];
  } else if (type === "Jina") {
    return [
      {id: "jina-embeddings-v2-base-zh", name: "jina-embeddings-v2-base-zh"},
      {id: "jina-embeddings-v2-base-en", name: "jina-embeddings-v2-base-en"},
      {id: "jina-embeddings-v2-base-de", name: "jina-embeddings-v2-base-de"},
      {id: "jina-embeddings-v2-base-code", name: "jina-embeddings-v2-base-code"},
    ];
  } else if (type === "Word2Vec") {
    return [
      {id: "Word2Vec", name: "Word2Vec"},
    ];
  } else {
    return [];
  }
}

export function getProviderSubTypeOptions(category, type) {
  if (category === "Model") {
    return getModelSubTypeOptions(type);
  } else if (category === "Embedding") {
    return getEmbeddingSubTypeOptions(type);
  } else if (category === "Agent") {
    if (type === "MCP") {
      return [
        {id: "Default", name: "Default"},
      ];
    } else if (type === "A2A") {
      return [
        {id: "Default", name: "Default"},
      ];
    }
  } else if (category === "Text-to-Speech") {
    if (type === "Alibaba Cloud") {
      return [
        {id: "cosyvoice-v1", name: "cosyvoice-v1"},
      ];
    } else {
      return [];
    }
  } else if (category === "Speech-to-Text") {
    if (type === "Alibaba Cloud") {
      return [
        {id: "paraformer-realtime-v1", name: "paraformer-realtime-v1"},
      ];
    } else {
      return [];
    }
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

export function setStore(store) {
  localStorage.setItem("store", store);
  window.dispatchEvent(new Event("storeChanged"));
}

export function getStore() {
  const store = localStorage.getItem("store");
  return store !== null ? store : "All";
}

export function getRequestStore(account) {
  if (isLocalAdminUser(account)) {
    return getStore() === "All" ? "" : getStore();
  }
  return "";
}

export function isDefaultStoreSelected(account) {
  if (isLocalAdminUser(account)) {
    return getStore() === "All";
  }
  return true;
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

export function getDisplayTag(s, color = "default") {
  return (
    <Tag style={{fontWeight: "bold"}} color={color}>
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
    return `${i18next.t("chat:An error occurred during responding")}: ${errorText}`;
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

export function getBlockBrowserUrl(providerMap, record, block, isFirst = true) {
  const providerName = isFirst ? record.provider : record.provider2;
  const provider = providerMap[providerName];
  if (!provider || provider.browserUrl === "") {
    return block;
  }
  let url;
  if (provider.type === "ChainMaker") {
    url = provider.browserUrl.replace("{bh}", isFirst ? record.blockHash : record.blockHash2);
  } else {
    url = provider.browserUrl.replace("{bh}", block).replace("{chainId}", 1).replace("{clusterId}", provider.network);
  }
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

export function getThinkingModelMaxTokens(subType) {
  if (subType.includes("claude")) {
    if (subType.includes("4")) {
      if (subType.includes("sonnet")) {
        return 64000;
      } else if (subType.includes("opus")) {
        return 32000;
      }
    } else if (subType.includes("3-7") || subType.includes("sonnet")) {
      return 64000;
    }
  }
  return 0;
}

export function getAlgorithm(themeAlgorithmNames) {
  return themeAlgorithmNames.sort().reverse().map((algorithmName) => {
    if (algorithmName === "dark") {
      return theme.darkAlgorithm;
    }
    if (algorithmName === "compact") {
      return theme.compactAlgorithm;
    }
    return theme.defaultAlgorithm;
  });
}

export function getHtmlTitle(storeHtmlTitle) {
  const defaultHtmlTitle = "Casibase";
  let htmlTitle = Conf.HtmlTitle;
  if (storeHtmlTitle && storeHtmlTitle !== defaultHtmlTitle) {
    htmlTitle = storeHtmlTitle;
  }
  return htmlTitle;
}

export function getFaviconUrl(themes, storeFaviconUrl) {
  const defaultFaviconUrl = "https://cdn.casibase.com/static/favicon.png";
  let faviconUrl = Conf.FaviconUrl;
  if (storeFaviconUrl && storeFaviconUrl !== defaultFaviconUrl) {
    faviconUrl = storeFaviconUrl;
  }
  if (themes.includes("dark")) {
    return faviconUrl.replace(/\.png$/, "_white.png");
  } else {
    return faviconUrl;
  }
}

export function getLogo(themes, storeLogoUrl) {
  const defaultLogoUrl = "https://cdn.casibase.org/img/casibase-logo_1200x256.png";
  let logoUrl = Conf.LogoUrl;
  if (storeLogoUrl && storeLogoUrl !== defaultLogoUrl) {
    logoUrl = storeLogoUrl;
  }
  logoUrl = logoUrl.replace("https://cdn.casibase.org", Conf.StaticBaseUrl);
  if (themes.includes("dark")) {
    return logoUrl.replace(/\.png$/, "_white.png");
  } else {
    return logoUrl;
  }
}

export function getFooterHtml(themes, storeFooterHtml) {
  const defaultFooterHtml = "Powered by <a target=\"_blank\" href=\"https://github.com/casibase/casibase\" rel=\"noreferrer\"><img style=\"padding-bottom: 3px;\" height=\"20\" alt=\"Casibase\" src=\"https://cdn.casibase.org/img/casibase-logo_1200x256.png\" /></a>";
  let footerHtml = Conf.FooterHtml;
  if (storeFooterHtml && storeFooterHtml !== defaultFooterHtml) {
    footerHtml = storeFooterHtml;
  }
  footerHtml = footerHtml.replace("https://cdn.casibase.org", Conf.StaticBaseUrl);
  if (themes.includes("dark")) {
    return footerHtml.replace(/(\.png)/g, "_white$1");
  } else {
    return footerHtml;
  }
}
