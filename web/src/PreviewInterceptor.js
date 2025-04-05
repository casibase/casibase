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
import {Button, notification} from "antd";

class PreviewInterceptor {
  constructor(getAccount) {
    this.getAccount = getAccount;
    this.handleButtonClick = this.handleButtonClick.bind(this);
    document.addEventListener("click", this.handleButtonClick, true);
    this.allowedButtonTexts = [i18next.t("general:Edit"), i18next.t("general:View"), i18next.t("general:Close")];
    this.allowedMessageActions = ["copy", "play-circle"];
    this.allowedSwitch = [i18next.t("general:Is deleted"), i18next.t("general:Need notify"), i18next.t("general:Is alerted"), i18next.t("message:Chat")];
    const observer = new MutationObserver(() => {
      this.enableButtonsIfAnonymousinPreview();
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  handleButtonClick(event) {
    const button = event.target.closest("button");
    if (button) {
      if (this.allowedButtonTexts.includes(button.innerText.replace(/\s+/g, ""))) {
        return;
      }
      const buttonSpan = button.querySelector("span span[aria-label]");
      if (buttonSpan && this.allowedMessageActions.includes(buttonSpan.getAttribute("aria-label"))) {
        return;
      }
      const buttonDiv = button.closest("div");
      const silbingDiv = buttonDiv ? buttonDiv.previousElementSibling : null;
      if (silbingDiv && this.allowedSwitch.includes(silbingDiv.innerText.replace(/[:]/g, ""))) {
        return;
      }
      if (this.redirectIfAnonymous(this.getAccount())) {
        event.stopPropagation();
        event.preventDefault();
        return;
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
      return Setting.redirectToLogin();
    };
    notification.open({
      message: (
        <div style={{display: "flex", alignItems: "center"}}>
          <img
            className="notification-icon" style={{width: 36, marginLeft: "-8px", marginRight: "10px"}} src={`${Setting.StaticBaseUrl}/img/hushed-face.svg`}
          />
          <span>{i18next.t("login:Login Required")}</span>
        </div>
      ),
      closeIcon: null,
      onClose,
      actions: [
        <Button type="link" size="small" key="dismiss" onClick={() => notification.destroy()}>
          {i18next.t("general:Close")}
        </Button>,
      ],
      description: i18next.t("login:Please log in first before using this function. It will then redirect you to the login interface."),
      duration: 5,
      showProgress: true,
      pauseOnHover: true,
    });
  }
}

export {PreviewInterceptor};
