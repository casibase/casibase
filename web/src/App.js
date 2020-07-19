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

  componentWillMount() {
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
        <Route exact path="/" component={() =>
          <div id="Main">
            <div className="sep20" />
            <TopicPage account={this.state.account} />
          </div>
        }/>
        <Route exact path="/signup" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SignupBox />
          </div>
        }/>
        <Route exact path="/signin" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SigninBox onSignin={this.onSignin.bind(this)} />
          </div>
        }/>
        <Route exact path="/signout" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SignoutBox account={this.state.account} onSignout={this.onSignout.bind(this)} />
          </div>
        }/>
        <Route exact path="/t/:topicId" component={() =>
          <div id="Main">
            <div className="sep20" />
            <TopicBox account={this.state.account} getNodeId={this.getNodeId} />
            <div className="sep20" />
            <ReplyBox account={this.state.account} />
          </div>
        }/>
        <Route exact path="/member/:memberId" component={() =>
          <div id="Main">
            <div className="sep20" />
            <MemberBox account={this.state.account} />
            <div className="sep20" />
            <AllCreatedTopicsBox />
            <div className="sep20" />
            <LatestReplyBox />
          </div>
        }/>
        <Route exact path="/member/:memberId/:tab" component={() =>
          <div id="Main">
            <div className="sep20" />
            <AllCreatedTopicsBox />
            <div className="sep20" />
          </div>
        }/>
        <Route exact path="/settings" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SettingsBox account={this.state.account} />
          </div>
        }/>
        <Route exact path="/callback/:authType/:addition" component={() =>
          <div id="Main">
            <div className="sep20" />
            <CallbackBox />
          </div>
        }/>
        <Route exact path="/settings/:event" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SettingsBox account={this.state.account} />
          </div>
        }/>
        <Route exact path="/new" component={() =>
          <div id="Main">
            <div className="sep20" />
            <NewBox account={this.state.account} />
          </div>
        }/>
        <Route exact path="/new/:nodeId" component={() =>
          <div id="Main">
            <div className="sep20" />
            <NewBox account={this.state.account} />
          </div>
        }/>
        <Route exact path="/go/:nodeId" component={() =>
          <NodesBox account={this.state.account} getNodeId={this.getNodeId} />
        }/>
        <Route exact path="/my/:favorites" component={() =>
          <div id="Main">
            <div className="sep20" />
            <FavoritesBox />
          </div>
        }/>
        <Route exact path="/recent" component={() =>
          <div id="Main">
            <div className="sep20" />
            <RecentTopicsBox />
          </div>
        }/>
        <Route exact path="/select/language" component={() =>
          <div id="Main">
            <div className="sep20" />
            <SelectLanguageBox />
          </div>
        }/>
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
          <Route exact path="/" component={() =>
            <span>
              <div className="sep20"/>
              <RightCommunityHealthBox/>
              <div className="sep20"/>
              <RightFavouriteBox/>
            </span>
          }/>
          <Route exact path="/go/:nodeId" component={() =>
            <span>
              <div className="sep20"/>
              <RightNodeBox/>
            </span>
          }/>
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
