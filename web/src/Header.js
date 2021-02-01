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
import * as AccountBackend from "./backend/AccountBackend";
import * as NodeBackend from "./backend/NodeBackend";
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import { withRouter, Link } from "react-router-dom";
import i18next from "i18next";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      searchValue: "",
      searchResShow: false,
      nodes: [],
      matchNodes: [],
    };
  }

  componentDidMount() {
    this.getNodes();
  }

  getMatchNodes(nodes, curSearchVal, matchNodes) {
    if (!curSearchVal || !nodes) {
      return;
    }
    for (let i = 0; i < nodes.length; i++) {
      const name = nodes[i].name;
      const id = nodes[i].id;
      if (name.indexOf(curSearchVal) > -1 || id.indexOf(curSearchVal) > -1) {
        matchNodes.push(nodes[i]);
      }
    }
  }

  onSearchValueChange(e) {
    const nodes = this.state.nodes;
    const curSearchVal = e.target.value;
    const matchNodes = [];
    this.getMatchNodes(nodes, curSearchVal, matchNodes);
    this.setState({
      searchValue: curSearchVal,
      matchNodes: matchNodes,
    });
  }

  addSearchValue() {
    this.setState({
      searchValue: `${Conf.Domain}/t ` + this.state.searchValue,
    });
  }

  onKeyup(e) {
    if (e.keyCode === 13) {
      const searchSide = Conf.DefaultSearchSite;

      switch (searchSide) {
        case "baidu":
          window.open(
            `https://www.baidu.com/s?q6=${Conf.Domain}&q3=${this.state.searchValue}`
          );
          return;
        case "bing":
          window.open(
            `https://cn.bing.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`
          );
          return;
        case "google":
          window.open(
            `https://www.google.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`
          );
          return;
      }
    }
  }

  signout() {
    if (!window.confirm(i18next.t("signout:Are you sure to log out?"))) {
      return;
    }

    AccountBackend.signout().then((res) => {
      if (res.status === "ok") {
        this.props.onSignout();
        this.props.history.push("/signout");
      } else {
        this.props.history.push("/signout");
      }
    });
  }

  renderItem() {
    const isSignedIn =
      this.props.account !== undefined && this.props.account !== null;
    const username = this.props.account?.id;

    if (!isSignedIn) {
      return (
        <td width="570" align="right" style={{ paddingTop: "2px" }}>
          <Link to="/" className="top">
            {i18next.t("general:Home")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to="/signup" className="top">
            {i18next.t("general:Sign Up")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to="/signin" className="top">
            {i18next.t("general:Sign In")}
          </Link>
        </td>
      );
    } else {
      return (
        <td width="570" align="right" style={{ paddingTop: "2px" }}>
          <Link to="/" className="top">
            {i18next.t("general:Home")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to={`/member/${username}`} className="top">
            {username}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to="/notes" className="top">
            {i18next.t("general:Note")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to="/t" className="top">
            {i18next.t("general:Timeline")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <Link to="/settings" className="top">
            {i18next.t("general:Setting")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          {this.props.account?.isModerator ? (
            <span>
              <Link to="/admin" className="top">
                {i18next.t("general:Admin")}
              </Link>
              &nbsp;&nbsp;&nbsp;
            </span>
          ) : null}
          <a href="#;" onClick={this.signout.bind(this)} className="top">
            {i18next.t("general:Sign Out")}
          </a>
        </td>
      );
    }
  }

  renderMobileHeader() {
    const isSignedIn =
      this.props.account !== undefined && this.props.account !== null;
    const menuStyle = this.props.showMenu
      ? {
          "--show-dropdown": "block",
        }
      : null;

    if (!isSignedIn) {
      return (
        <div id="Top">
          <div className="content">
            <div style={{ paddingTop: "6px" }}>
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tr>
                  <td width="5" align="left"></td>
                  <td width="80" align="left" style={{ paddingTop: "4px" }}>
                    <Link to="/" name="top">
                      <div id="logoMobile"></div>
                    </Link>
                  </td>
                  <td width="auto" align="right" style={{ paddingTop: "2px" }}>
                    <Link to="/" className="top">
                      {i18next.t("general:Home")}
                    </Link>
                    &nbsp;&nbsp;&nbsp;
                    <Link to="/signup" className="top">
                      {i18next.t("general:Sign Up")}
                    </Link>
                    &nbsp;&nbsp;&nbsp;
                    <Link to="/signin" className="top">
                      {i18next.t("general:Sign In")}
                    </Link>
                  </td>
                  <td width="10" align="left"></td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <header className="site-header">
          <div className="site-header-logo">
            <div id="logoMobile" onClick={() => this.props.history.push("/")} />
          </div>
          <div className="site-header-menu">
            {this.renderSearch()}
            <button id="menu-entry" onClick={() => this.changeShowMenuStatus()}>
              {this.props.account?.avatar === "" ? (
                <img
                  src={Setting.getUserAvatar(this.props.account?.id)}
                  width={24}
                  border={0}
                  style={{ borderRadius: "32px", verticalAlign: "middle" }}
                  width="32"
                  height="32"
                  align="absmiddle"
                  alt={this.props.account?.id}
                />
              ) : (
                <img
                  src={this.props.account?.avatar}
                  width={24}
                  border={0}
                  style={{ borderRadius: "32px", verticalAlign: "middle" }}
                  width="32"
                  height="32"
                  align="absmiddle"
                  alt={this.props.account?.id}
                />
              )}
            </button>
            <div id="user-menu" style={menuStyle}>
              <div>
                <Link to={`/member/${this.props.account?.id}`} className="top">
                  {i18next.t("general:Homepage")}
                </Link>
              </div>
              <div>
                <Link to="/my/nodes" className="top">
                  {i18next.t("bar:Nodes")}
                </Link>
              </div>
              <div>
                <Link to="/my/topics" className="top">
                  {i18next.t("bar:Topics")}
                </Link>
              </div>
              <div>
                <Link to="/settings" className="top">
                  {i18next.t("general:Setting")}
                </Link>
              </div>
              <div>
                <Link to="/admin" className="top">
                  {i18next.t("general:Admin")}
                </Link>
              </div>
              <div className="menu_sep"></div>
              <div>
                <Link to="/i" className="top">
                  <img
                    src={Setting.getStatic("/static/img/neue_image.png")}
                    height="14"
                    border="0"
                    align="absmiddle"
                  />{" "}
                  &nbsp;{i18next.t("bar:File library")}
                </Link>
              </div>
              <div>
                <Link to="/notes" className="top">
                  <img
                    src={Setting.getStatic("/static/img/neue_notepad.png")}
                    height="14"
                    border="0"
                    align="absmiddle"
                  />{" "}
                  &nbsp;{i18next.t("general:Note")}
                </Link>
              </div>
              <div>
                <Link to="/t" className="top">
                  <img
                    src={Setting.getStatic("/static/img/neue_comment.png")}
                    height="14"
                    border="0"
                    align="absmiddle"
                  />{" "}
                  &nbsp;{i18next.t("general:Timeline")}
                </Link>
              </div>
              <div className="menu_sep"></div>
              <div>
                <Link to="/select/language" className="top">
                  {i18next.t("general:Language")}
                </Link>
              </div>
              <div className="menu_sep"></div>
              <div>
                <Link to="/settings/night/toggle" className="top">
                  <img
                    src={Setting.getStatic("/static/img/toggle-light.png")}
                    align="absmiddle"
                    height="10"
                    alt="Light"
                    style={{ verticalAlign: "middle" }}
                  />
                </Link>
              </div>
              <div className="menu_sep"></div>
              <div style={{ padding: "10px" }}>
                <div className="member-activity-bar">
                  <div
                    className="member-activity-start"
                    style={{ width: "5%" }}
                  ></div>
                </div>
              </div>
              <div className="menu_sep"></div>
              <div>
                <Link to="/signout" className="top">
                  {i18next.t("general:Sign Out")}
                </Link>
              </div>
            </div>
          </div>
        </header>
      );
    }
  }

  renderSearch() {
    if (Setting.PcBrowser) {
      return (
        <div id="Search">
          <div id="qbar" className="">
            <input
              type="text"
              maxLength="40"
              name="q"
              id="q"
              autoComplete={"off"}
              value={this.state.searchValue}
              onKeyUp={(event) => this.onKeyup(event)}
              onSubmit={() =>
                this.window.open("https://www.google.com/search?1")
              }
              onChange={(event) => this.onSearchValueChange(event)}
              onFocus={() => {
                this.setState({
                  searchResShow: true,
                });
              }}
              onBlur={() => {
                setTimeout(() => {
                  this.setState({
                    searchResShow: false,
                  });
                }, 200);
              }}
            />
            {this.state.searchResShow && this.state.searchValue ? (
              <div
                id="search-result"
                className="box"
                style={{ display: "block" }}
              >
                {this.state.matchNodes.length !== 0 ? (
                  <div className="cell">
                    <span className="fade">
                      节点&nbsp;&nbsp;/&nbsp;&nbsp;Nodes
                    </span>
                    {this.state.matchNodes.map((val) => {
                      //TODO: maybe weshould add `active` iterm
                      return (
                        <a className="search-item" href={`/go/${val.id}`}>
                          {val.name}&nbsp;&nbsp;/&nbsp;&nbsp;{val.id}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
                <div className="cell">
                  <a
                    className="search-item"
                    href={`https://www.google.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`}
                    target="_blank"
                  >
                    {" "}
                    Google&nbsp;{this.state.searchValue}{" "}
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (this.props.account === undefined || this.props.account === null) {
      return null;
    }

    // mobile
    return (
      <input
        type="text"
        id="site-search"
        value={this.state.searchValue}
        onKeyUp={(event) => this.onKeyup(event)}
        onChange={(event) => this.onSearchValueChange(event)}
      />
    );
  }

  changeShowMenuStatus() {
    this.props.changeMenuStatus(!this.props.showMenu);
  }

  getNodes() {
    if (this.state.account === null) {
      return;
    }

    NodeBackend.getNodes().then((res) => {
      this.setState({
        nodes: res,
      });
    });
  }

  render() {
    if (!Setting.PcBrowser) {
      return this.renderMobileHeader();
    }
    return (
      <div id="Top">
        <div className="content">
          <div style={{ paddingTop: "6px" }}>
            <table cellPadding="0" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width="110" align="left">
                    <Link to="/" name="top" title="way to explore">
                      <div id="logo" />
                    </Link>
                  </td>
                  <td width="auto" align="left">
                    {this.renderSearch()}
                  </td>
                  {this.renderItem()}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Header);
