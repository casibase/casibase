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

import React, { Component } from "react";
import "./App.css";
import { BackTop } from "antd";
import * as Setting from "./Setting";
import { Switch, Route } from "react-router-dom";
import TopicPage from "./TopicPage";
import Header from "./Header";
import Footer from "./Footer";
import RightSigninBox from "./rightbar/RightSigninBox";
import RightAccountBox from "./rightbar/RightAccountBox";
import TopicBox from "./main/TopicBox";
import MemberBox from "./main/MemberBox";
import SearchTag from "./main/SearchTag";
import SettingsBox from "./main/SettingsBox";
import * as AccountBackend from "./backend/AccountBackend";
import SignoutBox from "./main/SignoutBox";
import AllCreatedTopicsBox from "./main/AllCreatedTopicsBox";
import CallbackBox from "./main/AuthBox";
import NewBox from "./main/NewBox";
import NodesBox from "./main/NodeBox";
import AboutForum from "./main/AboutForum";
import FavoritesBox from "./main/FavoritesBox";
import RecentTopicsBox from "./main/RecentTopicsBox";
import SelectLanguageBox from "./main/SelectLanguageBox";
import SelectEditorTypeBox from "./main/SelectEditorTypeBox";
import RightCommunityHealthBox from "./rightbar/RightCommunityHealthBox";
import RightFavouriteBox from "./rightbar/RightFavouriteBox";
import RightNodeBox from "./rightbar/RightNodeBox";
import CustomGithubCorner from "./main/CustomGithubCorner";
import NotificationBox from "./main/NotificationBox";
import NodeNavigationBox from "./main/NodeNavigationBox";
import PlaneBox from "./main/PlaneBox";
import BalanceBox from "./main/BalanceBox";
import RightCheckinBonusBox from "./rightbar/RightCheckinBonusBox";
import CheckinBonusBox from "./main/CheckinBonusBox";
import RightLatestNodeBox from "./rightbar/RightLatestNodeBox";
import RightHotNodeBox from "./rightbar/RightHotNodeBox";
import RightHotTopicBox from "./rightbar/RightHotTopicBox";
import MoveTopicNodeBox from "./main/MoveTopicNodeBox";
import EditBox from "./main/EditBox";
import FilesBox from "./main/FilesBox";
import RankingRichBox from "./main/RankingRichBox";
import NewMember from "./main/NewMember";
import AdminHomepage from "./admin/AdminHomepage";
import AdminNode from "./admin/AdminNode";
import AdminTab from "./admin/AdminTab";
import AdminMember from "./admin/AdminMember";
import AdminPlane from "./admin/AdminPlane";
import AdminPoster from "./admin/AdminPoster";
import AdminTopic from "./admin/AdminTopic";
import AdminSensitive from "./admin/AdminSensitive";
import AdminTranslation from "./admin/AdminTranslation";
import i18next from "i18next";
import "./node.css";
import "./i18n";
import * as FavoritesBackend from "./backend/FavoritesBackend";

