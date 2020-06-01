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
import BoardPage from "./BoardPage";
import AccountWidget from "./AccountWidget";
import BoardWidget from "./BoardWidget";
import Header from "./Header";
import Footer from "./Footer";

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
    const uri = location.pathname;
    if (uri.includes('board')) {
      this.setState({ selectedMenuKey: 2 });
    } else if (uri.includes('setting')) {
      this.setState({ selectedMenuKey: 3 });
    } else {
      this.setState({ selectedMenuKey: 1 });
    }
  }

  render() {
    Setting.initServerUrl();

    return (
      <div>
        <Header />
        <div style={{backgroundColor: "rgb(226,226,226)"}}>
          <div style={{minWidth: "600px", maxWidth: "1100px", margin: "0 auto"}}>
            <div style={{width: "270px", float: "right", marginRight: "20px"}}>
              <div className="sep20" />
              <AccountWidget />
              <div className="sep20" />
              <BoardWidget />
            </div>
            <div style={{width: "auto", margin: "0 310px 0 20px"}}>
              <div style={{height: "20px"}} />
              <Switch style={{marginLeft: "20px"}}>
                <Route exact path="/" component={TopicPage}/>
                <Route exact path="/board" component={BoardPage}/>
              </Switch>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
