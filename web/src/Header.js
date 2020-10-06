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
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import i18next from "i18next";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      searchValue: "",
    };
  }

  onSearchValueChange(e) {
    this.setState({
      searchValue: e.target.value
    });
  }

  addSearchValue() {
    this.setState({
      searchValue: `${Conf.Domain}/t ` + this.state.searchValue
    });
  }

  onKeyup(e) {
    if(e.keyCode === 13) {
      const searchSide = Conf.DefaultSearchSite;

      switch (searchSide) {
        case "baidu":
          window.open(`https://www.baidu.com/s?q6=${Conf.Domain}/t&q3=${this.state.searchValue}`);
          return;
        case "bing":
          window.open(`https://cn.bing.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`);
          return;
        case "google":
          window.open(`https://www.google.com/search?q=site:${Conf.Domain}/t ${this.state.searchValue}`);
          return;
      }
    }
  }

  signout() {
    if (!window.confirm(i18next.t("signout:Are you sure to log out?"))) {
      return;
    }

    AccountBackend.signout()
      .then((res) => {
        if (res.status === 'ok') {
          this.props.onSignout();
          Setting.goToLink("/signout");
        } else {
          Setting.goToLink("/signout");
        }
      });
  }

  renderItem() {
    const isSignedIn = this.props.account !== undefined && this.props.account !== null;
    const username = this.props.account?.id;

    if (!isSignedIn) {
      return (
        <td width="570" align="right" style={{paddingTop: "2px"}}>
          <a href="/" className="top">
            {i18next.t("general:Home")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/signup" className="top">
            {i18next.t("general:Sign Up")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/signin" className="top">
            {i18next.t("general:Sign In")}
          </a>
        </td>
      )
    } else {
      return (
        <td width="570" align="right" style={{paddingTop: "2px"}}>
          <a href="/" className="top">
            {i18next.t("general:Home")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href={`/member/${username}`} className="top">
            {username}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/notes" className="top">
            {i18next.t("general:Note")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/t" className="top">
            {i18next.t("general:Timeline")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/settings" className="top">
            {i18next.t("general:Setting")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="/admin" className="top">
            {i18next.t("general:Admin")}
          </a>
          &nbsp;&nbsp;&nbsp;
          <a href="#;" onClick={this.signout.bind(this)} className="top">
            {i18next.t("general:Sign Out")}
          </a>
        </td>
      );
    }
  }

  renderMobileHeader() {
    const isSignedIn = this.props.account !== undefined && this.props.account !== null;
    const menuStyle = this.props.showMenu ? {
      "--show-dropdown": "block"
    } : null

    if (!isSignedIn) {
      return (
        <div id="Top">
          <div className="content">
            <div style={{paddingTop: "6px"}}>
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tr>
                  <td width="5" align="left"></td>
                  <td width="80" align="left" style={{paddingTop: "4px"}}><a href="/" name="top">
                    <div id="LogoMobile"></div>
                  </a></td>
                  <td width="auto" align="right" style={{paddingTop: "2px"}}>
                    <a href="/" className="top">{i18next.t("general:Home")}</a>
                    &nbsp;&nbsp;&nbsp;
                    <a href="/signup" className="top">{i18next.t("general:Sign Up")}</a>
                    &nbsp;&nbsp;&nbsp;
                    <a href="/signin" className="top">{i18next.t("general:Sign In")}</a>
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
            <div id="LogoMobile" onClick={() => Setting.goToLink("/")} />
          </div>
          <div className="site-header-menu">
            {this.renderSearch()}
            <button id="menu-entry" onClick={() => this.changeShowMenuStatus()}>
              {
                this.props.account?.avatar === "" ?
                  <img src={Setting.getUserAvatar(this.props.account?.id)} width={24} border={0} style={{borderRadius: "32px", verticalAlign: "middle"}} width="32" height="32" align="absmiddle" alt={this.props.account?.id}/> :
                  <img src={this.props.account?.avatar} width={24} border={0} style={{borderRadius: "32px", verticalAlign: "middle"}} width="32" height="32" align="absmiddle" alt={this.props.account?.id}/>
              }
            </button>
            <div id="user-menu" style={menuStyle}>
              <div><a href={`/member/${this.props.account?.id}`} className="top">{i18next.t("general:Homepage")}</a></div>
              <div><a href="/my/nodes" className="top">{i18next.t("bar:Nodes")}</a></div>
              <div><a href="/my/topics" className="top">{i18next.t("bar:Topics")}</a></div>
              <div><a href="/settings" className="top">{i18next.t("general:Setting")}</a></div>
              <div className="menu_sep"></div>
              <div>
                <a href="/i" className="top">
                  <img src={Setting.getStatic("/static/img/neue_image.png")} height="14" border="0" align="absmiddle"/>
                  {" "}&nbsp;{i18next.t("bar:File library")}
                </a>
              </div>
              <div>
                <a href="/notes" className="top">
                  <img src={Setting.getStatic("/static/img/neue_notepad.png")} height="14" border="0" align="absmiddle"/>
                  {" "}&nbsp;{i18next.t("general:Note")}
                </a>
              </div>
              <div>
                <a href="/t" className="top">
                  <img src={Setting.getStatic("/static/img/neue_comment.png")} height="14" border="0" align="absmiddle"/>
                  {" "}&nbsp;{i18next.t("general:Timeline")}
                </a>
              </div>
              <div className="menu_sep"></div>
              <div>
                <a href="/select/language" className="top">
                  {i18next.t("general:Language")}
                </a>
              </div>
              <div className="menu_sep"></div>
              <div>
                <a href="/settings/night/toggle" className="top">
                  <img src={Setting.getStatic("/static/img/toggle-light.png")} align="absmiddle" height="10" alt="Light" style={{verticalAlign: "middle"}}/>
              </a>
              </div>
              <div className="menu_sep"></div>
              <div style={{padding: "10px"}}>
                <div className="member-activity-bar">
                  <div className="member-activity-start" style={{width: "5%"}}></div>
                </div>
              </div>
              <div className="menu_sep"></div>
              <div>
                <a href="/signout" className="top">
                  {i18next.t("general:Sign Out")}
                </a>
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
            <input type="text" maxLength="40" name="q" id="q" value={this.state.searchValue} onKeyUp={event => this.onKeyup(event)} onSubmit={() => this.window.open("https://www.google.com/search?1")} onChange={event => this.onSearchValueChange(event)} />
          </div>
        </div>
      );
    }

    if (this.props.account === undefined || this.props.account === null) {
      return null;
    }

    // mobile
    return (
      <input type="text" id="site-search" value={this.state.searchValue} onKeyUp={event => this.onKeyup(event)} onChange={event => this.onSearchValueChange(event)} />
    );
  }

  changeShowMenuStatus() {
    this.props.changeMenuStatus(!this.props.showMenu);
  }

  render() {
    if (!Setting.PcBrowser) {
      return this.renderMobileHeader();
    }

    return (
      <div id="Top">
        <div className="content">
          <div style={{paddingTop: "6px"}}>
            <table cellPadding="0" cellSpacing="0" border="0" width="100%">
              <tbody>
              <tr>
                <td width="110" align="left">
                  <a href="/" name="top" title="way to explore">
                    <div id="Logo" />
                  </a>
                </td>
                <td width="auto" align="left">
                  {this.renderSearch()}
                </td>
                {
                  this.renderItem()
                }
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
