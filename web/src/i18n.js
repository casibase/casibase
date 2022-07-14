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

import i18n from "i18next";
import zh from "./locales/zh/data.json";
import zhTW from "./locales/zh-TW/data.json";
import en from "./locales/en/data.json";
import fr from "./locales/fr/data.json";
import de from "./locales/de/data.json";
import ko from "./locales/ko/data.json";
import ru from "./locales/ru/data.json";
import ja from "./locales/ja/data.json";
import kk from "./locales/kk/data.json";
import * as Conf from "./Conf";
import * as Setting from "./Setting";

const resources = {
  en: en,
  zh: zh,
  "zh-TW": zhTW,
  fr: fr,
  de: de,
  ko: ko,
  ru: ru,
  ja: ja,
  kk: kk,
};

function getBrowserLanguage() {
  const language = navigator.language;
  if (language === "zh-HK" || language === "zh-TW" || language === "zh-SG") {
    return "zh-TW";
  } else if (language.startsWith("zh")) {
    return "zh";
  } else if (language.startsWith("en")) {
    return "en";
  } else if (language.startsWith("fr")) {
    return "fr";
  } else if (language.startsWith("de")) {
    return "de";
  } else if (language.startsWith("ko")) {
    return "ko";
  } else if (language.startsWith("ru")) {
    return "ru";
  } else if (language.startsWith("ja")) {
    return "ja";
  } else if (language.startsWith("kk")) {
    return "kk";
  } else {
    return Conf.DefaultLanguage;
  }
}

function initLanguage() {
  let language = localStorage.getItem("language");
  if (language === undefined || language == null) {
    if (Conf.ForceLanguage !== "") {
      language = Conf.ForceLanguage;
    } else {
      language = getBrowserLanguage();
    }
  }
  Setting.changeMomentLanguage(language);

  return language;
}

i18n.init({
  resources: resources,
  lng: initLanguage(),
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  // debug: true,
  saveMissing: true,
});

export default i18n;
