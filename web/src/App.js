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
import HomePage from "./HomePage";
// import TaskPage from "./TaskPage";

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
    if (uri.includes('note')) {
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
      <div className="layout">
        <Header style={{ padding: '0', marginBottom: '8px'}}>
          <div className="logo" />
          <Menu
            // theme="dark"
            mode="horizontal"
            defaultSelectedKeys={[`${this.state.selectedMenuKey}`]}
            style={{ lineHeight: '64px' }}
            inlineCollapsed={false}
          >
            <Text>Casbin Forum</Text>

            <Menu.Item key="1">
              <a href="/">
                Home
              </a>
            </Menu.Item>
            <Menu.Item key="2">
              <a href="/note">
                Note
              </a>
            </Menu.Item>
            <Menu.Item key="3">
              <a href="/setting">
                Setting
              </a>
            </Menu.Item>
          </Menu>
        </Header>
        <Switch>
          <Route exact path="/" component={HomePage}/>
          {/*<Route path="/task/" component={TaskPage}/>*/}
        </Switch>
        <Footer style={{ textAlign: 'center' }}>Casbin Organization</Footer>
      </div>
    );
  }
}

export default App;
