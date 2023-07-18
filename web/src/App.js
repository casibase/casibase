// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import {Link, Redirect, Route, Switch, withRouter} from "react-router-dom";
import {StyleProvider, legacyLogicalPropertiesTransformer} from "@ant-design/cssinjs";
import {Avatar, BackTop, Card, ConfigProvider, Dropdown, Layout, Menu} from "antd";
import {DownOutlined, LogoutOutlined, SettingOutlined} from "@ant-design/icons";
import "./App.less";
import * as Setting from "./Setting";
import * as AccountBackend from "./backend/AccountBackend";
import AuthCallback from "./AuthCallback";
import * as Conf from "./Conf";
import HomePage from "./HomePage";
import ClusteringPage from "./ClusteringPage";
import StoreListPage from "./StoreListPage";
import StoreEditPage from "./StoreEditPage";
import FileTreePage from "./FileTreePage";
import WordsetListPage from "./WordsetListPage";
import WordsetEditPage from "./WordsetEditPage";
import WordsetGraphPage from "./WordsetGraphPage";
import FactorsetListPage from "./FactorsetListPage";
import FactorsetEditPage from "./FactorsetEditPage";
import VideoListPage from "./VideoListPage";
import VideoEditPage from "./VideoEditPage";
import ProviderListPage from "./ProviderListPage";
import ProviderEditPage from "./ProviderEditPage";
import VectorListPage from "./VectorListPage";
import VectorEditPage from "./VectorEditPage";
import SigninPage from "./SigninPage";
import i18next from "i18next";
import LanguageSelect from "./LanguageSelect";
import ChatEditPage from "./ChatEditPage";
import ChatListPage from "./ChatListPage";
import MessageListPage from "./MessageListPage";
import MessageEditPage from "./MessageEditPage";
import {Content} from "antd/es/layout/layout";

