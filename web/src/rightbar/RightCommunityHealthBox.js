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
import { Link } from "react-router-dom";
import * as BasicBackend from "../backend/BasicBackend";
import i18next from "i18next";

class RightCommunityHealthBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
    };
  }

  componentDidMount() {
    this.getHealthInfo();
  }

  getHealthInfo() {
    if (this.state.info !== null) {
      return;
    }
    BasicBackend.getCommunityHealth().then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  render() {
    return (
      <div className="box">
        <div className="cell">
          <span className="fade">{i18next.t("bar:Community Stats")}</span>
        </div>
        <div className="cell">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tr>
              <td width="70" align="right">
                <span className="gray">{i18next.t("bar:Member")}</span>
              </td>
              <td width="auto" align="left">
                <strong>{this.state.info?.member}</strong>
              </td>
            </tr>
            <tr>
              <td width="70" align="right">
                <span className="gray">{i18next.t("bar:Topic")}</span>
              </td>
              <td width="auto" align="left">
                <strong>{this.state.info?.topic}</strong>
              </td>
            </tr>
            <tr>
              <td width="70" align="right">
                <span className="gray">{i18next.t("bar:Reply")}</span>
              </td>
              <td width="auto" align="left">
                <strong>{this.state.info?.reply}</strong>
              </td>
            </tr>
          </table>
        </div>
        <div className="inner">
          <span className="chevron">›</span>{" "}
          <Link to="/top/rich">{i18next.t("bar:Rich List")}</Link>
          <div className="sep5"></div>
          <span className="chevron">›</span>{" "}
          <Link to="/top/player">{i18next.t("bar:Consumption list")}</Link>
        </div>
      </div>
    );
  }
}

export default RightCommunityHealthBox;
