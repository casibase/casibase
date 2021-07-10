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
import SearchTag from "./main/SearchTag";
import * as AccountBackend from "./backend/AccountBackend";
import RightCommunityHealthBox from "./rightbar/RightCommunityHealthBox";
import RightFavouriteBox from "./rightbar/RightFavouriteBox";
import RightNodeBox from "./rightbar/RightNodeBox";
import CustomGithubCorner from "./main/CustomGithubCorner";
import NodeNavigationBox from "./main/NodeNavigationBox";
import RightCheckinBonusBox from "./rightbar/RightCheckinBonusBox";
import RightLatestNodeBox from "./rightbar/RightLatestNodeBox";
import RightHotNodeBox from "./rightbar/RightHotNodeBox";
import RightHotTopicBox from "./rightbar/RightHotTopicBox";
import i18next from "i18next";
import "./node.css";
import "./i18n";
import * as FavoritesBackend from "./backend/FavoritesBackend";
import * as Auth from "./auth/Auth";
import * as Conf from "./Conf";
import AuthCallback from "./auth/AuthCallback";
import LazyLoad from "./components/LazyLoad";

// lazy load imports
const SignoutBox = React.lazy(() => import("./main/SignoutBox"));
const TopicBox = React.lazy(() => import("./main/TopicBox"));
const MemberBox = React.lazy(() => import("./main/MemberBox"));
const AllCreatedTopicsBox = React.lazy(() =>
  import("./main/AllCreatedTopicsBox")
);
const CallbackBox = React.lazy(() => import("./main/AuthBox"));
const SettingsBox = React.lazy(() => import("./main/SettingsBox"));
const NewBox = React.lazy(() => import("./main/NewBox"));
const NodesBox = React.lazy(() => import("./main/NodeBox"));
const FavoritesBox = React.lazy(() => import("./main/FavoritesBox"));
const RecentTopicsBox = React.lazy(() => import("./main/RecentTopicsBox"));
const SelectLanguageBox = React.lazy(() => import("./main/SelectLanguageBox"));
const SelectEditorTypeBox = React.lazy(() =>
  import("./main/SelectEditorTypeBox")
);
const NotificationBox = React.lazy(() => import("./main/NotificationBox"));
const PlaneBox = React.lazy(() => import("./main/PlaneBox"));
const BalanceBox = React.lazy(() => import("./main/BalanceBox"));
const CheckinBonusBox = React.lazy(() => import("./main/CheckinBonusBox"));
const MoveTopicNodeBox = React.lazy(() => import("./main/MoveTopicNodeBox"));
const EditBox = React.lazy(() => import("./main/EditBox"));
const FilesBox = React.lazy(() => import("./main/FilesBox"));
const RankingRichBox = React.lazy(() => import("./main/RankingRichBox"));
const AdminHomepage = React.lazy(() => import("./admin/AdminHomepage"));
const AdminNode = React.lazy(() => import("./admin/AdminNode"));
const AdminTab = React.lazy(() => import("./admin/AdminTab"));
const AdminPoster = React.lazy(() => import("./admin/AdminPoster"));
const AdminTranslation = React.lazy(() => import("./admin/AdminTranslation"));
const AdminMember = React.lazy(() => import("./admin/AdminMember"));
const NewMember = React.lazy(() => import("./main/NewMember"));
const AdminPlane = React.lazy(() => import("./admin/AdminPlane"));
const AdminTopic = React.lazy(() => import("./admin/AdminTopic"));
const AdminSensitive = React.lazy(() => import("./admin/AdminSensitive"));
const AboutForum = React.lazy(() => import("./main/AboutForum"));
const SearchResultPage = React.lazy(() => import("./SearchResultPage"));

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
            <LazyLoad>
              <SignoutBox
                account={this.state.account}
                onSignout={this.onSignout.bind(this)}
              />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/t/:topicId/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <TopicBox
                account={this.state.account}
                getNodeBackground={this.getNodeBackground}
                refreshFavorites={this.getFavoriteNum.bind(this)}
              />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/t/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <TopicBox
                account={this.state.account}
                getNodeBackground={this.getNodeBackground}
                refreshFavorites={this.getFavoriteNum.bind(this)}
              />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/member/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            <LazyLoad>
              <MemberBox
                account={this.state.account}
                refreshFavorites={this.getFavoriteNum.bind(this)}
              />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/member/:memberId/:tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AllCreatedTopicsBox />
            </LazyLoad>
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
            <LazyLoad>
              <CallbackBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/settings/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <SettingsBox
                account={this.state.account}
                refreshAccount={this.getAccount.bind(this)}
              />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <NewBox account={this.state.account} />
            </LazyLoad>
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
            <LazyLoad>
              <NewBox account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/go/:nodeId">
          <LazyLoad>
            <NodesBox
              account={this.state.account}
              getNodeBackground={this.getNodeBackground}
              refreshAccount={this.getAccount.bind(this)}
              refreshFavorites={this.getFavoriteNum.bind(this)}
            />
          </LazyLoad>
        </Route>
        <Route exact path="/go/:nodeId/:event">
          <LazyLoad>
            <NodesBox
              account={this.state.account}
              getNodeBackground={this.getNodeBackground}
              refreshAccount={this.getAccount.bind(this)}
              refreshFavorites={this.getFavoriteNum.bind(this)}
            />
          </LazyLoad>
        </Route>
        <Route exact path="/my/:favorites">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <FavoritesBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/recent">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <RecentTopicsBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/select/language">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <SelectLanguageBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/select/editorType">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <SelectEditorTypeBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/notifications">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <NotificationBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/planes">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <PlaneBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/balance">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <BalanceBox account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/mission/daily">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <CheckinBonusBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/move/topic/:id">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <MoveTopicNodeBox />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/edit/:editType/:id">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <EditBox account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/i">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <FilesBox account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/i/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <FilesBox account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/i/edit/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <FilesBox account={this.state.account} edit={true} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/top/rich">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <RankingRichBox />
            </LazyLoad>
          </div>
        </Route>
        {/*BACKSTAGE*/}
        <Route exact path="/admin">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminHomepage account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/node">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminNode account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/node/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminNode account={this.state.account} event={"new"} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/node/edit/:nodeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminNode account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTab account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/tab/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTab account={this.state.account} event={"new"} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/tab/edit/:tabId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTab account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/poster">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminPoster />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/translation">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTranslation />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/member">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminMember account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/member/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <NewMember />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/member/edit/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminMember account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/plane">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminPlane account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/plane/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminPlane account={this.state.account} event={"new"} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/plane/edit/:planeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminPlane account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/topic">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTopic account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/topic/edit/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminTopic account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/sensitive">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminSensitive account={this.state.account} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/admin/sensitive/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AdminSensitive account={this.state.account} event={"new"} />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/about">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <AboutForum />
            </LazyLoad>
          </div>
        </Route>
        <Route exact path="/search">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <LazyLoad>
              <SearchResultPage />
            </LazyLoad>
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
