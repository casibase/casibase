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
import {Link, withRouter} from "react-router-dom";
import i18next from "i18next";
import {Helmet} from "react-helmet";

class SelectLanguageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      previous: "",
    };
    this.state.previous = this.props.location.query?.previous;
  }

  changeLanguage(language) {
    if (this.state.previous === undefined) {
      Setting.changeLanguage(language, "/");
    } else {
      Setting.changeLanguage(language, this.state.previous);
    }
  }

  render() {
    return (
      <div align="center">
        <div className="box" style={{width: Setting.PcBrowser ? "600px" : "auto"}}>
          <Helmet>
            <title>{`${i18next.t("general:Language")} - ${Setting.getForumName()}`}</title>
          </Helmet>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> Select Language / 选择语言
          </div>
          <div className="cell">{Setting.PcBrowser ? <span>Please select the language you would like to use on {Setting.getForumName()}</span> : <span>Please select the language you would like to use:</span>}</div>
          <a href="#" onClick={() => this.changeLanguage("en")} className={"lang-selector"}>
            English
          </a>
          <a href="#" onClick={() => this.changeLanguage("zh")} className={"lang-selector"}>
            简体中文
          </a>
          <a href="#" onClick={() => this.changeLanguage("zh-TW")} className={"lang-selector"}>
            繁體中文
          </a>
          <a href="#" onClick={() => this.changeLanguage("fr")} className={"lang-selector"}>
            Français
          </a>
          <a href="#" onClick={() => this.changeLanguage("de")} className={"lang-selector"}>
            Deutsch
          </a>
          <a href="#" onClick={() => this.changeLanguage("ko")} className={"lang-selector"}>
            한국어
          </a>
          <a href="#" onClick={() => this.changeLanguage("ru")} className={"lang-selector"}>
            Русский
          </a>
          <a href="#" onClick={() => this.changeLanguage("ja")} className={"lang-selector"}>
            日本語
          </a>
          <a href="#" onClick={() => this.changeLanguage("kk")} className={"lang-selector"}>
            قازاق ٴتىلى
          </a>
        </div>
      </div>
    );
  }
}

export default withRouter(SelectLanguageBox);
