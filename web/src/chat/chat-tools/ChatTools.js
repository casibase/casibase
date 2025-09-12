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
import React from "react";
import "./ChatTools.css";

export const toolsConfig = {
  file: {
    icon: <LinkOutlined />,
    label: () => i18next.t("general:Add files"),
    options: {},
  },
  image: {
    icon: <FileImageOutlined />,
    label: () => i18next.t("general:Create Image"),
    options: {},
  },
  research: {
    icon: <SearchOutlined />,
    label: () => i18next.t("general:Deep Research"),
    options: {
      "prompt": "Research about: ",
    },
  },
  web_search: {
    icon: <GlobalOutlined />,
    label: () => i18next.t("general:Web Search"),
    options: {},
  },
  learn: {
    icon: <BookOutlined />,
    label: () => i18next.t("general:Study and Learn"),
    options: {},
  },
  canvas: {
    icon: <AppstoreOutlined />,
    label: () => i18next.t("general:Canvas"),
    options: {},
  },
  more: {
    icon: <ExperimentOutlined />,
    label: () => i18next.t("general:More"),
    options: {},
  },
};

const getChatTools = () => {
  return [
    {
      key: "file",
      icon: toolsConfig.file.icon,
      label: toolsConfig.file.label(),
    },
    {
      type: "divider",
    },
    {
      key: "image",
      icon: toolsConfig.image.icon,
      label: toolsConfig.image.label(),
    },
    {
      key: "research",
      icon: toolsConfig.research.icon,
      label: toolsConfig.research.label(),
    },
    {
      type: "divider",
    },
    {
      key: "more",
      icon: toolsConfig.more.icon,
      label: toolsConfig.more.label(),
      children: [
        {
          key: "web_search",
          icon: toolsConfig.web_search.icon,
          label: toolsConfig.web_search.label(),
        },
        {
          key: "learn",
          icon: toolsConfig.learn.icon,
          label: toolsConfig.learn.label(),
        },
        {
          key: "canvas",
          icon: toolsConfig.canvas.icon,
          label: toolsConfig.canvas.label(),
        },
      ],
    },
  ];
};

export const getToolOptions = (toolType) => {
  return toolsConfig[toolType]?.options || {};
};

export default getChatTools;
