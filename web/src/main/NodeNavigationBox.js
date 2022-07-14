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
import * as BasicBackend from "../backend/BasicBackend";
import * as Setting from "../Setting";
import {Link} from "react-router-dom";
import i18next from "i18next";

class NodeNavigationBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodeNavigation: [],
    };
  }

  componentDidMount() {
    this.getNodeNavigation();
  }

  getNodeNavigation() {
    BasicBackend.getNodeNavigation().then((res) => {
      this.setState({
        nodeNavigation: res.data,
      });
    });
  }

  renderNode(node) {
    return (
      <span key={node?.id}>
        <Link to={`/go/${encodeURIComponent(node?.id)}`} style={{fontSize: "14px"}}>
          {node?.name}
        </Link>
        &nbsp; &nbsp;
      </span>
    );
  }

  renderTab(tab) {
    if (tab?.id === "all") {
      return null;
    }

    return (
      <div key={tab?.id} className="cell">
        <table cellPadding="0" cellSpacing="0" border="0">
          <tbody>
            <tr>
              <td align="right" width="80">
                <span className="fade">{tab?.name}</span>
              </td>
              <td
                style={{
                  lineHeight: "200%",
                  paddingLeft: "10px",
                  wordBreak: "keep-all",
                }}
              >
                {tab?.nodes?.map((node) => {
                  return this.renderNode(node);
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className="box">
        <div className="cell">
          <div className="fr">
            <Link to="/planes">{i18next.t("node:View all nodes")}</Link>
          </div>
          <span className="fade">
            <strong>{Setting.getForumName()}</strong> / {i18next.t("node:Node navigation")}
          </span>
        </div>
        {this.state.nodeNavigation?.map((tab) => {
          return this.renderTab(tab);
        })}
      </div>
    );
  }
}

export default NodeNavigationBox;
