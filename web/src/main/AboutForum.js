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
import i18next from "i18next";
import * as BasicBackend from "../backend/BasicBackend";
import * as Conf from "../Conf";
import {Helmet} from "react-helmet";

class AboutForum extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      version: "",
    };
  }

  componentDidMount() {
    this.getForumVersion();
  }

  getForumVersion() {
    BasicBackend.getForumVersion().then((res) => {
      this.setState({
        version: res.data,
      });
    });
  }

  render() {
    return (
      <div>
        <Helmet>
          <title>{`${i18next.t("about:About")} - ${Setting.getForumName()}`}</title>
        </Helmet>
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            {i18next.t("about:About")}
          </div>
        </div>
        <div className="box">
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("about:Introduction")}
                    {":"}
                  </td>
                  <td width="auto" align="left">
                    {i18next.t("about:Introduction-content")}
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("about:Version")}
                    {":"}
                  </td>
                  <td width="auto" align="left">
                    <a href={`${Conf.GithubRepo}/commit/${this.state.version}`} target="_blank" rel="noopener noreferrer">
                      {this.state.version.substring(0, 7)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    Github:{"  "}
                  </td>
                  <td width="auto" align="left">
                    <a href={`${Conf.GithubRepo}`} target="_blank" rel="noopener noreferrer">
                      Casnode
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width={Setting.PcBrowser ? "120" : "90"} align="right">
                    {i18next.t("about:Official website")}
                    {":"}
                  </td>
                  <td width="auto" align="left">
                    <a href={"https://casnode.org/"} target="_blank" rel="noopener noreferrer">
                      Casnode official website
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(AboutForum);
