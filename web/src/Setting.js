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
import { message } from "antd";
import moment from "moment";
import { animateScroll as scroll } from "react-scroll";
import md5 from "js-md5";
import * as Conf from "./Conf";
import * as AccountBackend from "./backend/AccountBackend";
import * as MemberBackend from "./backend/MemberBackend";
import { Link } from "react-router-dom";
import * as i18n from "./i18n";
import i18next from "i18next";
import Zmage from "react-zmage";
import Identicon from "identicon.js";

const pangu = require("pangu");

export let ServerUrl = "";
export let ClientUrl = "";

export function initServerUrl() {
  const hostname = window.location.hostname;
  if (hostname === "localhost") {
    ServerUrl = `http://${hostname}:7000`;
  }
}

export function initFullClientUrl() {
  const hostname = window.location.hostname;
  if (hostname === "localhost") {
    ClientUrl = `http://${hostname}:3000`;
  } else {
    ClientUrl = `https://${hostname}`;
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
  const w = window.open("about:blank");
  w.location.href = link;
}

export function getLink(link) {
  return (
    <a target="_blank" href={link}>
      {link}
    </a>
  );
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
  date = date?.replace("T", " ");
  date = date?.replace("+08:00", " +08:00");
  return date;
}

export function getPrettyDate(date) {
  date = moment(date).fromNow();
  return date;
}

export function getDiffDays(date) {
  date = moment().diff(moment(date), "days");
  return date;
}

export function getStatic(path) {
  return `https://cdn.jsdelivr.net/gh/casbin${path}`;
}

export function getUserAvatar(username, isLarge = false) {
  if (username === undefined) {
    return null;
  }

  let identicon = new Identicon(md5(username), 420);
  return "data:image/png;base64," + identicon;
}

export function getForumName() {
  return "Casnode";
}

export function getHomeLink(text) {
  return <Link to={"/"}>{text === undefined ? getForumName() : text}</Link>;
}

export function getGoogleAuthCode(method) {
  window.location.href = `${Conf.GoogleOauthUri}?client_id=${Conf.GoogleClientId}&redirect_uri=${ClientUrl}/callback/google/${method}&scope=${Conf.GoogleAuthScope}&response_type=code&state=${Conf.AuthState}`;
}

export function getGithubAuthCode(method) {
  window.location.href = `${Conf.GithubOauthUri}?client_id=${Conf.GithubClientId}&redirect_uri=${ClientUrl}/callback/github/${method}&scope=${Conf.GithubAuthScope}&response_type=code&state=${Conf.AuthState}`;
}

export function getQQAuthCode(method) {
  window.location.href = `${Conf.QQOauthUri}?client_id=${Conf.QQClientId}&redirect_uri=${ClientUrl}/callback/qq/${method}&scope=${Conf.QQAuthScope}&response_type=code&state=${Conf.AuthState}`;
}

export function getWeChatAuthCode(method) {
  window.location.href = `${Conf.WeChatOauthUri}?appid=${Conf.WechatClientId}&redirect_uri=${ClientUrl}/callback/wechat/${method}&scope=${Conf.WeChatAuthScope}&response_type=code&state=${Conf.AuthState}#wechat_redirect`;
}

export function SetEditorType(editorType) {
  localStorage.setItem("casnode-editorType", editorType);
}

export function ChangeEditorType(editorType) {
  localStorage.setItem("casnode-editorType", editorType);
  MemberBackend.updateMemberEditorType(editorType).then(() => goToLink("/"));
}

export function SetLanguage(language) {
  localStorage.setItem("casnode-language", language);
  changeMomentLanguage(language);
  i18next.changeLanguage(language);
}

export function ChangeLanguage(language, previous) {
  MemberBackend.updateMemberLanguage(language).then(() => {
    localStorage.setItem("casnode-language", language);
    changeMomentLanguage(language);
    i18next.changeLanguage(language);
    goToLink(previous);
  });
}

export function changeMomentLanguage(lng) {
  if (lng === "zh") {
    moment.locale("zh", {
      relativeTime: {
        future: "%s内",
        past: "%s前",
        s: "几秒",
        ss: "%d秒",
        m: "1分钟",
        mm: "%d分钟",
        h: "1小时",
        hh: "%d小时",
        d: "1天",
        dd: "%d天",
        M: "1个月",
        MM: "%d个月",
        y: "1年",
        yy: "%d年",
      },
    });
  }
}

export function getFormattedContent(content, spacing) {
  let formattedContent = content.replace(
    /@(.*?)[ \n\t]|@([^ \n\t]*?)[^ \n\t]$/g,
    function (w) {
      if (w[w.length - 1] !== " ") {
        return `@[${w.substring(
          1,
          w.length
        )}](${ClientUrl}/member/${w.substring(1)})`;
      }
      return `@[${w.substring(
        1,
        w.length - 1
      )}](${ClientUrl}/member/${w.substring(1)}) `;
    }
  );
  if (spacing) {
    return pangu
      .spacing(formattedContent)
      .replace(/\[(.*?)]\((.*?)\)/g, function (w) {
        return w.replace(/ /g, "");
      })
      .replace(/% /g, "%")
      .replace(/< /g, "<")
      .replace(/ >/g, ">");
  }
  return formattedContent;
}

export function getBoolConvertedText(status) {
  if (status) {
    return i18next.t("general:true");
  }
  return i18next.t("general:false");
}

const stdImageExt = ["png", "jpg", "gif", "jpeg"];

export function getFileType(fileName) {
  let fileType = "image";
  let fileIndex = fileName.lastIndexOf(".");
  let ext = fileName.substr(fileIndex + 1);
  let lowerCase = ext.toLowerCase();
  let index = stdImageExt.indexOf(lowerCase);
  if (index < 0) {
    fileType = "file";
  }
  return { fileType: fileType, ext: ext };
}

const unitSuffix = ["Bytes", "KB", "MB"];

export function getFormattedSize(fileSize) {
  if (fileSize === null) {
    return "0 Bytes";
  }
  let index = Math.floor(Math.log(fileSize) / Math.log(1024));
  let size = (fileSize / Math.pow(1024, index)).toPrecision(3);

  return size + " " + unitSuffix[index];
}

export let PcBrowser = true;

export function initBrowserType() {
  if (!checkPc()) {
    PcBrowser = false;
  }
}

// checkPc return a boolean value means "mobile" or "pc"
export function checkPc() {
  return !/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
}

// check if the link contains this page's anchor.
export function checkPageLink(url) {
  if (url.indexOf("#") === 0) {
    return true;
  }
  if (url.search(ClientUrl) === -1) {
    return false;
  }

  let current, target;
  if (window.location.href.indexOf("#") !== -1) {
    current = window.location.href.slice(0, window.location.href.indexOf("#"));
  } else {
    current = window.location.href;
  }
  if (url.indexOf("#") !== -1) {
    target = url.slice(0, url.indexOf("#"));
  } else {
    target = url;
  }
  return current === target;
}

export function renderImage({ alt, src }) {
  return <Zmage src={src} alt={alt} style={{ maxWidth: "100%" }} />;
}

export function renderLink(props) {
  return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
}
