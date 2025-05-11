// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import {Button, Tooltip} from "antd";
import {SettingOutlined} from "@ant-design/icons";
import i18next from "i18next";

const PromptInput = ({value, onChange, disabled}) => {
  // 渲染触发按钮
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "5px",
    }}>
      <Tooltip title={i18next.t("chat:Set custom prompt for this conversation")}>
        <Button
          icon={<SettingOutlined />}
          type="text"
          size="small"
          onClick={() => onChange(value)}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {value ? i18next.t("chat:Edit Prompt") : i18next.t("chat:Set Prompt")}
        </Button>
      </Tooltip>
    </div>
  );
};

export default PromptInput;
