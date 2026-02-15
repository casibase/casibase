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
import * as Setting from "./Setting";
import {Dropdown, Space} from "antd";
import "./App.less";
import i18next from "i18next";
import {CheckOutlined, ShrinkOutlined} from "@ant-design/icons";
import {MoonOutlined, SunOutlined} from "@ant-design/icons";

export const Themes = [
  {label: "Default", key: "default", icon: <SunOutlined style={{fontSize: "24px"}} />},        // i18next.t("general:Default")
  {label: "Dark", key: "dark", icon: <MoonOutlined style={{fontSize: "24px"}} />},          // i18next.t("theme:Dark")
  {label: "Compact", key: "compact", icon: <ShrinkOutlined style={{fontSize: "24px"}} />}, // i18next.t("theme:Compact")
];

function getIcon(themeKey) {
  if (themeKey?.includes("dark")) {
    return Themes.find(t => t.key === "dark").icon;
  } else if (themeKey?.includes("default")) {
    return Themes.find(t => t.key === "default").icon;
  }
}

class ThemeSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  icon = getIcon(this.props.themeAlgorithm);

  getThemeItems() {
    return Themes.map((theme) => Setting.getItem(
      <Space>
        {i18next.t(`theme:${theme.label}`)}
        {this.props.themeAlgorithm.includes(theme.key) ? <CheckOutlined style={{marginLeft: "5px"}} /> : null}
      </Space>,
      theme.key, theme.icon));
  }

  render() {
    const onClick = (e) => {
      let nextTheme;
      if (e.key === "compact") {
        if (this.props.themeAlgorithm.includes("compact")) {
          nextTheme = this.props.themeAlgorithm.filter((theme) => theme !== "compact");
        } else {
          nextTheme = [...this.props.themeAlgorithm, "compact"];
        }
      } else {
        if (!this.props.themeAlgorithm.includes(e.key)) {
          if (e.key === "dark") {
            nextTheme = [...this.props.themeAlgorithm.filter((theme) => theme !== "default"), e.key];
          } else {
            nextTheme = [...this.props.themeAlgorithm.filter((theme) => theme !== "dark"), e.key];
          }
        } else {
          nextTheme = [...this.props.themeAlgorithm];
        }
      }

      this.icon = getIcon(nextTheme);
      this.props.onChange(nextTheme);
    };

    return (
      <Dropdown menu={{
        items: this.getThemeItems(),
        onClick,
        selectable: true,
        multiple: true,
        selectedKeys: [...this.props.themeAlgorithm],
      }}>
        <div className="select-box">
          {this.icon}
        </div>
      </Dropdown>
    );
  }
}

export default ThemeSelect;
