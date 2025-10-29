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

import React from "react";
import {Button, Dropdown, Space} from "antd";
import {CheckOutlined, GlobalOutlined, PaperClipOutlined, PlusOutlined} from "@ant-design/icons";
import i18next from "i18next";

const ChatInputMenu = ({disabled, webSearchEnabled, onWebSearchChange, onFileUpload, disableFileUpload}) => {
  const handleWebSearchToggle = () => {
    if (onWebSearchChange) {
      onWebSearchChange(!webSearchEnabled);
    }
  };

  const menuItems = [
    {
      key: "attach-file",
      label: (
        <div style={{
          display: "flex",
          alignItems: "center",
          minWidth: "160px",
          padding: "4px 8px",
        }}>
          <Space>
            <PaperClipOutlined style={{fontSize: "16px"}} />
            <span>{i18next.t("chat:Add attachment")}</span>
          </Space>
        </div>
      ),
      onClick: onFileUpload,
      disabled: disableFileUpload,
    },
    {
      key: "web-search",
      label: (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: "160px",
          padding: "4px 8px",
        }}>
          <Space>
            <GlobalOutlined style={{fontSize: "16px"}} />
            <span>{i18next.t("chat:Web search")}</span>
          </Space>
          {webSearchEnabled && <CheckOutlined style={{color: "#1890ff", fontSize: "14px"}} />}
        </div>
      ),
      onClick: handleWebSearchToggle,
    },
  ];

  return (
    <Dropdown
      menu={{items: menuItems}}
      trigger={["click"]}
      placement="topLeft"
      disabled={disabled}
    >
      <Button
        type="text"
        icon={<PlusOutlined />}
        disabled={disabled}
        style={{
          color: disabled ? "#d9d9d9" : undefined,
        }}
      />
    </Dropdown>
  );
};

export default ChatInputMenu;
