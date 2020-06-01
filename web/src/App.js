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
import {Layout, Menu, Typography} from 'antd';
import {Switch, Route} from 'react-router-dom'
import TopicPage from "./TopicPage";
import BoardPage from "./BoardPage";

const { Header, Footer } = Layout;
const { Text } = Typography;

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
        <div id="content-wrap">
          <div className="layout">
            <Header style={{ padding: '0', height: '50px'}}>
              <div style={{marginLeft: '20px'}} className="logo" />
              <Menu
                // theme="dark"
                mode="horizontal"
                defaultSelectedKeys={[`${this.state.selectedMenuKey}`]}
                style={{ lineHeight: '44px' }}
                inlineCollapsed={false}
              >
                {/*<Text>Casbin Forum</Text>*/}

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
                <Menu.Item key='4' style={{float: 'right'}}>
                  <a target="_blank" href="https://github.com/casbin/casbin-forum">
                    <img alt="GitHub stars" src="https://img.shields.io/github/stars/casbin/casbin-forum?style=social" />
                  </a>
                </Menu.Item>
              </Menu>
            </Header>
          </div>
          <Switch>
            <Route exact path="/" component={TopicPage}/>
            <Route exact path="/board" component={BoardPage}/>
          </Switch>
          {/*How to keep your footer where it belongs ?*/}
          {/*https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/*/}
          <Footer id="footer" style={
            {
              borderTop: '1px solid #e8e8e8',
              backgroundColor: 'white',
              textAlign: 'center',
            }
          }>
            Made with <span style={{color: 'rgb(255, 255, 255)'}}>❤️</span> by <a style={{fontWeight: "bold", color: "black"}} target="_blank" href="https://casbin.org">Casbin</a>
          </Footer>
        </div>
      </div>
    );
  }
}

export default App;
