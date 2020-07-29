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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      account: undefined,
      nodeId: null
    };

    Setting.initServerUrl();
    Setting.initFullClientUrl();
    this.getNodeId = this.getNodeId.bind(this)
  }

  componentDidMount() {
    Setting.SetLanguage();
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

  getNodeId(id) {
    if (this.state.nodeId === null) {
      this.setState({
        nodeId: id
      })
    }
  }

  getAccount() {
    AccountBackend.getAccount()
      .then((res) => {
        const account = Setting.parseJson(res.data);
        this.setState({
          account: account,
        });
      });
  }

  renderMain() {
    return (
      <Switch>
        <Route exact path="/">
          <div id="Main">
            <div className="sep20" />
            <TopicPage account={this.state.account} />
            <div className="sep20" />
            <NodeNavigationBox />
          </div>
        </Route>
        <Route exact path="/signup">
          <div id="Main">
            <div className="sep20" />
            <SignupBox />
          </div>
        </Route>
        <Route exact path="/signin">
          <div id="Main">
            <div className="sep20" />
            <SigninBox onSignin={this.onSignin.bind(this)} />
          </div>
        </Route>
        <Route exact path="/signout">
          <div id="Main">
            <div className="sep20" />
            <SignoutBox account={this.state.account} onSignout={this.onSignout.bind(this)} />
          </div>
        </Route>
        <Route exact path="/t/:topicId">
          <div id="Main">
            <div className="sep20" />
            <TopicBox account={this.state.account} getNodeId={this.getNodeId} />
            <div className="sep20" />
            <ReplyBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/member/:memberId">
          <div id="Main">
            <MemberBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/member/:memberId/:tab">
          <div id="Main">
            <div className="sep20" />
            <AllCreatedTopicsBox />
            <div className="sep20" />
          </div>
        </Route>
        <Route exact path="/settings">
          <div id="Main">
            <div className="sep20" />
            <SettingsBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/callback/:authType/:addition">
          <div id="Main">
            <div className="sep20" />
            <CallbackBox />
          </div>
        </Route>
        <Route exact path="/settings/:event">
          <div id="Main">
            <div className="sep20" />
            <SettingsBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/new">
          <div id="Main">
            <div className="sep20" />
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/new/:nodeId">
          <div id="Main">
            <div className="sep20" />
            <NewBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/go/:nodeId">
          <NodesBox account={this.state.account} getNodeId={this.getNodeId} />
        </Route>
        <Route exact path="/my/:favorites">
          <div id="Main">
            <div className="sep20" />
            <FavoritesBox />
          </div>
        </Route>
        <Route exact path="/recent">
          <div id="Main">
            <div className="sep20" />
            <RecentTopicsBox />
          </div>
        </Route>
        <Route exact path="/select/language">
          <div id="Main">
            <div className="sep20" />
            <SelectLanguageBox />
          </div>
        </Route>
        <Route exact path="/notifications">
          <div id="Main">
            <div className="sep20" />
            <NotificationBox />
          </div>
        </Route>
        <Route exact path="/planes">
          <div id="Main">
            <div className="sep20" />
            <PlaneBox />
          </div>
        </Route>
        <Route exact path="/balance">
          <div id="Main">
            <div className="sep20" />
            <BalanceBox account={this.state.account} />
          </div>
        </Route>
        <Route exact path="/mission/daily">
          <div id="Main">
            <div className="sep20" />
            <CheckinBonusBox />
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

  render() {
    return (
      <div>
        <Header account={this.state.account} onSignout={this.onSignout.bind(this)} />
        <div  className={`Wrapper ${this.state.nodeId}`} >
          <div className="content">
            <div id="Leftbar" />
            <CustomGithubCorner />
            {
              this.renderRightbar()
            }
            {
              this.renderMain()
            }
            <div className="c" />
            <div className="sep20" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
