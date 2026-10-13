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
import dayjs from "dayjs";
import copy from "copy-to-clipboard";
import {toast} from "sonner";
import Sdk from "casdoor-js-sdk";
import * as Conf from "@/Conf";

// The frontend is served by the backend in production, so relative URLs are enough.
// In development the Vite dev-server proxies /api to the Go backend.
export const ServerUrl = "";

export const MAX_PAGE_SIZE = 25;
export const SEARCH_DEBOUNCE_MS = 300;

export function getStaticBaseUrl() {
  return Conf.StaticBaseUrl;
}

// ---- fetch -------------------------------------------------------------------

/**
 * Reads a fetch Response body and returns parsed JSON, or a normalized {status: "error", msg}
 * when HTTP failed or the body is not JSON (e.g. HTML error pages).
 */
export async function handleFetchResponse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        const preview = text.replace(/\s+/g, " ").trim().slice(0, 160);
        return {
          status: "error",
          msg: `HTTP ${res.status} ${res.statusText || ""}`.trim() + (preview ? `: ${preview}` : ""),
        };
      }
      throw new Error("Invalid JSON response");
    }
  }
  if (!res.ok) {
    const msg = (data && (data.msg || data.message)) || `HTTP ${res.status} ${res.statusText || ""}`.trim();
    return {status: "error", msg};
  }
  return data;
}

export function getAcceptLanguage() {
  if (i18next.language === null || i18next.language === undefined || i18next.language === "") {
    return "en;q=0.9,en;q=0.8";
  }
  return i18next.language + ";q=0.9,en;q=0.8";
}

export function isResponseDenied(data: any) {
  return data?.msg === "Unauthorized operation" || data?.msg === "this operation requires admin privilege";
}

// ---- messages and links ------------------------------------------------------

export function showMessage(type: "" | "success" | "error" | "info" | "warning", text: string) {
  if (type === "") {
    return;
  } else if (type === "success") {
    toast.success(text);
  } else if (type === "error") {
    toast.error(text);
  } else if (type === "warning") {
    toast.warning(text);
  } else {
    toast.info(text);
  }
}

function isScriptUrl(link: string) {
  // eslint-disable-next-line no-script-url
  return typeof link === "string" && link.trim().toLowerCase().startsWith("javascript:");
}

export function goToLink(link: string) {
  if (isScriptUrl(link)) {
    return;
  }
  window.location.href = link;
}

export function openLink(link: string) {
  if (isScriptUrl(link)) {
    return;
  }
  window.open(link, "_blank", "noopener,noreferrer");
}

export function copyToClipboard(text: string) {
  copy(text);
  showMessage("success", i18next.t("general:Copied to clipboard successfully"));
}

export function getClickable(text: string) {
  return (
    <button
      type="button"
      className="text-left underline-offset-4 hover:underline"
      onClick={() => copyToClipboard(text)}
    >
      {text}
    </button>
  );
}

export function isMobile() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(max-width: 767px)").matches;
}

// ---- language ----------------------------------------------------------------

export const Countries = [
  {label: "English", key: "en", country: "US", alt: "English"},
  {label: "中文", key: "zh", country: "CN", alt: "中文"},
];

export function getLanguage() {
  const language = i18next.language;
  return (language !== undefined && language !== null && language !== "" && language !== "null") ? language : Conf.DefaultLanguage;
}

export function setLanguage(language: string) {
  localStorage.setItem("language", language);
  i18next.changeLanguage(language);
}

// ---- small helpers -----------------------------------------------------------

export function getStyleInnerCss(css: string) {
  if (!css) {
    return css;
  }
  return css.replace(/<\/?style[^>]*>/gi, "");
}

export function parseJson(s: string) {
  if (s === "") {
    return null;
  }
  return JSON.parse(s);
}

export function deepCopy<T>(obj: T): T {
  if (obj === null) {
    return null as T;
  }
  return Object.assign({}, obj);
}

export function myParseInt(i: any) {
  const res = parseInt(i);
  return isNaN(res) ? 0 : res;
}

export function myParseFloat(f: any) {
  const res = parseFloat(f);
  return isNaN(res) ? 0.0 : res;
}

export function getShortText(s: string | undefined | null, maxLength = 35) {
  if (!s) {
    return "";
  }
  if (s.length > maxLength) {
    return `${s.slice(0, maxLength)}...`;
  }
  return s;
}

export function getShortName(s: string) {
  return s.split("/").slice(-1)[0];
}

export function getFormattedDate(date: string | undefined | null) {
  if (!date) {
    return null;
  }
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : date;
}

export function getRandomName() {
  return Math.random().toString(36).slice(-6);
}

export function insertRow<T>(array: T[], row: T, i: number) {
  return [...array.slice(0, i), row, ...array.slice(i)];
}

export function addRow<T>(array: T[], row: T) {
  return [...array, row];
}

export function deleteRow<T>(array: T[], i: number) {
  return [...array.slice(0, i), ...array.slice(i + 1)];
}

