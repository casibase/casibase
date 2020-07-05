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

class RightAccountBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicFavoriteNum: 1,
      nodeFavoriteNum: 1,
      followingNum: 1,
    };
  }

  componentDidMount() {
    this.getFavoriteNum()
  }

  getFavoriteNum() {
    FavoritesBackend.getAccountFavoriteNum()
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            topicFavoriteNum: res?.data[1],
            followingNum: res?.data[2],
            nodeFavoriteNum: res?.data[3],
          });
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  render() {
    const username = this.props.account?.id;

    return (
      <div className="box">
        <div className="cell">
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td width="48" valign="top">
                <a href={`/member/${username}`}>
                  <Avatar username={username} />
                </a>
              </td>
              <td width="10" valign="top" />
              <td width="auto" align="left">
                <div className="fr">
                  <a href="/settings/night/toggle?once=93095" className="light-toggle">
                    <img src={Setting.getStatic("/static/img/toggle-light.png")} align="absmiddle" height="10" alt="Light" />
                  </a>
                </div>
                <span className="bigger">
                  <a href={`/member/${username}`}>
                    {username}
                  </a>
                </span>
              </td>
            </tr>
            </tbody>
          </table>
          <div className="sep10" />
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td width="33%" align="center">
                <a href="/my/nodes" className="dark" style={{display: "block"}}>
                  <span className="bigger">
                    {this.state.nodeFavoriteNum}
                  </span>
                  <div className="sep3" />
                  <span className="fade">
                    Node
                  </span>
                </a>
              </td>
              <td width="34%"
                  style={{borderLeft: "1px solid rgba(100, 100, 100, 0.4)", borderRight: "1px solid rgba(100, 100, 100, 0.4)"}}
                  align="center">
                <a href="/my/topics" className="dark" style={{display: "block"}}>
                  <span className="bigger">
                    {this.state.topicFavoriteNum}
                  </span>
                <div className="sep3" />
                <span className="fade">
                  Topic
                </span>
                </a>
              </td>
              <td width="33%" align="center">
                <a href="/my/following" className="dark" style={{display: "block"}}>
                  <span className="bigger">
                    {this.state.followingNum}
                  </span>
                  <div className="sep3" />
                  <span className="fade">
                    Watch
                  </span>
                </a>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div className="cell" id="member-activity">
          <div className="member-activity-bar">
            <div className="member-activity-start" style={{width: "80px"}} />
          </div>
        </div>
        <div className="cell" style={{padding: "8px", lineHeight: "100%"}}>
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td width="28">
                <a href="/new">
                  <img src={Setting.getStatic("/static/img/essentials/compose.png")} width="28" border="0" style={{verticalAlign: "bottom"}} />
                </a>
              </td>
              <td width="10" />
              <td width="auto" valign="middle" align="left">
                <a href="/new">
                  Create a Post
                </a>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div className="inner">
          <div className="fr" id="money" style={{margin: "-3px 0px 0px 0px"}}>
            <a href="/balance" className="balance_area">
              {this.props.account?.silverCount} <img src={Setting.getStatic("/static/img/silver@2x.png")} height="16" alt="S" border="0" /> {this.props.account?.bronzeCount} <img src={Setting.getStatic("/static/img/bronze@2x.png")} height="16" alt="B" border="0" />
            </a>
          </div>
          <a href="/notifications" className="fade">
            0 Unread
          </a>
        </div>
      </div>
    );
  }

}

export default RightAccountBox;
