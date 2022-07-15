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
import Avatar from "../Avatar";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import * as NotificationBackend from "../backend/NotificationBackend";
import {Link} from "react-router-dom";
import "../node.css";
import i18next from "i18next";
import {scoreConverter} from "../main/Tools";
import * as Conf from "../Conf";

class RightAccountBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicFavoriteNum: 0,
      nodeFavoriteNum: 0,
      followingNum: 0,
      topicSubscribeNum: 0,
      replySubscribeNum: 0,
      unreadNotificationNum: 0,
      themeMode: undefined,
    };
  }

  componentDidMount() {
    // this.getFavoriteNum();
    this.getUnreadNotificationNum();
    if (Conf.EnableNotificationAutoUpdate) {
      setInterval(() => {
        this.getUnreadNotificationNum();
      }, Conf.NotificationAutoUpdatePeriod * 1000);
    }
  }

  getUnreadNotificationNum() {
    NotificationBackend.getUnreadNotificationNum().then((res) => {
      this.setState({
        unreadNotificationNum: res?.data,
      });
    });
  }

  readAllNotifications() {
    NotificationBackend.updateReadStatus().then((res) => {
      if (res) {
        this.setState({
          unreadNotificationNum: 0,
        });
      }
    });
  }

  getFavoriteNum() {
    FavoritesBackend.getAccountFavoriteNum().then((res) => {
      if (res.status === "ok") {
        this.setState({
          topicFavoriteNum: res?.data[1],
          followingNum: res?.data[2],
          nodeFavoriteNum: res?.data[3],
          topicSubscribeNum: res?.data[4],
          replySubscribeNum: res?.data[5],
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  render() {
    const username = this.props.account?.name;
    const avatar = this.props.account?.avatar;
    const tagline = this.props.account?.tagline;
    const favorites = this.props.favorites;
    const {goldCount, silverCount, bronzeCount} = scoreConverter(this.props.account.score);

    return (
      <div className={`box ${this.props.nodeId}`}>
        <div className={`cell ${this.props.nodeId}`}>
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="48" valign="top">
                  <Avatar username={username} avatar={avatar} />
                </td>
                <td width="10" valign="top" />
                <td width="auto" align="left">
                  <div className="fr light-toggle" style={{cursor: "pointer"}} onClick={Setting.toggleThemeMode}>
                    <img src={Setting.getThemeBtnUrl()} align="absmiddle" height="10" alt="Light" />
                  </div>
                  <span className="bigger">
                    <Link to={`/member/${username}`} className={`${this.props.nodeId}`}>
                      {username}
                    </Link>
                  </span>
                  <div className="sep5"></div>
                  <span className="fade">{tagline}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="sep10" />
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="33%" align="center">
                  <Link to="/my/nodes" className="dark" style={{display: "block"}}>
                    <span className="bigger">{favorites === undefined ? this.state.nodeFavoriteNum : favorites[3]}</span>
                    <div className="sep3" />
                    <span className="fade">{i18next.t("bar:Nodes")}</span>
                  </Link>
                </td>
                <td
                  width="34%"
                  style={{
                    borderLeft: "1px solid rgba(100, 100, 100, 0.4)",
                    borderRight: "1px solid rgba(100, 100, 100, 0.4)",
                  }}
                  align="center"
                >
                  <Link to="/my/topics" className="dark" style={{display: "block"}}>
                    <span className="bigger">{favorites === undefined ? this.state.topicFavoriteNum + this.state.topicSubscribeNum : favorites[1] + favorites[4]}</span>
                    <div className="sep3" />
                    <span className="fade">{i18next.t("bar:Topics")}</span>
                  </Link>
                </td>
                <td width="33%" align="center">
                  <Link to="/my/following" className="dark" style={{display: "block"}}>
                    <span className="bigger">{favorites === undefined ? this.state.followingNum : favorites[2]}</span>
                    <div className="sep3" />
                    <span className="fade">{i18next.t("bar:Watch")}</span>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`cell ${this.props.nodeId}`} id="member-activity">
          <div className="member-activity-bar">
            <div className="member-activity-start" style={{width: "80px"}} />
          </div>
        </div>
        <div className={`cell ${this.props.nodeId}`} style={{padding: "8px", lineHeight: "100%"}}>
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="28">
                  <Link to="/i">
                    <img src={Setting.getStatic("/img/essentials/images.png")} width="28" border="0" style={{verticalAlign: "bottom"}} />
                  </Link>
                </td>
                <td width="10"></td>
                <td width="auto" valign="middle" align="left">
                  <a target="_blank" href={Setting.getMyResourcesUrl(this.props.account)} rel="noreferrer">
                    {i18next.t("bar:File library")}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`cell ${this.props.nodeId}`} style={{padding: "8px", lineHeight: "100%"}}>
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="28">
                  <Link to="/new">
                    <img src={Setting.getStatic("/img/essentials/compose.png")} width="28" border="0" style={{verticalAlign: "bottom"}} />
                  </Link>
                </td>
                <td width="10" />
                <td width="auto" valign="middle" align="left">
                  <Link to="/new" className={`${this.props.nodeId}`}>
                    {i18next.t("bar:Compose")}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="inner">
          <div className="fr" id="money" style={{margin: "-3px 0px 0px 0px"}}>
            <Link to="/balance" className="balance_area">
              {goldCount !== 0 ? (
                <span>
                  {" "}
                  {goldCount} <img src={Setting.getStatic("/img/gold@2x.png")} height="16" alt="G" border="0" />
                </span>
              ) : null}{" "}
              {silverCount} <img src={Setting.getStatic("/img/silver@2x.png")} height="16" alt="S" border="0" /> {bronzeCount} <img src={Setting.getStatic("/img/bronze@2x.png")} height="16" alt="B" border="0" />
            </Link>
          </div>
          {this.state.unreadNotificationNum !== 0 ? (
            <span>
              <img src={Setting.getStatic("/img/dot_orange.png")} align="absmiddle" />{" "}
            </span>
          ) : null}
          {this.state.unreadNotificationNum === 0 ? (
            <Link to="/notifications" className={`fade ${this.props.nodeId}`}>
              0 {i18next.t("bar:unread")}
            </Link>
          ) : (
            <strong>
              <Link onClick={() => this.readAllNotifications()} to="/notifications" className={`fade ${this.props.nodeId}`}>
                {this.state.unreadNotificationNum} {i18next.t("bar:unread")}
              </Link>
            </strong>
          )}
        </div>
      </div>
    );
  }
}

export default RightAccountBox;
