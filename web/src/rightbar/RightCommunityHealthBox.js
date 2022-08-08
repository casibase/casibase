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
import {Link} from "react-router-dom";
import * as BasicBackend from "../backend/BasicBackend";
import * as PosterBackend from "../backend/PosterBackend";
import i18next from "i18next";

class RightCommunityHealthBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
      poster: {
        name: "",
        advertiser: "",
        link: "",
        picture_link: "",
      },
    };
  }

  componentDidMount() {
    this.getHealthInfo();
    this.readposter();
  }

  readposter() {
    PosterBackend.readposter("r_box_poster").then((res) => {
      const poster = res;
      if (poster) {
        this.setState({
          poster: poster,
        });
      }
    });
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

  renderAd() {
    if (this.state.poster.picture_link === "") {
      return null;
    }

    return (
      <React.Fragment>
        <div className="box">
          <div className="inner" align="center">
            <a href={this.state.poster["link"]} target="_blank" rel="noopener noreferrer">
              <img src={this.state.poster["picture_link"]} border="0" width="250" alt={this.state.poster["advertiser"]} style={{vertical: "bottom"}} />
            </a>
          </div>
          <div className="sidebar_compliance flex-one-row" style={{display: "flex", justifyContent: "space-between"}}>
            <div>
              <a href={this.state.poster["link"]} target="_blank" rel="noopener noreferrer">
                {this.state.poster["advertiser"]}
              </a>
            </div>
            <a href="/" target="_blank">
              {i18next.t("bar:Ad")}
            </a>
          </div>
        </div>
        <div className="sep20" />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div>
        {this.renderAd()}
        <div className="box">
          <div className="cell">
            <span className="fade">{i18next.t("bar:Community Stats")}</span>
          </div>
          <div className="cell">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
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
              </tbody>
            </table>
          </div>
          <div className="inner">
            <span className="chevron">›</span> <Link to="/top/rich">{i18next.t("bar:Rich List")}</Link>
            <div className="sep5" />
            <span className="chevron">›</span> <Link to="/top/player">{i18next.t("bar:Consumption list")}</Link>
          </div>
        </div>
      </div>
    );
  }
}

export default RightCommunityHealthBox;
