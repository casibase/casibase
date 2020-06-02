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
import AccountWidget from "./AccountWidget";
import NodeWidget from "./NodeWidget";
import Header from "./Header";
import Footer from "./Footer";
import RightSigninBox from "./rightbar/RightSigninBox";
import SignupBox from "./main/SignupBox";
import SigninBox from "./main/SigninBox";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 1,
    };
  }

  componentWillMount() {
    // eslint-disable-next-line no-restricted-globals
    const pathname = location.pathname;
    if (pathname.includes('node')) {
      this.setState({ selectedMenuKey: 2 });
    } else if (pathname.includes('setting')) {
      this.setState({ selectedMenuKey: 3 });
    } else {
      this.setState({ selectedMenuKey: 1 });
    }
  }

  render() {
    Setting.initServerUrl();

    // eslint-disable-next-line no-restricted-globals
    const pathname = location.pathname;
    if (pathname === "/signup") {
      return (
        <div>
          <Header />
          <div id="Wrapper">
            <div className="content">
              <div id="Leftbar" />
              <div id="Rightbar">
                <div className="sep20" />
              </div>
              <div id="Main">
                <div className="sep20" />
                <SignupBox />
              </div>
              <div className="c" />
              <div className="sep20" />
            </div>
          </div>
          <Footer />
        </div>
      )
    } else if (pathname === "/signin") {
      return (
        <div>
          <Header />
          <div id="Wrapper">
            <div className="content">
              <div id="Leftbar" />
              <div id="Rightbar">
                <div className="sep20" />
              </div>
              <div id="Main">
                <div className="sep20" />
                <SigninBox />
              </div>
              <div className="c" />
              <div className="sep20" />
            </div>
          </div>
          <Footer />
        </div>
      )
    }

    return (
      <div>
        <Header />
        <div id="Wrapper">
          <div className="content">
            <div id="Leftbar" />
            <div id="Rightbar">
              <div className="sep20" />
              <RightSigninBox />
              <div className="sep20" />
              <AccountWidget />
            </div>
            <div id="Main">
              <div className="sep20" />
              <div className="box">
                <Switch>
                  <Route exact path="/" component={TopicPage}/>
                  <Route exact path="/node" component={NodePage}/>
                </Switch>
              </div>
            </div>
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
