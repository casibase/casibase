import i18n from "i18next";
import zh from "./locales/zh/data.json";
import en from "./locales/en/data.json";
import * as Conf from "./Conf";
import * as Setting from "./Setting";

const resources = {
  en: en,
  zh: zh,
};

function initLanguage() {
  let language = localStorage.getItem("language");
  if (language === undefined || language == null) {
    if (Conf.ForceLanguage !== "") {
      language = Conf.ForceLanguage;
    } else {
      let userLanguage;
      userLanguage = navigator.language;
      switch (userLanguage) {
        case "zh-CN":
          language = "zh";
          break;
        case "zh":
          language = "zh";
          break;
        case "en":
          language = "en";
          break;
        case "en-US":
          language = "en";
          break;
        default:
          language = Conf.DefaultLanguage;
      }
    }
  }
  Setting.changeMomentLanguage(language);

  return language;
}

i18n.init({
  lng: initLanguage(),

  resources: resources,

  keySeparator: false,

  interpolation: {
    escapeValue: false,
  },
  //debug: true,
  saveMissing: true,
});

export default i18n;
