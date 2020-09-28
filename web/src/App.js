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

import React, {Component} from 'react';
import './App.css';
import * as Setting from "./Setting";
import {Layout, Menu, Input, Typography, Col, Row} from 'antd';
import {Switch, Route} from 'react-router-dom'
import TopicPage from "./TopicPage";
import NodePage from "./NodePage";
import NodeWidget from "./NodeWidget";
import Header from "./Header";
import Footer from "./Footer";
import RightSigninBox from "./rightbar/RightSigninBox";
import RightAccountBox from "./rightbar/RightAccountBox";
import SignupBox from "./main/SignupBox";
import SigninBox from "./main/SigninBox";
import TopicBox from "./main/TopicBox";
import ReplyBox from "./main/ReplyBox";
import MemberBox from "./main/MemberBox";
import SettingsBox from "./main/SettingsBox";
import * as AccountBackend from "./backend/AccountBackend";
import SignoutBox from "./main/SignoutBox";
import AllCreatedTopicsBox from "./main/AllCreatedTopicsBox";
import LatestReplyBox from "./main/LatestReplyBox";
import CallbackBox from "./main/AuthBox";
import NewBox from "./main/NewBox";
import NewReplyBox from "./main/NewReplyBox";
import NodesBox from "./main/NodeBox";
import FavoritesBox from "./main/FavoritesBox";
import RecentTopicsBox from "./main/RecentTopicsBox";
import SelectLanguageBox from "./main/SelectLanguageBox";
import "./node.css"
import "./i18n"
import RightCommunityHealthBox from "./rightbar/RightCommunityHealthBox";
import RightFavouriteBox from "./rightbar/RightFavouriteBox";
import RightNodeBox from "./rightbar/RightNodeBox";
import CustomGithubCorner from "./main/CustomGithubCorner";
import NotificationBox from "./main/NotificationBox"
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
import ForgotBox from "./main/ForgotBox";
import FilesBox from "./main/FilesBox";
import AdminHomepage from "./admin/AdminHomepage";
import AdminNode from "./admin/AdminNode";
import AdminTab from "./admin/AdminTab";
import AdminMember from "./admin/AdminMember";
import i18next from "i18next";
import AdminPlane from "./admin/AdminPlane";
import AdminTopic from "./admin/AdminTopic";

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
      nodeBackgroundRepeat: ""
    };

    Setting.initServerUrl();
    Setting.initFullClientUrl();
    Setting.initBrowserType();
    this.getNodeBackground = this.getNodeBackground.bind(this);
    this.changeMenuStatus = this.changeMenuStatus.bind(this);
  }

  componentDidMount() {
    //Setting.SetLanguage();
    this.getAccount();
  }

  onSignin() {
    this.getAccount();
  }

  onSignout() {
    this.getAccount();
  }

  onUpdateAccount(account) {
    this.setState({
      account: account
    });
  }

  getNodeBackground(id, backgroundImage, backgroundColor, backgroundRepeat) {
    if (this.state.nodeId === null) {
      this.setState({
        nodeId: id,
        nodeBackgroundImage: backgroundImage,
        nodeBackgroundColor: backgroundColor,
        nodeBackgroundRepeat: backgroundRepeat
      });
    }
  }

  getAccount() {
    AccountBackend.getAccount()
      .then((res) => {
        const account = Setting.parseJson(res.data);
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

  renderMain() {
    const pcBrowser = Setting.PcBrowser
    return (
      <Switch>
        <Route exact path="/">
          {pcBrowser ? null : <RightCheckinBonusBox account={this.state.account} />}
          {pcBrowser ? null : <div className="sep5" /> }
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicPage account={this.state.account} />
            {pcBrowser ? <div className="sep20" /> : <div className="sep5" />}
            <NodeNavigationBox />
          </div>
        </Route>
        <Route exact path="/signup">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SignupBox />
          </div>
        </Route>
        <Route exact path="/signup/:signupMethod">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SignupBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/signin">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SigninBox onSignin={this.onSignin.bind(this)} />
            {pcBrowser ? null : <div className="sep5" />}
            {pcBrowser ? null : <RightSigninBox />}
          </div>
        </Route>
        <Route exact path="/signout">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SignoutBox account={this.state.account} onSignout={this.onSignout.bind(this)} />
          </div>
        </Route>
        <Route exact path="/t/:topicId/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox account={this.state.account} getNodeBackground={this.getNodeBackground} />
          </div>
        </Route>
        <Route exact path="/t/:topicId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <TopicBox account={this.state.account} getNodeBackground={this.getNodeBackground} />
          </div>
        </Route>
        <Route exact path="/member/:memberId">
          <div id={pcBrowser ? "Main" : ""}>
            <MemberBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/member/:memberId/:tab">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AllCreatedTopicsBox />
          </div>
        </Route>
        <Route exact path="/settings">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SettingsBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/callback/:authType/:addition">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <CallbackBox />
          </div>
        </Route>
        <Route exact path="/settings/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <SettingsBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/new">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/new/:nodeId">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/go/:nodeId">
          <NodesBox account={this.state.account} getNodeBackground={this.getNodeBackground} />
        </Route>
        <Route exact path="/go/:nodeId/:event">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <NodesBox account={this.state.account} getNodeBackground={this.getNodeBackground} />
          </div>
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
        <Route exact path="/forgot">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <ForgotBox account={this.state.account} />
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
        <Route exact path="/admin/member">
          <div id={pcBrowser ? "Main" : ""}>
            {pcBrowser ? <div className="sep20" /> : null}
            <AdminMember account={this.state.account} />
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
      </Switch>
    )
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
        <div className="sep20"/>
        {isSignedIn ? <RightAccountBox account={this.state.account} nodeId={this.state.nodeId}/> :
          <RightSigninBox nodeId={this.state.nodeId}/>}
        <Switch>
          <Route exact path="/">
            <span>
              <RightCheckinBonusBox account={this.state.account} />
              <div className="sep20"/>
              <RightCommunityHealthBox />
              <div className="sep20"/>
              <RightFavouriteBox />
              <div className="sep20"/>
              <RightHotTopicBox />
              <div className="sep20"/>
              <RightHotNodeBox />
              <div className="sep20"/>
              <RightLatestNodeBox />
            </span>
          </Route>
          <Route exact path="/go/:nodeId">
            <span>
              <div className="sep20"/>
              <RightNodeBox />
            </span>
          </Route>
        </Switch>
      </div>
    )
  }

  changeMenuStatus(status) {
    if (this.state.showMenu === status) {
      return;
    }
    this.setState({
      showMenu: status
    });
  }
  
  render() {
    return (
      <div>
        <Header account={this.state.account} onSignout={this.onSignout.bind(this)} changeMenuStatus={this.changeMenuStatus.bind(this)} showMenu={this.state.showMenu}/>
        <div id="Wrapper" style={{backgroundColor: `${this.state.nodeBackgroundColor}`, backgroundImage: `url(${this.state.nodeBackgroundImage}), url(https://cdn.jsdelivr.net/gh/casbin/static/img/shadow_light.png)`, backgroundRepeat: `${this.state.nodeBackgroundRepeat}, repeat-x`}} className={this.state.nodeId} onClick={() => this.changeMenuStatus(false)}>
          <div className="content">
            <div id="Leftbar" />
            {
              Setting.PcBrowser ?
                <CustomGithubCorner /> : null
            }
            {
              Setting.PcBrowser ?
                this.renderRightbar() : null
            }
            {
              this.renderMain()
            }
            <div className="c" />
            {
              Setting.PcBrowser ?
                <div className="sep20" /> : null
            }
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
