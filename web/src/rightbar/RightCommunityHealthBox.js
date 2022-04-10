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
    this._PlaceholderadsInit();
  }

  readposter() {
    PosterBackend.readposter("r_box_poster").then((res) => {
      let poster = res;
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
              <img src={this.state.poster["picture_link"]} border="0" width="250" alt={this.state.poster["advertiser"]} style={{ vertical: "bottom" }} />
            </a>
          </div>
          <div className="sidebar_compliance flex-one-row" style={{ display: "flex", justifyContent: "space-between" }}>
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

  setWWAds(wwadsDiv) {
    let adsPlace = document.getElementsByClassName("placeholder");
    adsPlace[0].innerHTML = wwadsDiv;
    var _sr = document.createElement("script");
    _sr.type = "text/javascript";
    _sr.async = false;
    _sr.src = "https://cdn.wwads.cn/js/makemoney.js";
    (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(_sr);
  }

  setThirdPartyAds(thirdPartyAdsDiv) {
    let adsPlace = document.getElementsByClassName("placeholder");
    adsPlace[0].innerHTML = thirdPartyAdsDiv;
  }

  _PlaceholderadsInit() {
    let language = i18next.language;
    // wwads
    let wwadsDiv = '<div class="wwads-cn wwads-horizontal" data-id="116" style="z-index: 10;position: fixed;top: 130px;right: 10px;max-width: 200px;padding: 10px;border-radius: 5px;"></div>';
    // google ads
    let thirdPartyDiv =
      '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3509678918753247" crossorigin="anonymous"></script><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-" data-ad-slot="" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>';

    if (wwadsDiv !== null && thirdPartyDiv !== null) {
      if (language.startsWith("zh")) {
        this.setWWAds(wwadsDiv);
      } else {
        this.setThirdPartyAds(thirdPartyDiv);
      }
    } else {
      if (wwadsDiv !== null) {
        this.setWWAds(wwadsDiv);
      }
      if (thirdPartyDiv !== null) {
        this.setThirdPartyAds(thirdPartyDiv);
      }
    }
  }

  render() {
    return (
      <div>
        {this.renderAd()}
        <div class="placeholder"></div>
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
