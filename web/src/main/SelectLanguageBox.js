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
import * as Setting from "../Setting";
import { withRouter, Link } from "react-router-dom";

class SelectLanguageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      previous: "",
    };
    this.state.previous = this.props.location.query?.previous;
  }

  ChangeLanguage(language) {
    if (this.state.previous == undefined) {
      Setting.ChangeLanguage(language, "/");
    } else {
      Setting.ChangeLanguage(language, this.state.previous);
    }
  }

  render() {
    return (
      <div align="center">
        <div
          className="box"
          style={{ width: Setting.PcBrowser ? "600px" : "auto" }}
        >
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span> Select Language /
            选择语言
          </div>
          <div className="cell">
            {Setting.PcBrowser ? (
              <span>
                Please select the language you would like to use on{" "}
                {Setting.getForumName()}
              </span>
            ) : (
              <span>Please select the language you would like to use:</span>
            )}
          </div>
          <a
            href="#"
            onClick={() => this.ChangeLanguage("en")}
            className={"lang-selector"}
          >
            English
          </a>
          <a
            href="#"
            onClick={() => this.ChangeLanguage("zh")}
            className={"lang-selector"}
          >
            简体中文
          </a>
        </div>
      </div>
    );
  }
}

export default withRouter(SelectLanguageBox);
