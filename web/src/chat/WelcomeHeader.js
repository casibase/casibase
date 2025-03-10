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

import React from "react";
import {Welcome} from "@ant-design/x";
import * as Setting from "../Setting";
import i18next from "i18next";

const WelcomeHeader = ({store}) => {
  const avatar = store?.avatar || Setting.AiAvatar;

  return (
    <Welcome
      variant="borderless"
      icon={avatar}
      title={store?.welcomeTitle || i18next.t("chat:Hello, I'm Casibase AI Assistant")}
      description={store?.welcomeText || i18next.t("chat:I'm here to help answer your questions")}
    />
  );
};

export default WelcomeHeader;
