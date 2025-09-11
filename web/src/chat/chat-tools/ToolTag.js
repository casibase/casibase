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
import {Tag} from "antd";
import {
  AppstoreOutlined,
  BookOutlined,
  ExperimentOutlined,
  FileImageOutlined,
  GlobalOutlined,
  LinkOutlined,
  SearchOutlined
} from "@ant-design/icons";
import i18next from "i18next";
import "./ToolTag.css";

const getToolIcon = (toolType) => {
  switch (toolType) {
  case "image":
    return <FileImageOutlined />;
  case "web_search":
    return <GlobalOutlined />;
  case "research":
    return <SearchOutlined />;
  case "learn":
    return <BookOutlined />;
  case "canvas":
    return <AppstoreOutlined />;
  case "more":
    return <ExperimentOutlined />;
  case "file":
    return <LinkOutlined />;
  default:
    return null;
  }
};

const getToolLabel = (toolType) => {
  switch (toolType) {
  case "image":
    return i18next.t("general:Create Image");
  case "web_search":
    return i18next.t("general:Web Search");
  case "research":
    return i18next.t("general:Deep Research");
  case "learn":
    return i18next.t("general:Study and Learn");
  case "canvas":
    return i18next.t("general:Canvas");
  case "more":
    return i18next.t("general:More");
  case "file":
    return i18next.t("general:Add files");
  default:
    return "";
  }
};

const ToolTag = ({toolType, onClose}) => {
  if (toolType === "text" || !toolType) {
    return null;
  }

  const icon = getToolIcon(toolType);
  const label = getToolLabel(toolType);

  const tagStyle = {
    fontSize: "14px",
    padding: "6px 12px",
    marginRight: "8px",
    borderRadius: "16px",
    backgroundColor: "rgba(247, 247, 248, 0.9)",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    color: "rgba(0, 0, 0, 0.75)",
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div className="ant-tool-tag-container">
      <Tag
        icon={icon}
        closeIcon
        onClose={onClose}
        className="ant-tool-tag"
        style={tagStyle}
      >
        {label}
      </Tag>
    </div>
  );
};

export default ToolTag;
