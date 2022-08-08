// Copyright 2020 The casbin Authors. All Rights Reserved.
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
import i18next from "i18next";
import {THEME_OPTIONS, loadTheme} from "../theme";
import "./rightTheme.css";

class RightThemeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: localStorage.getItem("CASNODE_THEME") || "default",
      themeOptions: THEME_OPTIONS,
    };
  }

  handleThemeSelect(item) {
    this.setState(
      {
        theme: item.value,
      },
      () => {
        this.loadThemeFile();
      }
    );
    localStorage.setItem("CASNODE_THEME", item.value);
  }

  loadThemeFile() {
    const {theme} = this.state;
    loadTheme(theme);
  }

  render() {
    return (
      <div className="box theme-box">
        <div className="cell">{i18next.t("theme:Choose theme")}</div>
        {this.state.themeOptions.map((item) => {
          return (
            <div className="cell rt-line" key={item.value} onClick={() => this.handleThemeSelect(item)}>
              {item.label}&nbsp;{item.value === this.state.theme ? "✅" : ""}
            </div>
          );
        })}
      </div>
    );
  }
}

export default RightThemeBox;
