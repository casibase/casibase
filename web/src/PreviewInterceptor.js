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

// all clickable buttons in preview mode shuold be added attribute: preview-clickable="true"

import * as Setting from "./Setting";

class PreviewInterceptor {
  constructor(getAccount) {
    this.getAccount = getAccount;
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    document.addEventListener("click", this.handleLinkClick, true);
    document.addEventListener("click", this.handleButtonClick, true);
  }

  handleButtonClick(event) {
    const button = event.target.closest("button");
    if (button) {
      let isClickable = false;
      if (button.getAttribute("preview-clickable") && button.getAttribute("preview-clickable") === "true") {
        isClickable = true;
      }
      if (!isClickable && Setting.redirectIfAnonymous(this.getAccount())) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  handleLinkClick(event) {
    const link = event.target.closest("a");
    if (link && link.tagName === "A") {
      const pathPattern = /^\/[^/]+$/; // match /pathLeve1  ,   block all /pathleve1/**/**
      const path = link.getAttribute("href");
      if (!pathPattern.test(path)) {
        if (Setting.redirectIfAnonymous(this.getAccount())) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }
  }
}

export {PreviewInterceptor};
