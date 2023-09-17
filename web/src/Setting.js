// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import {SyncOutlined} from "@ant-design/icons";
import {isMobile as isMobileDevice} from "react-device-detect";
import i18next from "i18next";
import Sdk from "casdoor-js-sdk";
import FileSaver from "file-saver";
import XLSX from "xlsx";
import moment from "moment/moment";
import * as StoreBackend from "./backend/StoreBackend";

export let ServerUrl = "";
export let CasdoorSdk;

export function initServerUrl() {
  const hostname = window.location.hostname;
  if (hostname === "localhost") {
    ServerUrl = `http://${hostname}:14000`;
  }
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

export function changeLanguage(language) {
  setLanguage(language);
  window.location.reload(true);
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

export function getTags(factors, type) {
  if (!factors) {
    return [];
  }

  if (type === "factors") {
    return getFactorTag(factors);
  } else if (type === "users") {
    return getUserTag(factors);
  }
}

function getFactorTag(factors) {
  const res = [];
  factors.forEach((factor, i) => {
    if (factor.data.length !== 0) {
      res.push(
        <Tooltip placement="top" title={getShortText(JSON.stringify(factor.data), 500)}>
          <Tag color={"success"}>
            {factor.name}
          </Tag>
        </Tooltip>
      );
    } else {
      res.push(
        <Tag color={"warning"}>
          {factor.name}
        </Tag>
      );
    }
  });
  return res;
}

function getUserTag(users) {
  const res = [];
  users.forEach((user, i) => {
    if (user.length !== 0) {
      res.push(
        <Tooltip placement="top" title={getShortText(JSON.stringify(user), 500)}>
          <Tag color={"success"}>
            {user}
          </Tag>
        </Tooltip>
      );
    } else {
      res.push(
        <Tag color={"warning"}>
          {user}
        </Tag>
      );
    }
  });
  return res;
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

export function downloadXlsx(wordset) {
  const data = [];
  wordset.factors.forEach((factor, i) => {
    const row = {};

    row[0] = factor.name;
    factor.data.forEach((dataItem, i) => {
      row[i + 1] = dataItem;
    });

    data.push(row);
  });

  const sheet = XLSX.utils.json_to_sheet(data, {skipHeader: true});
  // sheet["!cols"] = [
  //   { wch: 18 },
  //   { wch: 7 },
  // ];

  try {
    const blob = sheet2blob(sheet, "factors");
    const fileName = `factors-${wordset.name}.xlsx`;
    FileSaver.saveAs(blob, fileName);
  } catch (error) {
    showMessage("error", `failed to download: ${error.message}`);
  }
}

export function downloadLabels(table) {
  const data = [];
  table.forEach((label, i) => {
    const row = {};

    row[0] = label.startTime;
    row[1] = label.endTime;
    row[2] = label.text;
    data.push(row);
  });

  const sheet = XLSX.utils.json_to_sheet(data, {skipHeader: true});
  try {
    const blob = sheet2blob(sheet, "labels");
    const fileName = `labels-${this.props.video.name}-${table.length}.xlsx`;
    FileSaver.saveAs(blob, fileName);
  } catch (error) {
    showMessage("error", `failed to download: ${error.message}`);
  }
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

export const StaticBaseUrl = "https://cdn.casbin.org";

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

export function getProviderTypeOptions(category) {
  if (category === "Model") {
    return (
      [
        {id: "OpenAI", name: "OpenAI"},
        {id: "Hugging Face", name: "Hugging Face"},
        {id: "OpenRouter", name: "OpenRouter"},
        {id: "Ernie", name: "Ernie"},
        {id: "iFlytek", name: "iFlytek"},
        {id: "Claude", name: "Claude"},
      ]
    );
  } else if (category === "Embedding") {
    return (
      [
        {id: "OpenAI", name: "OpenAI"},
        {id: "Hugging Face", name: "Hugging Face"},
        {id: "Cohere", name: "Cohere"},
        {id: "Ernie", name: "Ernie"},
      ]
    );
  } else {
    return [];
  }
}

export function getProviderSubTypeOptions(category, type) {
  if (type === "OpenAI") {
    if (category === "Model") {
      return (
        [
          {id: "gpt-4-32k-0613", name: "gpt-4-32k-0613"},
          {id: "gpt-4-32k-0314", name: "gpt-4-32k-0314"},
          {id: "gpt-4-32k", name: "gpt-4-32k"},
          {id: "gpt-4-0613", name: "gpt-4-0613"},
          {id: "gpt-4-0314", name: "gpt-4-0314"},
          {id: "gpt-4", name: "gpt-4"},
          {id: "gpt-3.5-turbo-0613", name: "gpt-3.5-turbo-0613"},
          {id: "gpt-3.5-turbo-0301", name: "gpt-3.5-turbo-0301"},
          {id: "gpt-3.5-turbo-16k", name: "gpt-3.5-turbo-16k"},
          {id: "gpt-3.5-turbo-16k-0613", name: "gpt-3.5-turbo-16k-0613"},
          {id: "gpt-3.5-turbo", name: "gpt-3.5-turbo"},
          {id: "text-davinci-003", name: "text-davinci-003"},
          {id: "text-davinci-002", name: "text-davinci-002"},
          {id: "text-curie-001", name: "text-curie-001"},
          {id: "text-babbage-001", name: "text-babbage-001"},
          {id: "text-ada-001", name: "text-ada-001"},
          {id: "text-davinci-001", name: "text-davinci-001"},
          {id: "davinci-instruct-beta", name: "davinci-instruct-beta"},
          {id: "davinci", name: "davinci"},
          {id: "curie-instruct-beta", name: "curie-instruct-beta"},
          {id: "curie", name: "curie"},
          {id: "ada", name: "ada"},
          {id: "babbage", name: "babbage"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "1", name: "AdaSimilarity"},
          {id: "2", name: "BabbageSimilarity"},
          {id: "3", name: "CurieSimilarity"},
          {id: "4", name: "DavinciSimilarity"},
          {id: "5", name: "AdaSearchDocument"},
          {id: "6", name: "AdaSearchQuery"},
          {id: "7", name: "BabbageSearchDocument"},
          {id: "8", name: "BabbageSearchQuery"},
          {id: "9", name: "CurieSearchDocument"},
          {id: "10", name: "CurieSearchQuery"},
          {id: "11", name: "DavinciSearchDocument"},
          {id: "12", name: "DavinciSearchQuery"},
          {id: "13", name: "AdaCodeSearchCode"},
          {id: "14", name: "AdaCodeSearchText"},
          {id: "15", name: "BabbageCodeSearchCode"},
          {id: "16", name: "BabbageCodeSearchText"},
          {id: "17", name: "AdaEmbeddingV2"},
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
  } else if (type === "Ernie") {
    if (category === "Model") {
      return (
        [
          {id: "ERNIE-Bot", name: "ERNIE-Bot"},
          {id: "ERNIE-Bot-turbo", name: "ERNIE-Bot-turbo"},
          {id: "BLOOMZ-7B", name: "BLOOMZ-7B"},
          {id: "Llama-2", name: "Llama-2"},
        ]
      );
    } else if (category === "Embedding") {
      return (
        [
          {id: "default", name: "default"},
        ]
      );
    } else {
      return [];
    }
  } else if (type === "Cohere") {
    return (
      [
        {id: "embed-english-v2.0", name: "embed-english-v2.0"},
        {id: "embed-english-light-v2.0", name: "embed-english-light-v2.0"},
        {id: "embed-multilingual-v2.0", name: "embed-multilingual-v2.0"},
      ]
    );
  } else if (type === "iFlytek") {
    return (
      [
        {id: "spark-v1.5", name: "spark-v1.5"},
        {id: "spark-v2.0", name: "spark-v2.0"},
      ]
    );
  } else if (type === "Claude") {
    return (
      [
        {id: "claude-2", name: "claude-2"},
        {id: "claude-v1", name: "claude-v1"},
        {id: "claude-v1-100k", name: "claude-v1-100k"},
        {id: "claude-instant-v1", name: "claude-instant-v1"},
        {id: "claude-instant-v1-100k", name: "claude-instant-v1-100k"},
        {id: "claude-v1.3", name: "claude-v1.3"},
        {id: "claude-v1.3-100k", name: "claude-v1.3-100k"},
        {id: "claude-v1.2", name: "claude-v1.2"},
        {id: "claude-v1.0", name: "claude-v1.0"},
        {id: "claude-instant-v1.1", name: "claude-instant-v1.1"},
        {id: "claude-instant-v1.1-100k", name: "claude-instant-v1.1-100k"},
        {id: "claude-instant-v1.0", name: "claude-instant-v1.0"},
      ]
    );
  } else {
    return [];
  }
}
