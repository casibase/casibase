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
import {Link} from "react-router-dom";
import i18next from "i18next";
import {Helmet} from "react-helmet";

class SelectLanguageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    return (
      <div align="center">
        <div className="box" style={{width: Setting.PcBrowser ? "600px" : "auto"}}>
          <Helmet>
            <title>{`${i18next.t("footer:Select Editor")} - ${Setting.getForumName()}`}</title>
          </Helmet>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> Select Default Editor / 选择默认编辑器
          </div>
          <div className="cell">{Setting.PcBrowser ? <span>Please select the Default Editor you would like to use on {Setting.getForumName()}</span> : <span>Please select the Default Editor you would like to use:</span>}</div>
          <a href="javascript:void(0);" onClick={() => Setting.changeEditorType("markdown")} className={"lang-selector"}>
            {i18next.t("new:Markdown")}
          </a>
          <a href="javascript:void(0);" onClick={() => Setting.changeEditorType("richtext")} className={"lang-selector"}>
            {i18next.t("new:RichText")}
          </a>
        </div>
      </div>
    );
  }
}

export default SelectLanguageBox;
