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
import * as AccountBackend from "./backend/AccountBackend";
import * as NodeBackend from "./backend/NodeBackend";
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import {Link, withRouter} from "react-router-dom";
import i18next from "i18next";
import {ServerUrl} from "./Setting";

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
      searchResShow: true,
    });
  }

  addSearchValue() {
    this.setState({
      searchValue: `${Conf.Domain}/t ` + this.state.searchValue,
    });
  }

  onKeyup(e) {
    if (e.keyCode === 13) {
      this.props.history.push(`/search?keyword=${this.state.searchValue}`);
      this.setState({
        searchResShow: false,
      });
    }
  }

  signout() {
    if (!window.confirm(i18next.t("signout:Are you sure to log out?"))) {
      return;
    }

    AccountBackend.signout().then((res) => {
      if (res.status === "ok") {
        this.props.onSignout();
        // this.props.history.push("/");
        window.location.href = "/";
      } else {
        // this.props.history.push("/");
        window.location.href = "/";
      }
    });
  }

  renderItem() {
    const isSignedIn = this.props.account !== undefined && this.props.account !== null;
    const username = this.props.account?.name;

    if (!isSignedIn) {
      return (
        <div className="tools">
          <Link to="/" className="top">
            {i18next.t("general:Home")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <a href={`${ServerUrl}/swagger`} className="top">
            {i18next.t("general:Swagger")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href={Setting.getSignupUrl()} className="top">
            {i18next.t("general:Sign Up")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href={Setting.getSigninUrl()} className="top">
            {i18next.t("general:Sign In")}
          </a>
        </div>
      );
    } else {
      return (
        <div className="tools">
          <Link to="/" className="top">
            {i18next.t("general:Home")}
          </Link>
          &nbsp;&nbsp;&nbsp;
          <a href={`${ServerUrl}/swagger`} className="top">
            {i18next.t("general:Swagger")}
          </a>
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
          <a className="top" href={Setting.getMyProfileUrl(this.props.account)} rel="noreferrer">
            {i18next.t("general:Setting")}
          </a>
          {/* <Link to="/settings" className="top">*/}
          {/*  {i18next.t("general:Setting")}*/}
          {/* </Link>*/}
          &nbsp;&nbsp;&nbsp;
          {this.props.account?.isAdmin ? (
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
        </div>
      );
    }
  }

  renderMobileHeader() {
    const isSignedIn = this.props.account !== undefined && this.props.account !== null;
    const menuStyle = this.props.showMenu
      ? {
        "--show-dropdown": "block",
      }
      : null;

    if (!isSignedIn) {
      return (
        <div id="Top">
          <div className="content">
            <div style={{paddingTop: "6px"}}>
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="5" align="left"></td>
                    <td width="80" align="left" style={{paddingTop: "4px"}}>
                      <Link to="/" name="top">
                        <div id="logoMobile"></div>
                      </Link>
                    </td>
                    <td width="auto" align="right" style={{paddingTop: "2px"}}>
                      <Link to="/" className="top">
                        {i18next.t("general:Home")}
                      </Link>
                      &nbsp;&nbsp;&nbsp;
                      <a href={Setting.getSignupUrl()} className="top">
                        {i18next.t("general:Sign Up")}
                      </a>
                      &nbsp;&nbsp;&nbsp;
                      <a href={Setting.getSigninUrl()} className="top">
                        {i18next.t("general:Sign In")}
                      </a>
                    </td>
                    <td width="10" align="left"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <header className="site-header">
          <div className="site-header-logo">
            <div
              id="logoMobile"
              style={{
                backgroundImage: `url(${Conf.FrontConfig.logoImage})`,
              }}
              onClick={() => this.props.history.push("/")}
            />
          </div>
          <div className="site-header-menu">
            {this.renderSearch()}
            <button id="menu-entry" onClick={() => this.changeShowMenuStatus()}>
              <img
                src={this.props.account?.avatar !== "" ? this.props.account?.avatar : Setting.getUserAvatar(this.props.account?.name)}
                width={24}
                border={0}
                style={{borderRadius: "32px", verticalAlign: "middle"}}
                height="32"
                align="absmiddle"
                alt={this.props.account?.name}
                onError={(event) => {
                  event.target.onerror = "";
                  event.target.src = Conf.AvatarErrorUrl;
                  return true;
                }}
              />
            </button>
            <div id="user-menu" style={menuStyle}>
              <div>
                <Link to={`/member/${this.props.account?.name}`} className="top">
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
                <a className="top" href={Setting.getMyProfileUrl(this.props.account)} rel="noreferrer">
                  {i18next.t("general:Setting")}
                </a>
                {/* <Link to="/settings" className="top">*/}
                {/*  {i18next.t("general:Setting")}*/}
                {/* </Link>*/}
              </div>
              <div>
                <Link to="/admin" className="top">
                  {i18next.t("general:Admin")}
                </Link>
              </div>
              <div className="menu_sep"></div>
              <div>
                <a target="_blank" className="top" href={Setting.getMyResourcesUrl(this.props.account)} rel="noreferrer">
                  <img src={Setting.getStatic("/img/neue_image.png")} height="14" border="0" align="absmiddle" /> &nbsp;{i18next.t("bar:File library")}
                </a>
              </div>
              <div>
                <Link to="/notes" className="top">
                  <img src={Setting.getStatic("/img/neue_notepad.png")} height="14" border="0" align="absmiddle" /> &nbsp;{i18next.t("general:Note")}
                </Link>
              </div>
              <div>
                <Link to="/t" className="top">
                  <img src={Setting.getStatic("/img/neue_comment.png")} height="14" border="0" align="absmiddle" /> &nbsp;{i18next.t("general:Timeline")}
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
                <div className="top" onClick={Setting.toggleThemeMode}>
                  <img src={Setting.getThemeBtnUrl()} align="absmiddle" height="10" alt="Light" style={{verticalAlign: "middle"}} />
                </div>
              </div>
              <div className="menu_sep"></div>
              <div style={{padding: "10px"}}>
                <div className="member-activity-bar">
                  <div className="member-activity-start" style={{width: "5%"}}></div>
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

  renderSearchEngine() {
    let searchUrl;
    switch (Conf.DefaultSearchSite) {
      case "google":
      case "Google":
        searchUrl = `https://www.google.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`;
        break;
      case "bing":
      case "Bing":
        searchUrl = `https://cn.bing.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`;
        break;
      case "baidu":
      case "Baidu":
        searchUrl = `https://www.baidu.com/s?q6=${Conf.Domain}&q3=${this.state.searchValue}`;
        break;
      default:
        searchUrl = "/search?keyword=" + this.state.searchValue;
    }

    return (
      <div className="cell">
        <a className="search-item" href={searchUrl} target="blank">
          {`${i18next.t("search:Click here to search in ")}${Conf.DefaultSearchSite}`}
        </a>
      </div>
    );
  }

  renderSearch() {
    if (Setting.PcBrowser) {
      return (
        <div id="Search">
          <div id="search-container" className="">
            <input
              type="text"
              maxLength="40"
              name="q"
              id="search"
              autoComplete={"off"}
              value={this.state.searchValue}
              onKeyUp={(event) => this.onKeyup(event)}
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
              <div id="search-result" className="box" style={{display: "block"}}>
                <div className="cell">{i18next.t("search:Press Enter to search in site.")}</div>
                {this.state.matchNodes.length !== 0 ? (
                  <div className="cell">
                    <span className="fade">节点&nbsp;&nbsp;/&nbsp;&nbsp;Nodes</span>
                    {this.state.matchNodes.map((val) => {
                      // TODO: maybe weshould add `active` iterm
                      return (
                        <a className="search-item" href={`/go/${val.id}`} key={val.id}>
                          {val.name}&nbsp;&nbsp;/&nbsp;&nbsp;{val.id}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
                {this.renderSearchEngine()}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
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
          <div className="site-nav">
            <Link to="/" name="top" style={{fontSize: 0}} title={Conf.FrontConfig.signinBoxSpan}>
              <div
                id="logo"
                style={{
                  backgroundImage: `url(${Conf.FrontConfig.logoImage})`,
                }}
              />
            </Link>
            {this.renderSearch()}
            {this.renderItem()}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Header);
