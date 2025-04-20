// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import {notification} from "antd";
import {CloseOutlined} from "@ant-design/icons";

class PreviewInterceptor {
  constructor(getAccount, history) {
    this.getAccount = getAccount;
    this.history = history;
    this.handleButtonClick = this.handleButtonClick.bind(this);
    document.addEventListener("click", this.handleButtonClick, true);
    this.bannededButtonTexts = [i18next.t("general:OK"), i18next.t("general:Save"), i18next.t("general:Save & Exit"), i18next.t("store:Refresh Vectors"), i18next.t("general:Add"), i18next.t("provider:Add Storage Provider")];
    this.bannedMessageActions = ["like", "dislike"];
    this.handleSpanClick = this.handleSpanClick.bind(this);
    document.addEventListener("click", this.handleSpanClick, true);
    this.bannedSpanLabels = ["save"];
  }

  handleButtonClick(event) {
    const button = event.target.closest("button");
    if (button) {
      const buttonSpan = button.querySelector("span[aria-label]");
      if (buttonSpan && !this.bannedMessageActions.includes(buttonSpan.getAttribute("aria-label"))) {
        return;
      }
      if (button.getAttribute("role") === "switch") {
        return;
      }
      const titleEl = button.querySelector("title");
      const titleText = titleEl?.textContent;
      if (titleText === "Stop Loading") {
        return;
      }
      if (button.innerText !== "" && !this.bannededButtonTexts.includes(button.innerText.replace(/\s+/g, ""))) {
        return;
      }
      if (this.redirectIfAnonymous(this.getAccount())) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
    }
  }

  handleSpanClick(event) {
    const span = event.target.closest("span");
    if (span) {
      if (span.hasAttribute("aria-label") && this.bannedSpanLabels.includes(span.getAttribute("aria-label"))) {
        if (this.redirectIfAnonymous(this.getAccount())) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }
      }
    }
  }

  enableButtonsIfAnonymousinPreview() {
    if (Setting.isAnonymousUser(this.getAccount()) && !Conf.DisablePreviewMode) {
      const buttons = document.querySelectorAll("button");
      buttons.forEach(button => {
        button.disabled = false;
      });
    }
  }

  redirectIfAnonymous(account) {
    if (Setting.isAnonymousUser(account)) {
      this.showLoginRequirement();
      return true;
    } else {
      return false;
    }
  }

  showLoginRequirement() {
    const onClose = () => {
      this.history.push(window.location.pathname);
      return Setting.redirectToLogin();
    };
    notification.open({
      message: (
        <div style={{display: "flex", alignItems: "center"}}>
          <img
            className="notification-icon" style={{width: "15%", height: "15%", marginRight: "5%"}} src={`${Setting.StaticBaseUrl}/img/hushed-face.svg`}
          />
          <div style={{display: "flex", flexDirection: "column"}}>
            {/* 右上文本 */}
            <span style={{fontSize: "18px", fontWeight: "bold", marginBottom: "10px"}}>
              {i18next.t("login:Please log in to use this feature")}
            </span>
            {/* 右下文本 */}
            <span style={{fontSize: "14px", color: "#555"}}>
              {i18next.t("login:You will be redirected to the login page shortly")}
            </span>
          </div>
        </div>
      ),
      onClose,
      closeIcon: <CloseOutlined style={{fontSize: 16}} onClick={(e) => {
        e.stopPropagation();
        notification.destroy();
      }} />,
      duration: 3,
      showProgress: true,
      pauseOnHover: true,
    });
  }
}

export {PreviewInterceptor};