export function swapRow<T>(array: T[], i: number, j: number) {
  return [...array.slice(0, i), array[j], ...array.slice(i + 1, j), array[i], ...array.slice(j + 1)];
}

function getHashInt(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(s: string) {
  const colorList = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae"];
  return colorList[getHashInt(s ?? "") % 4];
}

export function getEffectiveAvatarUrl(user: any) {
  return user?.avatar || user?.permanentAvatar || "";
}

export function filterTableColumns(columns: any[], formItems: any[]) {
  if (!formItems || formItems.length === 0) {
    return columns;
  }

  return formItems
    .filter((item) => item.visible !== false)
    .map((item) => {
      const matchedColumn = columns.find((column) => (column.key ?? column.dataIndex) === item.name);
      if (!matchedColumn) {
        return null;
      }
      return {
        ...matchedColumn,
        width: item.width !== undefined ? item.width : matchedColumn.width,
        title: item.width !== undefined ? i18next.t(item.label) : matchedColumn.title,
      };
    })
    .filter((column) => column !== null);
}

// ---- branding ----------------------------------------------------------------

const DefaultLogoUrl = "https://cdn.openagentai.org/img/openagent-logo_1900x450.png";
const DefaultHtmlTitle = "OpenAgent";

/** Points the default CDN at the instance's own static host (the bundled /img of an offline build). */
export function localizeStaticUrl(text: string) {
  return Conf.StaticBaseUrl ? text.split("https://cdn.openagentai.org").join(Conf.StaticBaseUrl) : text;
}

/** In dark mode every PNG is swapped for its "_white" twin, the convention of the OpenAgent CDN. */
function whiteInDark(text: string, themes: string[]) {
  return themes.includes("dark") ? text.replace(/\.png/g, "_white.png") : text;
}

export function getLogo(themes: string[] = []) {
  return getThemedLogo(null, null, themes);
}

/** The site's logo, else the instance's, else OpenAgent's. */
export function getThemedLogo(logo: string | undefined | null, logoDark: string | undefined | null, themes: string[]) {
  if (themes.includes("dark") && logoDark) {
    return logoDark;
  }
  const url = logo && logo !== DefaultLogoUrl ? logo : (Conf.LogoUrl || DefaultLogoUrl);
  return whiteInDark(localizeStaticUrl(url), themes);
}

export function getNavbarHtml(siteNavbarHtml: string | undefined | null, themes: string[]) {
  return whiteInDark(localizeStaticUrl(siteNavbarHtml || Conf.NavbarHtml || ""), themes);
}

/** The site's footer, unless it is still the stock OpenAgent one. */
export function getCustomFooterHtml(siteFooterHtml: string | undefined | null, themes: string[]) {
  const isStock = !siteFooterHtml || siteFooterHtml.includes("/img/openagent-logo_1900x450.png");
  const html = isStock ? Conf.FooterHtml : siteFooterHtml;
  return html ? whiteInDark(localizeStaticUrl(html), themes) : "";
}

export function getHtmlTitle(siteHtmlTitle: string | undefined | null) {
  return siteHtmlTitle && siteHtmlTitle !== DefaultHtmlTitle ? siteHtmlTitle : Conf.HtmlTitle;
}

export function getFaviconUrl(siteFaviconUrl?: string) {
  return siteFaviconUrl || Conf.FaviconUrl || "https://cdn.casibase.com/static/favicon.png";
}

export function getThemeData() {
  return Conf.ThemeDefault;
}

// ---- Casdoor sign-in ---------------------------------------------------------

export let CasdoorSdk: any = null;

export function initCasdoorSdk() {
  CasdoorSdk = new Sdk({
    serverUrl: Conf.AuthConfig.issuer,
    clientId: Conf.AuthConfig.clientId,
    appName: Conf.AuthConfig.appName || "",
    organizationName: Conf.AuthConfig.organizationName || "",
    redirectPath: Conf.AuthConfig.redirectPath || "/callback",
  } as any);
}

export function isCasdoorAvailable() {
  return CasdoorSdk !== null && !!Conf.AuthConfig.issuer;
}

function getUrlWithLanguage(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}language=${getLanguage()}`;
}

export function getSigninUrl() {
  if (!isCasdoorAvailable()) {
    return "";
  }
  return getUrlWithLanguage(CasdoorSdk.getSigninUrl());
}

export function getSignupUrl() {
  if (!isCasdoorAvailable()) {
    return "";
  }
  return getUrlWithLanguage(CasdoorSdk.getSignupUrl());
}

export function getUserProfileUrl(userName: string, account: any) {
  if (!isCasdoorAvailable() || isBasicLoginMode(account)) {
    return "";
  }
  return getUrlWithLanguage(CasdoorSdk.getUserProfileUrl(userName, account));
}

export function getMyProfileUrl(account: any) {
  if (!isCasdoorAvailable() || isBasicLoginMode(account)) {
    return "";
  }
  return getUrlWithLanguage(CasdoorSdk.getMyProfileUrl(account, window.location.href));
}

/** Exchanges the ?code=&state= of the Casdoor redirect for an OpenAgent session. */
export function signin(): Promise<any> {
  return CasdoorSdk.signin(ServerUrl);
}

export function redirectToLogin() {
  sessionStorage.setItem("from", window.location.pathname + window.location.search);
  const url = getSigninUrl();
  if (url) {
    window.location.replace(url);
  } else {
    window.location.replace("/signin");
  }
}

// ---- roles -------------------------------------------------------------------

export function isGlobalAdminUser(account: any) {
  return !!account && account.name === "admin" && account.isAdmin === true;
}

export function isAdminUser(account: any) {
  return !!account && (account.owner === "built-in" || account.isAdmin === true);
}

export function isChatAdminUser(account: any) {
  return !!account && (account.type === "chat-admin" || account.tag === "教师" || account.tag === "家长");
}

export function canViewAllUsers(account: any) {
  return !!account && (account.name === "admin" || isChatAdminUser(account));
}

/** Built-in login mode: the account comes from OpenAgent's own password sign-in, not from Casdoor. */
export function isBasicLoginMode(account: any) {
  return !!account && account.owner === "basic";
}

export function isLocalAdminUser(account: any) {
  return !!account && (isChatAdminUser(account) || isAdminUser(account));
}

export function isLocalAndStoreAdminUser(account: any) {
  if (!account || account.homepage === "non-store-admin") {
    return false;
  }
  return isChatAdminUser(account) || isAdminUser(account);
}

export function isAnonymousUser(account: any) {
  return !!account && account.type === "anonymous-user";
}

export function isChatUser(account: any) {
  return !!account && account.type === "chat-user";
}

export function isTaskUser(account: any) {
  return !!account && typeof account.owner === "string" && account.owner.endsWith("hjy");
}

export function isUserBoundToStore(account: any) {
  return !!account && account.homepage !== undefined && account.homepage !== null && account.homepage !== "";
}

// ---- organization and store selection (admins only) --------------------------

export function getOrganization() {
  return localStorage.getItem("organization") ?? "All";
}

export function setOrganization(organization: string) {
  localStorage.setItem("organization", organization);
  window.dispatchEvent(new Event("storageOrganizationChanged"));
}

export function getRequestOrganization(account: any) {
  if (isAdminUser(account)) {
    return getOrganization() === "All" ? account.owner : getOrganization();
  }
  return account?.owner;
}

export function getStore() {
  return localStorage.getItem("store") ?? "All";
}

export function setStore(store: string) {
  localStorage.setItem("store", store);
  window.dispatchEvent(new Event("storeChanged"));
}

/** The selected store name, or null when none (or "All") is selected. */
export function getStoreCurrent() {
  const store = localStorage.getItem("store");
  return store && store !== "All" ? store : null;
}

export function getRequestStore(account: any) {
  if (isLocalAdminUser(account)) {
    return getStore() === "All" ? "" : getStore();
  }
  return "";
}

export function isDefaultStoreSelected(account: any) {
  return isLocalAdminUser(account) ? getStore() === "All" : true;
}

export function getBoolValue(key: string, defaultValue: boolean) {
  const value = localStorage.getItem(key);
  return value === null ? defaultValue : value === "true";
}

export function setBoolValue(key: string, value: boolean) {
  localStorage.setItem(key, value ? "true" : "false");
}

/** The file list's size wording: "0 Bytes", "1.5 KB", "12.34 MB". */
export function getFormattedSize(bytes: number) {
  if (!bytes) {
    return "0 Bytes";
  }
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

export function getFriendlyFileSize(size: number) {
  if (size < 1024) {
    return size + " B";
  }

  const i = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, i);
  const round = Math.round(value);
  const num = round < 10 ? value.toFixed(2) : round < 100 ? value.toFixed(1) : round;
  return `${num} ${"KMGTPEZY"[i - 1]}B`;
}

/** Pretty-prints a JSON string, leaving anything that is not JSON as it is. */
export function formatJsonString(s: string | undefined | null) {
  if (!s) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

export function getDefaultAiAvatar() {
  return `${Conf.StaticBaseUrl}/img/openagent.png`;
}

export function getStoreIconUrl(store: any) {
  return store?.avatar || getDefaultAiAvatar();
}

/** A price with its currency sign and no trailing zeros: "$0.0012", "￥3". */
export function formatPrice(price: number | null | undefined, currency?: string) {
  if (price === null || price === undefined) {
    return "";
  }
  let text = price === 0 ? "0" : price.toFixed(7);
  if (text.includes(".")) {
    text = text.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.$/, "");
  }
  return `${currency === "CNY" ? "￥" : "$"}${text}`;
}

/** Downloads rows of {column: value} as a one-sheet .xlsx file. */
export async function saveRowsAsXlsx(rows: Record<string, any>[], sheetName: string, filename: string, columnWidths?: number[]) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(rows);
  if (columnWidths) {
    sheet["!cols"] = columnWidths.map((wch) => ({wch}));
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename, {compression: true});
}
