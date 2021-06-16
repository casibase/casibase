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
import * as FavoritesBackend from "../backend/FavoritesBackend";
import { withRouter, Link } from "react-router-dom";
import Avatar from "../Avatar";
import AllCreatedTopicsBox from "./AllCreatedTopicsBox";
import LatestReplyBox from "./LatestReplyBox";
import i18next from "i18next";
import { scoreConverter } from "./Tools";

class MemberBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      memberId: props.match.params.memberId,
      member: [],
      favoritesStatus: false,
      getFavoriteStatus: false,
    };
  }

  componentDidMount() {
    this.getMember();
    this.getFavoriteStatus();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState({
        memberId: newProps.match.params.memberId,
      });
      this.getMember();
    }
  }

  getMember() {
    MemberBackend.getMember(this.state.memberId).then((res) => {
      this.setState({
        member: res,
      });
    });
  }

  getFavoriteNum() {
    if (
      this.props.account === undefined ||
      this.props.account === null ||
      this.state.getFavoriteStatus
    ) {
      return;
    }

    FavoritesBackend.getAccountFavoriteNum().then((res) => {
      if (res.status === "ok") {
        this.setState({
          topicFavoriteNum: res?.data[1],
          followingNum: res?.data[2],
          nodeFavoriteNum: res?.data[3],
          getFavoriteStatus: true,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  getFavoriteStatus() {
    FavoritesBackend.getFavoritesStatus(this.state.memberId, 2).then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  addFavorite(memberId) {
    FavoritesBackend.addFavorites(memberId, 2).then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
        this.getFavoriteStatus();
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  block(memberId) {}

  deleteFavorite(memberId) {
    FavoritesBackend.deleteFavorites(memberId, 2).then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: !res.data,
        });
        this.getFavoriteStatus();
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  renderMember() {
    if (this.state.member !== null && this.state.member.length === 0) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("loading:Member profile is loading")}
          </div>
          <div className="cell">
            <span className="gray bigger">
              {i18next.t("loading:Please wait patiently...")}
            </span>
          </div>
        </div>
      );
    }

    if (this.state.member === null) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("error:Member does not exist")}
          </div>
          <div className="cell">
            <span className="gray bigger">404 Member Not Found</span>
          </div>
          <div className="inner">
            ← <Link to="/">{i18next.t("error:Back to Home Page")}</Link>
          </div>
        </div>
      );
    }

    const showWatch =
      this.props.account !== undefined &&
      this.props.account !== null &&
      this.state.memberId !== this.props.account?.username;
    const { goldCount, silverCount, bronzeCount } = scoreConverter(
      this.state.member.score
    );
    return (
      <div className="box">
        <div className="cell">
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td
                  width={Setting.PcBrowser ? "73" : "56"}
                  valign="top"
                  align="center"
                >
                  <Avatar
                    username={this.state.member?.id}
                    size={Setting.PcBrowser ? "large" : "middle"}
                    avatar={this.state.member?.avatar}
                  />
                  <div className="sep10" />
                  {this.state.member?.onlineStatus ? (
                    <strong className="online"> {i18next.t("ONLINE")} </strong>
                  ) : (
                    ""
                  )}
                </td>
                <td width="10" />
                <td width="auto" valign="top" align="left">
                  <div
                    className="fr"
                    style={{ display: showWatch ? "" : "none" }}
                  >
                    {this.state.favoritesStatus ? (
                      <input
                        type="button"
                        value={i18next.t("member:Cancel Following")}
                        onClick={() =>
                          this.deleteFavorite(this.state.member?.id)
                        }
                        className="super inverse button"
                      />
                    ) : (
                      <input
                        type="button"
                        value={i18next.t("member:Watch")}
                        onClick={() => this.addFavorite(this.state.member?.id)}
                        className="super special button"
                      />
                    )}
                    <div className="sep10" />
                    <input
                      type="button"
                      value="Block"
                      onClick={this.block(this.state.memberId)}
                      className="super normal button"
                    />
                  </div>
                  <h1 style={{ marginBottom: "5px" }}>
                    {this.state.member?.id}
                  </h1>
                  <span className="bigger">{this.state.member?.tagline}</span>
                  <div className="sep10" />
                  {this.state.member?.company.length !== 0 ||
                  this.state.member?.companyTitle.length !== 0 ? (
                    <span>
                      🏢&nbsp; <strong>{this.state.member?.company}</strong> /{" "}
                      {this.state.member?.companyTitle}
                    </span>
                  ) : null}
                  <div className={Setting.PcBrowser ? "sep10" : "sep5"} />
                  <span className="gray">
                    {Setting.getForumName()} {i18next.t("member:No.")}{" "}
                    {this.state.member?.no}{" "}
                    {i18next.t("member:member, joined on")}{" "}
                    {Setting.getFormattedDate(this.state.member?.createdTime)}
                    {Setting.PcBrowser ? (
                      <span>
                        <div className="sep5" />
                        {i18next.t("member:Today's ranking")}{" "}
                        <Link to="/top/dau">{this.state.member?.ranking}</Link>
                      </span>
                    ) : null}
                    <div className="sep5" />
                    {this.state.member?.isModerator ? (
                      <img
                        src={Setting.getStatic("/static/img/mod@2x.png")}
                        height="14px"
                        align="absmiddle"
                      />
                    ) : null}{" "}
                    {this.state.member?.isModerator
                      ? i18next.t("member:authorized to manage the community")
                      : null}
                  </span>
                  <div className="sep10" />
                  <div className="balance_area">
                    {goldCount}{" "}
                    <img
                      src={Setting.getStatic("/static/img/gold@2x.png")}
                      height="16"
                      alt="G"
                      border="0"
                    />{" "}
                    {silverCount}{" "}
                    <img
                      src={Setting.getStatic("/static/img/silver@2x.png")}
                      height="16"
                      alt="S"
                      border="0"
                    />{" "}
                    {bronzeCount}{" "}
                    <img
                      src={Setting.getStatic("/static/img/bronze@2x.png")}
                      height="16"
                      alt="B"
                      border="0"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="sep5" />
        </div>
        <div className="widgets">
          {this.state.member?.website.length !== 0 ? (
            <a
              href={this.state.member?.website}
              className="social_label"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <img
                src={Setting.getStatic("/static/img/social_home.png")}
                width="24"
                alt="Website"
                align="absmiddle"
              />{" "}
              &nbsp;{this.state.member?.website}
            </a>
          ) : null}
          {this.state.member?.location.length !== 0 ? (
            <a
              href={`http://www.google.com/maps?q=${this.state.member?.location}`}
              className="social_label"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <img
                src={Setting.getStatic("/static/img/social_geo.png")}
                width="24"
                alt="Geo"
                align="absmiddle"
              />{" "}
              &nbsp;{this.state.member?.location}
            </a>
          ) : null}
          {this.state.member?.githubAccount.length !== 0 ? (
            <a
              href={`https://github.com/${this.state.member?.githubAccount}`}
              className="social_label"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <img
                src={Setting.getStatic("/static/img/social_github.png")}
                width="24"
                alt="GitHub"
                align="absmiddle"
              />{" "}
              &nbsp;{this.state.member?.githubAccount}
            </a>
          ) : null}
          {this.state.member?.googleAccount.length !== 0 ? (
            <a
              href={`mailto:${this.state.member?.googleAccount}`}
              className="social_label"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <img
                src={Setting.getStatic("/static/img/social_google.png")}
                width="24"
                alt="Google"
                align="absmiddle"
              />{" "}
              &nbsp;{this.state.member?.googleAccount}
            </a>
          ) : null}
        </div>
        {this.state.member?.bio === "" ? (
          <div className="cell">{this.state.member?.bio}</div>
        ) : null}
      </div>
    );
  }

  renderMemberFavorites() {
    this.getFavoriteNum();

    return (
      <div className="box">
        <div className="sep5"></div>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width="33%" valign="center" align="center">
                <Link
                  to="/my/nodes"
                  className="dark"
                  style={{ display: "block" }}
                >
                  <span className="bigger">{this.state.nodeFavoriteNum}</span>
                  <div className="sep3"></div>
                  <span className="fade small">{i18next.t("bar:Nodes")}</span>
                </Link>
              </td>
              <td
                width="33%"
                valign="center"
                align="center"
                style={{ borderLeft: "1px solid rgba(100, 100, 100, 0.25)" }}
              >
                <Link
                  to="/my/topics"
                  className="dark"
                  style={{ display: "block" }}
                >
                  <span className="bigger">{this.state.topicFavoriteNum}</span>
                  <div className="sep3"></div>
                  <span className="fade small">{i18next.t("bar:Topics")}</span>
                </Link>
              </td>
              <td
                width="33%"
                valign="center"
                align="center"
                style={{ borderLeft: "1px solid rgba(100, 100, 100, 0.25)" }}
              >
                <Link
                  to="/my/following"
                  className="dark"
                  style={{ display: "block" }}
                >
                  <span className="bigger">{this.state.followingNum}</span>
                  <div className="sep3"></div>
                  <span className="fade small">{i18next.t("bar:Watch")}</span>
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="sep5"></div>
      </div>
    );
  }

  render() {
    return (
      <span>
        {Setting.PcBrowser ? (
          <div className="sep20" />
        ) : (
          <div className="sep5" />
        )}
        {this.renderMember()}
        {!Setting.PcBrowser &&
        this.props.account?.username === this.state.memberId ? (
          <div className="sep5" />
        ) : null}
        {!Setting.PcBrowser &&
        this.props.account?.username === this.state.memberId
          ? this.renderMemberFavorites()
          : null}
        {Setting.PcBrowser ? (
          <div className="sep20" />
        ) : (
          <div className="sep5" />
        )}
        <AllCreatedTopicsBox member={this.state.member} />
        {Setting.PcBrowser ? (
          <div className="sep20" />
        ) : (
          <div className="sep5" />
        )}
        <LatestReplyBox member={this.state.member} />
      </span>
    );
  }
}

export default withRouter(MemberBox);
