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
import * as SensitiveBackend from "../backend/SensitiveBackend.js";
import * as Setting from "../Setting";
import i18next from "i18next";

class AdminSensitive extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sensitiveList: null,
      newSensitive: null,
    };
  }

  componentDidMount() {
    SensitiveBackend.getSensitiveList().then((res) => {
      this.setState({
        sensitiveList: res,
      });
    });
  }

  delSensitive(item) {
    SensitiveBackend.delSensitive(item).then((res) => {
      if (res.status === "ok") {
        SensitiveBackend.getSensitiveList().then((res) => {
          this.setState({
            sensitiveList: res,
          });
        });
      } else {
        alert(res.msg);
      }
    });
  }

  renderSensitiveItem(item) {
    return (
      <div className="cell">
        <a
          href="javascript:void(0);"
          //   onClick={}
        >
          {item}
        </a>
        <a style={{float: "right"}} onClick={() => this.delSensitive(item)}>
          delete
        </a>
      </div>
    );
  }

  addSensitive() {
    SensitiveBackend.addSensitive(document.getElementById("newsensitive").value).then((res) => {
      if (res.status === "ok") {
        SensitiveBackend.getSensitiveList().then((res) => {
          this.setState({
            sensitiveList: res,
          });
        });
      } else {
        alert(res.msg);
      }
    });
  }

  renderNewSensitive() {
    return (
      <div className="cell">
        <input type="text" id="newsensitive" />
        <a style={{float: "right"}} onClick={() => this.addSensitive()}>
          add
        </a>
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin"}>{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin/sensitive"}>{i18next.t("sensitive:sensitive management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <span>{this.props.event === "new" ? i18next.t("sensitive:new sensitive") : ""}</span>
        </div>
        <div className="cell">
          {this.state.sensitiveList !== null && this.state.sensitiveList.length !== 0 ? (
            this.state.sensitiveList.map((word) => this.renderSensitiveItem(word))
          ) : (
            <div
              className="cell"
              style={{
                textAlign: "center",
                height: "100px",
                lineHeight: "100px",
              }}
            >
              {"No data"}
            </div>
          )}
          {this.renderNewSensitive()}
        </div>
      </div>
    );
  }

  render() {
    return this.renderHeader();
  }
}

export default withRouter(AdminSensitive);
