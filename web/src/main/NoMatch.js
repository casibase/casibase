// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import {Link, withRouter} from "react-router-dom";
import * as Setting from "../Setting";
import "./NoMatch.css";
import i18next from "i18next";
import {Helmet} from "react-helmet";

class NoMatch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  renderBox() {
    return (
      <div>
        <div className="box">
          <Helmet>
            <title>{`404 - ${Setting.getForumName()}`}</title>
          </Helmet>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            404 Object Not Found
          </div>
        </div>
        <div className="box-transparent">
          <div className="cell-translucent">The object you were looking for is not found on the {Setting.getForumName()} Space Station.</div>
          <div className="cell-translucent">你要寻找的物件不存在于 {Setting.getForumName()} 空间站上。</div>
          <div className="cell-translucent">L&apos;objet que vous cherchiez ne se trouve pas sur la station spatiale {Setting.getForumName()}.</div>
          <div className="cell-translucent">
            Das von Ihnen gesuchte Objekt wird auf der {Setting.getForumName()}
            -Raumstation nicht gefunden.
          </div>
          <div className="cell-translucent">お探しの物体は {Setting.getForumName()} 宇宙ステーションにはありません。</div>
          <div className="cell-translucent">Объект, который вы искали, не найден на космической станции {Setting.getForumName()}.</div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="main">
        {this.renderBox()}
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            {i18next.t("general:Navigation")}
          </div>
        </div>
        <div className="box-transparent">
          <div className="cell-translucent">
            &nbsp;›&nbsp;
            <a href="/planes">{i18next.t("plane:Plane list")}</a>
          </div>
          <div className="cell-translucent">
            &nbsp;›&nbsp;
            <a href="/recent">{i18next.t("topic:Recent Topics")}</a>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(NoMatch);
