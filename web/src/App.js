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
import Footer from "./Footer";

const { Header } = Layout;
const { Text } = Typography;
const { Search } = Input;

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

  renderHeader() {
    return (
      <Header style={{ padding: '0', height: '38px'}}>
        <div className="logo" />
        <Menu
          // theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[`${this.state.selectedMenuKey}`]}
          style={{ lineHeight: '27px' }}
          inlineCollapsed={false}
        >
          {/*<Text>Casbin Forum</Text>*/}

          <Search
            onSearch={value => Setting.openLink(`https://www.google.com/search?q=site:casbin.org%20${value}`)}
            style={{ width: 200, marginRight: "200px" }}
          />
          <Menu.Item key="1">
            <a href="/">
              Home
            </a>
          </Menu.Item>
          <Menu.Item key="2">
            <a href="/board">
              Board
            </a>
          </Menu.Item>
          <Menu.Item key="3">
            <a href="/setting">
              Setting
            </a>
          </Menu.Item>
          <a style={{float: 'right'}} target="_blank" href="https://github.com/casbin/casbin-forum">
            <img alt="GitHub stars" src="https://img.shields.io/github/stars/casbin/casbin-forum?style=social" />
          </a>
        </Menu>
      </Header>
    )
  }

  render() {
    Setting.initServerUrl();

    return (
      <div>
        <div>
          <div style={{paddingLeft: "20px", paddingRight: "20px"}}>
            {/*<div className="layout" style={{minWidth: "600px", maxWidth: "1060px", margin: "0 auto"}}>*/}
            <div style={{minWidth: "600px", maxWidth: "1060px", margin: "0 auto"}}>
              <div style={{paddingTop: "6px"}}>
                {
                  this.renderHeader()
                }
              </div>
            </div>
          </div>
          <div style={{backgroundColor: "rgb(226,226,226)"}}>
            <div style={{minWidth: "600px", maxWidth: "1100px", margin: "0 auto"}}>
              <div style={{width: "270px", float: "right", marginRight: "20px"}}>
                <div style={{height: "20px"}} />
                <AccountWidget />
                <div style={{height: "20px"}} />
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
      </div>
    );
  }
}

export default App;
