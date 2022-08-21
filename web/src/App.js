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

import React, {Component} from "react";
import classNames from "classnames";
import "./App.less";
import "codemirror/lib/codemirror.css";
import {BackTop, Spin} from "antd";
import * as Setting from "./Setting";
import {Route, Switch} from "react-router-dom";
import TopicPage from "./TopicPage";
import Header from "./Header";
import Footer from "./Footer";
import SigninPage from "./SigninPage";
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
import RightThemeBox from "./rightbar/RightThemeBox";
import RightHotTopicBox from "./rightbar/RightHotTopicBox";
import i18next from "i18next";
import "./node.css";
import * as FavoritesBackend from "./backend/FavoritesBackend";
import * as Conf from "./Conf";
import AuthCallback from "./AuthCallback";
import SilentSignin from "./SilentSignin";
import SignoutBox from "./main/SignoutBox";
import TopicBox from "./main/TopicBox";
import SingleReplyBox from "./main/SingleReplyBox";
import MemberBox from "./main/MemberBox";
import AllCreatedTopicsBox from "./main/AllCreatedTopicsBox";
import NewBox from "./main/NewBox";
import NodesBox from "./main/NodeBox";
import FavoritesBox from "./main/FavoritesBox";
import RecentTopicsBox from "./main/RecentTopicsBox";
import SelectLanguageBox from "./main/SelectLanguageBox";
import SelectEditorTypeBox from "./main/SelectEditorTypeBox";
import NotificationBox from "./main/NotificationBox";
import PlaneBox from "./main/PlaneBox";
import BalanceBox from "./main/BalanceBox";
import CheckinBonusBox from "./main/CheckinBonusBox";
import MoveTopicNodeBox from "./main/MoveTopicNodeBox";
import EditBox from "./main/EditBox";
import FilesBox from "./main/FilesBox";
import RankingRichBox from "./main/RankingRichBox";
import RankingPlayerBox from "./main/RankingPlayerBox";
import AdminHomepage from "./admin/AdminHomepage";
import AdminNode from "./admin/AdminNode";
import AdminTab from "./admin/AdminTab";
import AdminPoster from "./admin/AdminPoster";
import AdminTranslation from "./admin/AdminTranslation";
import AdminPlane from "./admin/AdminPlane";
import AdminTopic from "./admin/AdminTopic";
import AdminSensitive from "./admin/AdminSensitive";
import AdminFrontConf from "./admin/AdminFrontConf";
import AdminFooterEdit from "./admin/AdminFooterEdit";
import AboutForum from "./main/AboutForum";
import SearchResultPage from "./SearchResultPage";
import NoMatch from "./main/NoMatch";
import Embed from "./Embed";
import FooterRenderBox from "./main/FooterRenderBox";

class App extends Component {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(window.location.search);
    this.state = {
      classes: props,
      account: undefined,
      nodeId: null,
      showMenu: false,
      nodeBackgroundImage: "",
      nodeBackgroundColor: "",
      nodeBackgroundRepeat: "",
      silentSignin: params.get("silentSignin") === "1",
    };

