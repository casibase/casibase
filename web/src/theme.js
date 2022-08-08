import i18next from "i18next";

export const THEME_OPTIONS = [
  {
    label: i18next.t("theme:Default"),
    value: "default",
    link: "",
  },
  {
    label: i18next.t("theme:v2ex-zhihu-theme"),
    value: "v2ex-zhihu-theme",
    link: "https://cdn.jsdelivr.net/gh/viewweiwu/v2ex-zhihu-theme/v2ex.css",
  },
];

/**
 * load theme
 * @params theme value
 */
export const loadTheme = (theme) => {
  if (!theme) {
    return;
  }

  const currTheme = THEME_OPTIONS.find((item) => item.value === theme);

  const before = document.querySelector("#casnodeTheme");
  if (before) {
    before.parentNode.removeChild(before);
  }

  if (currTheme.link) {
    const after = document.createElement("link");
    after.rel = "stylesheet";
    after.type = "text/css";
    after.id = "casnodeTheme";
    after.href = currTheme?.link;

    document.body.appendChild(after);
  }
};
