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
import * as MemberBackend from "../backend/MemberBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import i18next from "i18next";

class MemberBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      memberId: props.match.params.memberId,
      member: [],
      favoritesStatus: false,
    };
  }

  componentDidMount() {
    this.getMember();
    this.getFavoriteStatus();
  }

  getMember() {
    MemberBackend.getMember(this.state.memberId)
      .then((res) => {
        this.setState({
          member: res,
        });
      });
  }

  getFavoriteStatus() {
    FavoritesBackend.getFavoritesStatus(this.state.memberId, 2)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: res.data,
          });
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  addFavorite(memberId) {
    FavoritesBackend.addFavorites(memberId, 2)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: res.data,
          });
          Setting.refresh()
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  deleteFavorite(memberId) {
    FavoritesBackend.deleteFavorites(memberId, 2)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: !res.data,
          });
          Setting.refresh()
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  render() {
    if (this.state.member !== null && this.state.member.length === 0) {
      return (
        <div className="box">
          <div className="header"><a href="/">{Setting.getForumName()}</a> <span
            className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("loading:Member profile is loading")}</div>
          <div className="cell"><span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
          </div>
        </div>
      )
    }

    if (this.state.member === null) {
      return (
        <div className="box">
          <div className="header"><a href="/">{Setting.getForumName()}</a> <span
            className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("error:Member does not exist")}</div>
          <div className="cell"><span className="gray bigger">404 Member Not Found</span></div>
          <div className="inner">← <a href="/">{i18next.t("error:Back to Home Page")}</a></div>
        </div>
      )
    }

    const showWatch = this.props.account !== undefined && this.props.account !== null && this.state.memberId !== this.props.account?.id

    return (
      <div className="box">
        <div className="cell">
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
            <tr>
              <td width="73" valign="top" align="center">
                <Avatar username={this.state.member?.id} size="large" avatar={this.state.member?.avatar} />
                <div className="sep10" />
                <strong className="online">ONLINE</strong>
              </td>
              <td width="10" />
              <td width="auto" valign="top" align="left">
                <div className="fr" style={{display: showWatch ? "" : "none"}}>
                  {
                    this.state.favoritesStatus ?
                      <input type="button" value={i18next.t("member:Cancel Following")} onClick={() => this.deleteFavorite(this.state.member?.id)} className="super inverse button" /> :
                      <input type="button" value={i18next.t("member:Watch")} onClick={() => this.addFavorite(this.state.member?.id)} className="super special button" />
                  }
                  <div className="sep10" />
                  <input type="button" value="Block" onClick="if (confirm('Are you sure to block xxx?')) { location.href = '/block/1024?t=1493648974'; }" className="super normal button" />
                </div>
                <h1 style={{marginBottom: "5px"}}>
                  {this.state.member?.id}
                </h1>
                <span className="bigger">
                  {this.state.member?.tagline}
                </span>
                <div className="sep10" />
                {
                  this.state.member?.company.length !== 0 || this.state.member?.companyTitle.length !== 0 ?
                    <span>
                      🏢&nbsp;{" "}
                    <strong>
                      {this.state.member?.company}
                    </strong>
                      {" "}/{" "}
                      {this.state.member?.companyTitle}
                    </span> : null
                }
                <div className="sep10" />
                <span className="gray">
                  {Setting.getForumName()} {i18next.t("member:No.")} {this.state.member?.no} {i18next.t("member:member, joined on")} {Setting.getFormattedDate(this.state.member?.createdTime)}
                  <div className="sep5" />
                  {i18next.t("member:Today's ranking")} <a href="/top/dau">{this.state.member?.ranking}</a>
                  <div className="sep5" />
                  {this.state.member?.isModerator ? <img src={Setting.getStatic("/static/img/mod@2x.png")} height="14px" align="absmiddle" /> : null }
                  {" "}
                  {this.state.member?.isModerator ? i18next.t("member:authorized to manage the community") : null }
                </span>
                <div className="sep10" />
                <div className="balance_area">
                  {this.state.member?.goldCount} <img src={Setting.getStatic("/static/img/gold@2x.png")} height="16" alt="G" border="0" /> {this.state.member?.silverCount} <img src={Setting.getStatic("/static/img/silver@2x.png")} height="16" alt="S" border="0" /> {this.state.member?.bronzeCount} <img src={Setting.getStatic("/static/img/bronze@2x.png")} height="16" alt="B" border="0" />
                </div>
              </td>
            </tr>
            </tbody>
          </table>
          <div className="sep5" />
        </div>
        <div className="widgets">
          {
            this.state.member?.website.length !== 0 ?
              <a href={this.state.member?.website} className="social_label" target="_blank" rel="nofollow noopener noreferrer">
                <img src={Setting.getStatic("/static/img/social_home.png")} width="24" alt="Website" align="absmiddle" /> &nbsp;{this.state.member?.website}
              </a> : null
          }
          {
            this.state.member?.location.length !== 0 ?
              <a href={`http://www.google.com/maps?q=${this.state.member?.location}`} className="social_label" target="_blank" rel="nofollow noopener noreferrer">
                <img src={Setting.getStatic("/static/img/social_geo.png")} width="24" alt="Geo" align="absmiddle" /> &nbsp;{this.state.member?.location}
              </a> : null
          }
          {
            this.state.member?.githubAccount.length !== 0 ?
              <a href={`https://github.com/${this.state.member?.githubAccount}`} className="social_label" target="_blank" rel="nofollow noopener noreferrer">
                <img src={Setting.getStatic("/static/img/social_github.png")} width="24" alt="GitHub" align="absmiddle"/> &nbsp;{this.state.member?.githubAccount}
              </a> : null
          }
          {
            this.state.member?.googleAccount.length !== 0 ?
              <a href={`mailto:${this.state.member?.googleAccount}`} className="social_label" target="_blank" rel="nofollow noopener noreferrer">
                <img src={Setting.getStatic("/static/img/social_google.png")} width="24" alt="Google" align="absmiddle"/> &nbsp;{this.state.member?.googleAccount}
              </a> : null
          }
        </div>
        <div className="cell">
          {this.state.member?.bio}
        </div>
      </div>
    );
  }
}

export default withRouter(MemberBox);
