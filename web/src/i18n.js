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

import i18n from "i18next";
import zh from "./locales/zh/data.json";
import en from "./locales/en/data.json";
import es from "./locales/es/data.json";
import fr from "./locales/fr/data.json";
import de from "./locales/de/data.json";
import id from "./locales/id/data.json";
import ja from "./locales/ja/data.json";
import ko from "./locales/ko/data.json";
import ru from "./locales/ru/data.json";
import vi from "./locales/vi/data.json";
import pt from "./locales/pt/data.json";
import it from "./locales/it/data.json";
import ms from "./locales/ms/data.json";
import tr from "./locales/tr/data.json";
import * as Conf from "./Conf";
import {initReactI18next} from "react-i18next";

const resources = {
  en: en,
  zh: zh,
  es: es,
  fr: fr,
  de: de,
  id: id,
  ja: ja,
  ko: ko,
  ru: ru,
  vi: vi,
  pt: pt,
  it: it,
  ms: ms,
  tr: tr,
};

function initLanguage() {
  let language = localStorage.getItem("language");
  if (language === undefined || language === null) {
    if (Conf.ForceLanguage !== "") {
      language = Conf.ForceLanguage;
    } else {
      const userLanguage = navigator.language;
      switch (userLanguage) {
      case "en":
        language = "en";
        break;
      case "en-US":
        language = "en";
        break;
      case "zh-CN":
        language = "zh";
        break;
      case "zh":
        language = "zh";
        break;
      case "es":
        language = "es";
        break;
      case "fr":
        language = "fr";
        break;
      case "de":
        language = "de";
        break;
      case "id":
        language = "id";
        break;
      case "ja":
        language = "ja";
        break;
      case "ko":
        language = "ko";
        break;
      case "ru":
        language = "ru";
        break;
      case "vi":
        language = "vi";
        break;
      case "pt":
        language = "pt";
        break;
      case "it":
        language = "it";
        break;
      case "ms":
        language = "ms";
        break;
      case "tr":
        language = "tr";
        break;
      default:
        language = Conf.DefaultLanguage;
      }
    }
  }

  return language;
}

i18n.use(initReactI18next).init({
  lng: initLanguage(),

  resources: resources,

  keySeparator: false,

  interpolation: {
    escapeValue: false,
  },
  // debug: true,
  saveMissing: true,
});

export default i18n;