    Setting.initServerUrl();
    Setting.initCasdoorSdk(Conf.AuthConfig);
    Setting.initFullClientUrl();
    Setting.initBrowserType();
    Setting.getFrontConf("visualConf");
    this.getNodeBackground = this.getNodeBackground.bind(this);
    this.changeMenuStatus = this.changeMenuStatus.bind(this);
  }

  componentDidMount() {
    // Setting.SetLanguage();
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

  setLanguage(account) {
    const language = account?.language;
    if (language !== "" && language !== i18next.language) {
      Setting.setLanguage(language);
    }
  }

  getAccount() {
    AccountBackend.getAccount().then((res) => {
      const account = res.data;
      if (account !== null) {
        this.setLanguage(account);

        let loginCallbackUrl = localStorage.getItem("loginCallbackUrl");
        localStorage.removeItem("loginCallbackUrl");
        if (loginCallbackUrl !== null) {
          loginCallbackUrl = decodeURIComponent(loginCallbackUrl);
          window.location.href = loginCallbackUrl;
        }
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
        <Route exact path="/">
          {pcBrowser ? null : <RightCheckinBonusBox account={this.state.account} />}
          {pcBrowser ? null : <div className="sep5" />}
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicPage account={this.state.account} title={Setting.getForumName()} />
            {pcBrowser ? <div className="sep20" /> : <div className="sep5" />}
            <NodeNavigationBox />
          </div>
        </Route>
        <Route exact path="/signout">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SignoutBox account={this.state.account} onSignout={this.onSignout.bind(this)} />
          </div>
        </Route>
        <Route exact path="/login">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SigninPage />
          </div>
        </Route>
        <Route exact path="/t/:topicId/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox account={this.state.account} getNodeBackground={this.getNodeBackground} refreshFavorites={this.getFavoriteNum.bind(this)} refreshAccount={this.getAccount.bind(this)} />
          </div>
        </Route>
        <Route exact path="/t/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox account={this.state.account} getNodeBackground={this.getNodeBackground} refreshFavorites={this.getFavoriteNum.bind(this)} refreshAccount={this.getAccount.bind(this)} />
          </div>
        </Route>
        <Route exact path="/r/:replyId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SingleReplyBox />
          </div>
        </Route>
        <Route exact path="/member/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            <MemberBox account={this.state.account} refreshFavorites={this.getFavoriteNum.bind(this)} />
          </div>
        </Route>
        <Route exact path="/member/:memberId/:tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AllCreatedTopicsBox />
          </div>
        </Route>
        <Route exact path="/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewBox account={this.state.account} refreshAccount={this.getAccount.bind(this)} />
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
            <NewBox account={this.state.account} refreshAccount={this.getAccount.bind(this)} />
          </div>
        </Route>
        <Route exact path="/go/:nodeId">
          <NodesBox account={this.state.account} getNodeBackground={this.getNodeBackground} refreshAccount={this.getAccount.bind(this)} refreshFavorites={this.getFavoriteNum.bind(this)} />
        </Route>
        <Route exact path="/go/:nodeId/:event">
          <NodesBox account={this.state.account} getNodeBackground={this.getNodeBackground} refreshAccount={this.getAccount.bind(this)} refreshFavorites={this.getFavoriteNum.bind(this)} />
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
        <Route exact path="/top/player">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <RankingPlayerBox />
          </div>
        </Route>
        {/* BACKSTAGE*/}
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
        <Route exact path="/admin/frontconf">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminFrontConf account={this.state.account} />
          </div>
        </Route>

        <Route exact path="/admin/faq">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminFooterEdit account={this.state.account} id={"faq"} />
          </div>
        </Route>
        <Route exact path="/admin/mission">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminFooterEdit account={this.state.account} id={"mission"} />
          </div>
        </Route>
        <Route exact path="/admin/advertise">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminFooterEdit account={this.state.account} id={"advertise"} />
          </div>
        </Route>
        <Route exact path="/admin/thanks">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminFooterEdit account={this.state.account} id={"thanks"} />
          </div>
        </Route>

        <Route exact path="/faq">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FooterRenderBox id={"faq"} key={"faq"} />
          </div>
        </Route>
        <Route exact path="/mission">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FooterRenderBox id={"mission"} key={"mission"} />
          </div>
        </Route>
        <Route exact path="/advertise">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FooterRenderBox id={"advertise"} key={"advertise"} />
          </div>
        </Route>
        <Route exact path="/thanks">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <FooterRenderBox id={"thanks"} key={"thanks"} />
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
        <Route path="*">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NoMatch />
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
        {isSignedIn ? <RightAccountBox account={this.state.account} nodeId={this.state.nodeId} favorites={this.state.favorites} /> : <RightSigninBox nodeId={this.state.nodeId} />}
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
        <div className="sep20" />
        <RightThemeBox />
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
    let themeMode = localStorage.getItem("themeMode");
    if (themeMode === null) {
      themeMode = "light";
    }

    return themeMode === "light" ? "" : Setting.getStatic("/css/night.css");
  }

  renderContent() {
    return (
      <div className="content">
        <div id="Leftbar" />
        {Setting.PcBrowser ? <CustomGithubCorner /> : null}
        {Setting.PcBrowser ? this.renderRightbar() : null}
        {this.renderMain()}
        <div className="c" />
        {Setting.PcBrowser ? <div className="sep20" /> : null}
      </div>
    );
  }

  render() {
    if (window.location.pathname.startsWith("/embedded-replies")) {
      return <Embed account={this.state.account} refreshAccount={this.getAccount.bind(this)} />;
    }

    if (window.location.pathname.startsWith("/callback")) {
      return <AuthCallback />;
    }

    if (this.state.silentSignin) {
      if (this.state.account) {
        Setting.goToLink("/");
        return null;
      } else {
        return (
          <div style={{textAlign: "center"}}>
            <Spin size="large" tip={i18next.t("login:Signing in automatically...")} style={{paddingTop: "10%", paddingBottom: "10%"}}>
              <SilentSignin account={this.state.account} />
            </Spin>
          </div>
        );
      }
    }

    return (
      <div>
        <link type="text/css" rel="stylesheet" media="all" id="dark-mode" href={this.getThemeLink()} />
        <BackTop />
        <Header account={this.state.account} onSignout={this.onSignout.bind(this)} changeMenuStatus={this.changeMenuStatus.bind(this)} showMenu={this.state.showMenu} />
        <div
          id="Wrapper"
          style={{
            backgroundColor: `${this.state.nodeBackgroundColor}`,
            backgroundImage: `url(${this.state.nodeBackgroundImage}), url(${Setting.getStatic("/img/shadow_light.png")})`,
            backgroundRepeat: `${this.state.nodeBackgroundRepeat}, repeat-x`,
          }}
          className={classNames(this.state.nodeId, localStorage.getItem("themeMode") === "dark" ? "Night" : "")}
          onClick={() => this.changeMenuStatus(false)}
        >
          {this.renderContent()}
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