import * as Auth from "./auth/Auth";
import * as Conf from "./Conf";
import AuthCallback from "./auth/AuthCallback";
import SearchResultPage from "./SearchResultPage";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      account: undefined,
      nodeId: null,
      showMenu: false,
      nodeBackgroundImage: "",
      nodeBackgroundColor: "",
      nodeBackgroundRepeat: "",
    };

    Setting.initServerUrl();
    Auth.initAuthWithConfig(Conf.AuthConfig);
    Setting.initFullClientUrl();
    Setting.initBrowserType();
    this.getNodeBackground = this.getNodeBackground.bind(this);
    this.changeMenuStatus = this.changeMenuStatus.bind(this);
  }

  componentDidMount() {
    //Setting.SetLanguage();
    this.getAccount();
    this.getFavoriteNum();
  }

  onSignin() {
    this.getAccount();
  }

  onSignout() {
    this.getAccount();
  }

  onUpdateAccount(account) {
    this.setState({
      account: account,
    });
  }

  getNodeBackground(id, backgroundImage, backgroundColor, backgroundRepeat) {
    this.setState({
      nodeId: id,
      nodeBackgroundImage: backgroundImage,
      nodeBackgroundColor: backgroundColor,
      nodeBackgroundRepeat: backgroundRepeat,
    });
  }

  getAccount() {
    AccountBackend.getAccount().then((res) => {
      let account = res.data;
      if (account !== null) {
        let language = account?.language;
        if (language !== "" && language !== i18next.language) {
          Setting.SetLanguage(language);
        }
        // i18n.changeCustomLanguage(language)
      }
      this.setState({
        account: account,
      });
    });
  }

  getFavoriteNum() {
    if (this.state.account === null) {
      return;
    }

    FavoritesBackend.getAccountFavoriteNum().then((res) => {
      if (res.status === "ok") {
        this.setState({
          favorites: res?.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  renderMain() {
    const pcBrowser = Setting.PcBrowser;
    return (
      <Switch>
        <Route exact path="/callback" component={AuthCallback} />
        <Route exact path="/">
          {pcBrowser ? null : (
            <RightCheckinBonusBox account={this.state.account} />
          )}
          {pcBrowser ? null : <div className="sep5" />}
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicPage account={this.state.account} />
            {pcBrowser ? <div className="sep20" /> : <div className="sep5" />}
            <NodeNavigationBox />
          </div>
        </Route>
        <Route exact path="/signout">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SignoutBox
              account={this.state.account}
              onSignout={this.onSignout.bind(this)}
            />
          </div>
        </Route>
        <Route exact path="/t/:topicId/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox
              account={this.state.account}
              getNodeBackground={this.getNodeBackground}
              refreshFavorites={this.getFavoriteNum.bind(this)}
            />
          </div>
        </Route>
        <Route exact path="/t/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox
              account={this.state.account}
              getNodeBackground={this.getNodeBackground}
              refreshFavorites={this.getFavoriteNum.bind(this)}
            />
          </div>
        </Route>
        <Route exact path="/member/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            <MemberBox
              account={this.state.account}
              refreshFavorites={this.getFavoriteNum.bind(this)}
            />
          </div>
        </Route>
        <Route exact path="/member/:memberId/:tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AllCreatedTopicsBox />
          </div>
        </Route>
        {/*<Route exact path="/settings">*/}
        {/*  <div id={pcBrowser ? "Main" : ""}>*/}
        {/*    {pcBrowser ? <div className="sep20" /> : null}*/}
        {/*    <SettingsBox*/}
        {/*      account={this.state.account}*/}
        {/*      refreshAccount={this.getAccount.bind(this)}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</Route>*/}
        <Route exact path="/callback/:authType/:addition">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <CallbackBox />
          </div>
        </Route>
        <Route exact path="/settings/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SettingsBox
              account={this.state.account}
              refreshAccount={this.getAccount.bind(this)}
            />
          </div>
        </Route>
        <Route exact path="/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/tag/:tagId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SearchTag />
          </div>
        </Route>
        <Route exact path="/new/:nodeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/go/:nodeId">
          <NodesBox
            account={this.state.account}
            getNodeBackground={this.getNodeBackground}
            refreshAccount={this.getAccount.bind(this)}
            refreshFavorites={this.getFavoriteNum.bind(this)}
          />
        </Route>
        <Route exact path="/go/:nodeId/:event">
          <NodesBox
            account={this.state.account}
            getNodeBackground={this.getNodeBackground}
            refreshAccount={this.getAccount.bind(this)}
            refreshFavorites={this.getFavoriteNum.bind(this)}
          />
        </Route>
        <Route exact path="/my/:favorites">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FavoritesBox />
          </div>
        </Route>
        <Route exact path="/recent">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <RecentTopicsBox />
          </div>
        </Route>
        <Route exact path="/select/language">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SelectLanguageBox />
          </div>
        </Route>
        <Route exact path="/select/editorType">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SelectEditorTypeBox />
          </div>
        </Route>
        <Route exact path="/notifications">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NotificationBox />
          </div>
        </Route>
        <Route exact path="/planes">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <PlaneBox />
          </div>
        </Route>
        <Route exact path="/balance">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <BalanceBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/mission/daily">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <CheckinBonusBox />
          </div>
        </Route>
        <Route exact path="/move/topic/:id">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <MoveTopicNodeBox />
          </div>
        </Route>
        <Route exact path="/edit/:editType/:id">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <EditBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/i">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FilesBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/i/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FilesBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/i/edit/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FilesBox account={this.state.account} edit={true} />
          </div>
        </Route>
        <Route exact path="/top/rich">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <RankingRichBox />
          </div>
        </Route>
        {/*BACKSTAGE*/}
        <Route exact path="/admin">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminHomepage account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/node">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminNode account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/node/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminNode account={this.state.account} event={"new"} />
          </div>
        </Route>
        <Route exact path="/admin/node/edit/:nodeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminNode account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTab account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/tab/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTab account={this.state.account} event={"new"} />
          </div>
        </Route>
        <Route exact path="/admin/tab/edit/:tabId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTab account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/poster">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminPoster />
          </div>
        </Route>
        <Route exact path="/admin/translation">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTranslation />
          </div>
        </Route>
        <Route exact path="/admin/member">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminMember account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/member/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewMember />
          </div>
        </Route>
        <Route exact path="/admin/member/edit/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminMember account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/plane">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminPlane account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/plane/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminPlane account={this.state.account} event={"new"} />
          </div>
        </Route>
        <Route exact path="/admin/plane/edit/:planeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminPlane account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/topic">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTopic account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/topic/edit/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminTopic account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/sensitive">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminSensitive account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/admin/sensitive/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminSensitive account={this.state.account} event={"new"} />
          </div>
        </Route>
        <Route exact path="/about">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AboutForum />
          </div>
        </Route>
        <Route exact path="/search">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SearchResultPage />
          </div>
        </Route>
      </Switch>
    );
  }

  renderRightbar() {
    if (this.state.account === undefined) {
      return null;
    }

    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;

    if (uri === "/select/language") {
      return null;
    }

    const isSignedIn = this.state.account !== null;
    if (!isSignedIn) {
      if (uri === "/signup" || uri.startsWith("/member/")) {
        return null;
      }
    }

    return (
      <div id="Rightbar">
        <div className="sep20" />
        {isSignedIn ? (
          <RightAccountBox
            account={this.state.account}
            nodeId={this.state.nodeId}
            favorites={this.state.favorites}
          />
        ) : (
          <RightSigninBox nodeId={this.state.nodeId} />
        )}
        <Switch>
          <Route exact path="/">
            <span>
              <RightCheckinBonusBox account={this.state.account} />
              <div className="sep20" />
              <RightCommunityHealthBox />
              <div className="sep20" />
              <RightFavouriteBox />
              <div className="sep20" />
              <RightHotTopicBox />
              <div className="sep20" />
              <RightHotNodeBox />
              <div className="sep20" />
              <RightLatestNodeBox />
            </span>
          </Route>
          <Route exact path="/go/:nodeId">
            <span>
              <div className="sep20" />
              <RightNodeBox />
            </span>
          </Route>
        </Switch>
      </div>
    );
  }

  changeMenuStatus(status) {
    if (this.state.showMenu === status) {
      return;
    }
    this.setState({
      showMenu: status,
    });
  }

  getThemeLink() {
    var themeMode = undefined;
    var modeArray = document.cookie.split("; ");
    for (var i = 0; i < modeArray.length; i++) {
      var kvset = modeArray[i].split("=");
      if (kvset[0] == "themeMode") themeMode = kvset[1];
    }
    if (themeMode == undefined) themeMode = "true";
    if (themeMode == "true") return "";
    else return Setting.getStatic("/static/css/night.css");
  }

  render() {
    return (
      <div>
        <link
          type="text/css"
          rel="stylesheet"
          media="all"
          id="dark-mode"
          href={this.getThemeLink()}
        />
        <BackTop />
        <Header
          account={this.state.account}
          onSignout={this.onSignout.bind(this)}
          changeMenuStatus={this.changeMenuStatus.bind(this)}
          showMenu={this.state.showMenu}
        />
        <div
          id="Wrapper"
          style={{
            backgroundColor: `${this.state.nodeBackgroundColor}`,
            backgroundImage: `url(${this.state.nodeBackgroundImage}), url(https://cdn.jsdelivr.net/gh/casbin/static/img/shadow_light.png)`,
            backgroundRepeat: `${this.state.nodeBackgroundRepeat}, repeat-x`,
          }}
          className={this.state.nodeId}
          onClick={() => this.changeMenuStatus(false)}
        >
          <div className="content">
            <div id="Leftbar" />
            {Setting.PcBrowser ? <CustomGithubCorner /> : null}
            {Setting.PcBrowser ? this.renderRightbar() : null}
            {this.renderMain()}
            <div className="c" />
            {Setting.PcBrowser ? <div className="sep20" /> : null}
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