const {Header, Footer} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      uri: null,
      themeData: Conf.ThemeDefault,
    };

    Setting.initServerUrl();
    Setting.initCasdoorSdk(Conf.AuthConfig);
  }

  UNSAFE_componentWillMount() {
    this.updateMenuKey();
    this.getAccount();
  }

  componentDidUpdate() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    if (this.state.uri !== uri) {
      this.updateMenuKey();
    }
  }

  updateMenuKey() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    this.setState({
      uri: uri,
    });
    if (uri === "/home") {
      this.setState({selectedMenuKey: "/home"});
    } else if (uri.includes("/stores")) {
      this.setState({selectedMenuKey: "/stores"});
    } else if (uri.includes("/clustering")) {
      this.setState({selectedMenuKey: "/clustering"});
    } else if (uri.includes("/wordsets")) {
      this.setState({selectedMenuKey: "/wordsets"});
    } else if (uri.includes("/factorsets")) {
      this.setState({selectedMenuKey: "/factorsets"});
    } else if (uri.includes("/videos")) {
      this.setState({selectedMenuKey: "/videos"});
    } else if (uri.includes("/providers")) {
      this.setState({selectedMenuKey: "/providers"});
    } else if (uri.includes("/vectors")) {
      this.setState({selectedMenuKey: "/vectors"});
    } else if (uri.includes("/chats")) {
      this.setState({selectedMenuKey: "/chats"});
    } else if (uri.includes("/messages")) {
      this.setState({selectedMenuKey: "/messages"});
    } else {
      this.setState({selectedMenuKey: "null"});
    }
  }

  onUpdateAccount(account) {
    this.setState({
      account: account,
    });
  }

  setLanguage(account) {
    // let language = account?.language;
    const language = localStorage.getItem("language");
    if (language !== "" && language !== i18next.language) {
      Setting.setLanguage(language);
    }
  }

  getAccount() {
    AccountBackend.getAccount()
      .then((res) => {
        if (res.status === "ok") {
          const account = res.data;
          if (account !== null) {
            this.setLanguage(account);
          }
          this.setState({
            account: account,
          });
        } else {
          Setting.showMessage("error", `Failed to get account: ${res.msg}`);
          Setting.goToLink("/signin");
        }
      });
  }

  signout() {
    AccountBackend.signout()
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            account: null,
          });

          Setting.showMessage("success", "Successfully signed out, redirected to homepage");
          Setting.goToLink("/");
          // this.props.history.push("/");
        } else {
          Setting.showMessage("error", `Signout failed: ${res.msg}`);
        }
      });
  }

  handleRightDropdownClick(e) {
    if (e.key === "/account") {
      Setting.openLink(Setting.getMyProfileUrl(this.state.account));
    } else if (e.key === "/logout") {
      this.signout();
    }
  }

  renderAvatar() {
    if (this.state.account.avatar === "") {
      return (
        <Avatar style={{backgroundColor: Setting.getAvatarColor(this.state.account.name), verticalAlign: "middle"}} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      );
    } else {
      return (
        <Avatar src={this.state.account.avatar} style={{verticalAlign: "middle"}} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      );
    }
  }

  renderRightDropdown() {
    const menu = (
      <Menu onClick={this.handleRightDropdownClick.bind(this)}>
        <Menu.Item key="/account">
          <div className="rightdropdown-icon-label">
            <SettingOutlined className="rightdropdown-icon" />
            {i18next.t("account:My Account")}
          </div>
        </Menu.Item>
        <Menu.Item key="/logout">
          <div className="rightdropdown-icon-label">
            <LogoutOutlined className="rightdropdown-icon" />
            {i18next.t("account:Sign Out")}
          </div>
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown key="/rightDropDown" overlay={menu} className="rightdropdown">
        <div className="ant-dropdown-link" style={{float: "right", cursor: "pointer"}}>
          &nbsp;
          &nbsp;
          {
            this.renderAvatar()
          }
          &nbsp;
          &nbsp;
          {Setting.isMobile() ? null : Setting.getShortName(this.state.account.displayName)} &nbsp; <DownOutlined />
          &nbsp;
          &nbsp;
          &nbsp;
        </div>
      </Dropdown>
    );
  }

  renderAccount() {
    const res = [];

    if (this.state.account === undefined) {
      return null;
    } else if (this.state.account === null) {
      res.push(
        <Menu.Item key="/signup" style={{float: "right", marginRight: "20px"}}>
          <a href={Setting.getSignupUrl()}>
            {i18next.t("account:Sign Up")}
          </a>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/signin" style={{float: "right"}}>
          <a href={Setting.getSigninUrl()}>
            {i18next.t("account:Sign In")}
          </a>
        </Menu.Item>
      );
    } else {
      res.push(
        <Menu.Item style={{float: "right", margin: "0px", padding: "0px"}}>
          {this.renderRightDropdown()}
        </Menu.Item>
      );
    }

    res.push(
      <Menu.Item style={{float: "right", margin: "0px", padding: "0px"}}>
        <LanguageSelect />
      </Menu.Item>
    );

    return (
      res
    );
  }

  renderMenu() {
    const res = [];

    if (this.state.account === null || this.state.account === undefined) {
      return [];
    }

    if (this.state.account.tag === "Video") {
      res.push(
        <Menu.Item key="/videos">
          <Link to="/videos">
            {i18next.t("general:Videos")}
          </Link>
        </Menu.Item>
      );

      return res;
    }

    res.push(
      <Menu.Item key="/home">
        <Link to="/home">
          {i18next.t("general:Home")}
        </Link>
      </Menu.Item>
    );
    res.push(
      <Menu.Item key="/stores">
        <Link to="/stores">
          {i18next.t("general:Stores")}
        </Link>
      </Menu.Item>
    );

    if (Conf.EnableExtraPages) {
      res.push(
        <Menu.Item key="/clustering">
          <Link to="/clustering">
            {i18next.t("general:Clustering")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/wordsets">
          <Link to="/wordsets">
            {i18next.t("general:Wordsets")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/factorsets">
          <Link to="/factorsets">
            {i18next.t("general:Factorsets")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/videos">
          <Link to="/videos">
            {i18next.t("general:Videos")}
          </Link>
        </Menu.Item>
      );
    }

    const renderExternalLink = () => {
      return (
        <svg style={{marginLeft: "5px"}} width="13.5" height="13.5" aria-hidden="true" viewBox="0 0 24 24" className="iconExternalLink_nPIU">
          <path fill="currentColor"
            d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"></path>
        </svg>
      );
    };

    res.push(
      <Menu.Item key="/providers">
        <Link to="/providers">
          {i18next.t("general:Providers")}
        </Link>
      </Menu.Item>
    );
    res.push(
      <Menu.Item key="/vectors">
        <Link to="/vectors">
          {i18next.t("general:Vectors")}
        </Link>
      </Menu.Item>
    );
    res.push(
      <Menu.Item key="/chats">
        <Link to="/chats">
          {i18next.t("general:Chats")}
        </Link>
      </Menu.Item>
    );
    res.push(
      <Menu.Item key="/messages">
        <Link to="/messages">
          {i18next.t("general:Messages")}
        </Link>
      </Menu.Item>
    );
    res.push(
      <Menu.Item key="/permissions">
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/permissions")}>
          {i18next.t("general:Permissions")}
          {renderExternalLink()}
        </a>
      </Menu.Item>
    );

    if (Setting.isLocalAdminUser(this.state.account)) {
      res.push(
        <Menu.Item key="/logs">
          <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/records")}>
            {i18next.t("general:Logs")}
            {renderExternalLink()}
          </a>
        </Menu.Item>
      );
    }

    return res;
  }

  renderHomeIfSignedIn(component) {
    if (this.state.account !== null && this.state.account !== undefined) {
      return <Redirect to="/" />;
    } else {
      return component;
    }
  }

  renderSigninIfNotSignedIn(component) {
    if (this.state.account === null) {
      sessionStorage.setItem("from", window.location.pathname);
      return <Redirect to="/signin" />;
    } else if (this.state.account === undefined) {
      return null;
    } else {
      return component;
    }
  }

  renderContent() {
    return (
      <div>
        <Header style={{padding: "0", marginBottom: "3px", backgroundColor: "white"}}>
          {
            Setting.isMobile() ? null : (
              <Link to={"/"}>
                <div className="logo" />
              </Link>
            )
          }
          <Menu
            // theme="dark"
            mode={"horizontal"}
            selectedKeys={[`${this.state.selectedMenuKey}`]}
            style={{lineHeight: "64px"}}
          >
            {
              this.renderMenu()
            }
            <div style={{position: "absolute", right: "0px", justifyContent: "flex-end"}}>
              {
                this.renderAccount()
              }
            </div>
          </Menu>
        </Header>
        <Content style={{backgroundColor: "#f5f5f5", alignItems: "stretch", display: "flex", flexDirection: "column"}}>
          <Card className="content-warp-card">
            <Switch>
              <Route exact path="/callback" component={AuthCallback} />
              <Route exact path="/signin" render={(props) => this.renderHomeIfSignedIn(<SigninPage {...props} />)} />
              <Route exact path="/" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
              <Route exact path="/home" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
              <Route exact path="/stores" render={(props) => this.renderSigninIfNotSignedIn(<StoreListPage account={this.state.account} {...props} />)} />
              <Route exact path="/stores/:owner/:storeName" render={(props) => this.renderSigninIfNotSignedIn(<StoreEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/stores/:owner/:storeName/view" render={(props) => this.renderSigninIfNotSignedIn(<FileTreePage account={this.state.account} {...props} />)} />
              <Route exact path="/clustering" render={(props) => this.renderSigninIfNotSignedIn(<ClusteringPage account={this.state.account} {...props} />)} />
              <Route exact path="/wordsets" render={(props) => this.renderSigninIfNotSignedIn(<WordsetListPage account={this.state.account} {...props} />)} />
              <Route exact path="/wordsets/:wordsetName" render={(props) => this.renderSigninIfNotSignedIn(<WordsetEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/wordsets/:wordsetName/graph" render={(props) => this.renderSigninIfNotSignedIn(<WordsetGraphPage account={this.state.account} {...props} />)} />
              <Route exact path="/factorsets" render={(props) => this.renderSigninIfNotSignedIn(<FactorsetListPage account={this.state.account} {...props} />)} />
              <Route exact path="/factorsets/:factorsetName" render={(props) => this.renderSigninIfNotSignedIn(<FactorsetEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/videos" render={(props) => this.renderSigninIfNotSignedIn(<VideoListPage account={this.state.account} {...props} />)} />
              <Route exact path="/videos/:videoName" render={(props) => this.renderSigninIfNotSignedIn(<VideoEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/providers" render={(props) => this.renderSigninIfNotSignedIn(<ProviderListPage account={this.state.account} {...props} />)} />
              <Route exact path="/providers/:providerName" render={(props) => this.renderSigninIfNotSignedIn(<ProviderEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/vectors" render={(props) => this.renderSigninIfNotSignedIn(<VectorListPage account={this.state.account} {...props} />)} />
              <Route exact path="/vectors/:vectorName" render={(props) => this.renderSigninIfNotSignedIn(<VectorEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/chats" render={(props) => this.renderSigninIfNotSignedIn(<ChatListPage account={this.state.account} {...props} />)} />
              <Route exact path="/chats/:chatName" render={(props) => this.renderSigninIfNotSignedIn(<ChatEditPage account={this.state.account} {...props} />)} />
              <Route exact path="/messages" render={(props) => this.renderSigninIfNotSignedIn(<MessageListPage account={this.state.account} {...props} />)} />
              <Route exact path="/messages/:messageName" render={(props) => this.renderSigninIfNotSignedIn(<MessageEditPage account={this.state.account} {...props} />)} />
            </Switch>
          </Card>
        </Content>
      </div>
    );
  }

  renderFooter() {
    // How to keep your footer where it belongs ?
    // https://www.freecodecamp.org/neyarnws/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/

    return (
      <Footer id="footer" style={
        {
          borderTop: "1px solid #e8e8e8",
          backgroundColor: "white",
          textAlign: "center",
        }
      }>
        Powered by <a style={{fontWeight: "bold", color: "black"}} target="_blank" rel="noreferrer" href="https://github.com/casbin/casibase">Casibase</a>
      </Footer>
    );
  }

  renderPage() {
    return (
      <Layout id="parent-area">
        <BackTop />
        <div id="content-wrap">
          {
            this.renderContent()
          }
        </div>
        {
          this.renderFooter()
        }
      </Layout>
    );
  }

  render() {
    return (
      <React.Fragment>
        <ConfigProvider theme={{
          token: {
            colorPrimary: this.state.themeData.colorPrimary,
            colorInfo: this.state.themeData.colorPrimary,
            borderRadius: this.state.themeData.borderRadius,
          },
          // algorithm: Setting.getAlgorithm(this.state.themeAlgorithm),
        }}>
          <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
            {
              this.renderPage()
            }
          </StyleProvider>
        </ConfigProvider>
      </React.Fragment>
    );
  }
}

export default withRouter(App);
