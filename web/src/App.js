// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {Avatar, Button, Card, ConfigProvider, Drawer, Dropdown, FloatButton, Layout, Menu, Result} from "antd";
import {BarsOutlined, CommentOutlined, DownOutlined, LogoutOutlined, SettingOutlined} from "@ant-design/icons";
import "./App.less";
import * as Setting from "./Setting";
import * as AccountBackend from "./backend/AccountBackend";
import AuthCallback from "./AuthCallback";
import * as Conf from "./Conf";
import HomePage from "./HomePage";
import StoreListPage from "./StoreListPage";
import StoreEditPage from "./StoreEditPage";
import FileTreePage from "./FileTreePage";
import VideoListPage from "./VideoListPage";
import VideoEditPage from "./VideoEditPage";
import VideoPage from "./VideoPage";
import PublicVideoListPage from "./basic/PublicVideoListPage";
import ProviderListPage from "./ProviderListPage";
import ProviderEditPage from "./ProviderEditPage";
import VectorListPage from "./VectorListPage";
import VectorEditPage from "./VectorEditPage";
import SigninPage from "./SigninPage";
import i18next from "i18next";
import {withTranslation} from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ChatEditPage from "./ChatEditPage";
import ChatListPage from "./ChatListPage";
import MessageListPage from "./MessageListPage";
import MessageEditPage from "./MessageEditPage";
import NodeListPage from "./NodeListPage";
import NodeEditPage from "./NodeEditPage";
import MachineListPage from "./MachineListPage";
import MachineEditPage from "./MachineEditPage";
import ImageListPage from "./ImageListPage";
import ImageEditPage from "./ImageEditPage";
import SessionListPage from "./SessionListPage";
import RecordListPage from "./RecordListPage";
import RecordEditPage from "./RecordEditPage";
import TaskListPage from "./TaskListPage";
import TaskEditPage from "./TaskEditPage";
import ArticleListPage from "./ArticleListPage";
import ArticleEditPage from "./ArticleEditPage";
import ChatPage from "./ChatPage";
import CustomGithubCorner from "./CustomGithubCorner";
import ShortcutsPage from "./basic/ShortcutsPage";
import UsagePage from "./UsagePage";
import * as StoreBackend from "./backend/StoreBackend";
import NodeWorkbench from "./NodeWorkbench";
import AccessPage from "./component/access/AccessPage";

const {Header, Footer, Content} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      uri: null,
      themeData: Conf.ThemeDefault,
      menuVisible: false,
    };

    Setting.initServerUrl();
    Setting.initCasdoorSdk(Conf.AuthConfig);
  }

  UNSAFE_componentWillMount() {
    this.updateMenuKey();
    this.getAccount();
    this.setTheme();
  }

  setTheme() {
    StoreBackend.getStore("admin", "store-built-in").then((res) => {
      if (res.status === "ok" && res.data) {
        const color = res.data.themeColor ? res.data.themeColor : Conf.ThemeDefault.colorPrimary;
        Setting.setThemeColor(color);
      } else {
        Setting.setThemeColor(Conf.ThemeDefault.colorPrimary);
        Setting.showMessage("error", `Failed to get theme: ${res.msg}`);
      }
    });
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
    if (uri === "/" || uri === "/home") {
      this.setState({selectedMenuKey: "/"});
    } else if (uri.includes("/stores")) {
      this.setState({selectedMenuKey: "/stores"});
    } else if (uri.includes("/providers")) {
      this.setState({selectedMenuKey: "/providers"});
    } else if (uri.includes("/vectors")) {
      this.setState({selectedMenuKey: "/vectors"});
    } else if (uri.includes("/chats")) {
      this.setState({selectedMenuKey: "/chats"});
    } else if (uri.includes("/messages")) {
      this.setState({selectedMenuKey: "/messages"});
    } else if (uri.includes("/usages")) {
      this.setState({selectedMenuKey: "/usages"});
    } else if (uri.includes("/nodes")) {
      this.setState({selectedMenuKey: "/nodes"});
    } else if (uri.includes("/machines")) {
      this.setState({selectedMenuKey: "/machines"});
    } else if (uri.includes("/images")) {
      this.setState({selectedMenuKey: "/images"});
    } else if (uri.includes("/sessions")) {
      this.setState({selectedMenuKey: "/sessions"});
    } else if (uri.includes("/records")) {
      this.setState({selectedMenuKey: "/records"});
    } else if (uri.includes("/tasks")) {
      this.setState({selectedMenuKey: "/tasks"});
    } else if (uri.includes("/articles")) {
      this.setState({selectedMenuKey: "/articles"});
    } else if (uri.includes("/public-videos")) {
      this.setState({selectedMenuKey: "/public-videos"});
    } else if (uri.includes("/videos")) {
      this.setState({selectedMenuKey: "/videos"});
    } else if (uri.includes("/chat")) {
      this.setState({selectedMenuKey: "/chat"});
    } else if (uri.includes("/swagger")) {
      this.setState({selectedMenuKey: "/swagger"});
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
        const account = res.data;
        if (account !== null) {
          this.setLanguage(account);
        }

        this.setState({
          account: account,
        });
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

  onClose = () => {
    this.setState({
      menuVisible: false,
    });
  };

  showMenu = () => {
    this.setState({
      menuVisible: true,
    });
  };

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
    if (Setting.isAnonymousUser(this.state.account) || Setting.getUrlParam("isRaw") !== null) {
      return (
        <div className="rightDropDown">
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
      );
    }

    const items = [];
    items.push(Setting.getItem(<><SettingOutlined />&nbsp;&nbsp;{i18next.t("account:My Account")}</>,
      "/account"
    ));
    items.push(Setting.getItem(<><CommentOutlined />&nbsp;&nbsp;{i18next.t("account:Chats & Messages")}</>,
      "/chat"
    ));
    items.push(Setting.getItem(<><LogoutOutlined />&nbsp;&nbsp;{i18next.t("account:Sign Out")}</>,
      "/logout"
    ));
    const onClick = (e) => {
      if (e.key === "/account") {
        Setting.openLink(Setting.getMyProfileUrl(this.state.account));
      } else if (e.key === "/logout") {
        this.signout();
      } else if (e.key === "/chat") {
        this.props.history.push("/chat");
      }
    };

    return (
      <Dropdown key="/rightDropDown" menu={{items, onClick}} >
        <div className="rightDropDown">
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

  renderAccountMenu() {
    if (this.state.account === undefined) {
      return null;
    } else if (this.state.account === null) {
      return (
        <React.Fragment>
          <div key="/signup" style={{float: "right", marginRight: "20px"}}>
            <a href={Setting.getSignupUrl()}>
              {i18next.t("account:Sign Up")}
            </a>
          </div>
          <div key="/signin" style={{float: "right"}}>
            <a href={Setting.getSigninUrl()}>
              {i18next.t("account:Sign In")}
            </a>
          </div>
          <div style={{float: "right", margin: "0px", padding: "0px"}}>
            <LanguageSelect />
          </div>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          {this.renderRightDropdown()}
          <LanguageSelect />
        </React.Fragment>
      );
    }
  }

  getMenuItems() {
    const res = [];

    res.push(Setting.getItem(<Link to="/">{i18next.t("general:Home")}</Link>, "/"));

    if (this.state.account === null || this.state.account === undefined) {
      return [];
    }

    if (this.state.account.type.startsWith("video-")) {
      res.push(Setting.getItem(<Link to="/videos">{i18next.t("general:Videos")}</Link>, "/videos"));
      // res.push(Setting.getItem(<Link to="/public-videos">{i18next.t("general:Public Videos")}</Link>, "/public-videos"));

      if (this.state.account.type === "video-admin-user") {
        res.push(Setting.getItem(
          <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/users")}>
            {i18next.t("general:Users")}
            {Setting.renderExternalLink()}
          </a>,
          "#"));
      }

      // if (window.location.pathname === "/") {
      //   Setting.goToLinkSoft(this, "/public-videos");
      // }
      return res;
    }

    if (!this.state.account.isAdmin) {
      if (!(Conf.ShortcutPageItems.length > 0 && this.state.account.type === "chat-admin")) {
        res.push(Setting.getItem(<Link to="/usages">{i18next.t("general:Usages")}</Link>, "/usages"));
        return res;
      }
    }

    const domain = Setting.getSubdomain();
    // const domain = "data";

    if (Conf.ShortcutPageItems.length > 0 && domain === "data") {
      res.push(Setting.getItem(<Link to="/stores">{i18next.t("general:Stores")}</Link>, "/stores"));
      res.push(Setting.getItem(<Link to="/providers">{i18next.t("general:Providers")}</Link>, "/providers"));
      res.push(Setting.getItem(<Link to="/nodes">{i18next.t("general:Nodes")}</Link>, "/nodes"));
      res.push(Setting.getItem(<Link to="/sessions">{i18next.t("general:Sessions")}</Link>, "/sessions"));
      res.push(Setting.getItem(<Link to="/records">{i18next.t("general:Records")}</Link>, "/records"));
    } else if (Conf.ShortcutPageItems.length > 0 && domain === "ai") {
      res.push(Setting.getItem(<Link to="/chat">{i18next.t("general:Chat")}</Link>, "/chat"));
      res.push(Setting.getItem(<Link to="/stores">{i18next.t("general:Stores")}</Link>, "/stores"));
      res.push(Setting.getItem(<Link to="/providers">{i18next.t("general:Providers")}</Link>, "/providers"));
      res.push(Setting.getItem(<Link to="/vectors">{i18next.t("general:Vectors")}</Link>, "/vectors"));
      res.push(Setting.getItem(<Link to="/chats">{i18next.t("general:Chats")}</Link>, "/chats"));
      res.push(Setting.getItem(<Link to="/messages">{i18next.t("general:Messages")}</Link>, "/messages"));
      res.push(Setting.getItem(<Link to="/usages">{i18next.t("general:Usages")}</Link>, "/usages"));
      // res.push(Setting.getItem(<Link to="/tasks">{i18next.t("general:Frameworks")}</Link>, "/tasks"));
      // res.push(Setting.getItem(<Link to="/articles">{i18next.t("general:Articles")}</Link>, "/articles"));
    } else if (Conf.ShortcutPageItems.length > 0 && this.state.account.type === "chat-admin") {
      res.push(Setting.getItem(<Link to="/chat">{i18next.t("general:Chat")}</Link>, "/chat"));
      res.push(Setting.getItem(<Link to="/stores">{i18next.t("general:Stores")}</Link>, "/stores"));
      res.push(Setting.getItem(<Link to="/vectors">{i18next.t("general:Vectors")}</Link>, "/vectors"));
      res.push(Setting.getItem(<Link to="/chats">{i18next.t("general:Chats")}</Link>, "/chats"));
      res.push(Setting.getItem(<Link to="/messages">{i18next.t("general:Messages")}</Link>, "/messages"));
      res.push(Setting.getItem(<Link to="/usages">{i18next.t("general:Usages")}</Link>, "/usages"));

      if (window.location.pathname === "/") {
        Setting.goToLinkSoft(this, "/chat");
      }

      res.push(Setting.getItem(
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/users")}>
          {i18next.t("general:Users")}
          {Setting.renderExternalLink()}
        </a>,
        "#"));

      res.push(Setting.getItem(
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/resources")}>
          {i18next.t("general:Resources")}
          {Setting.renderExternalLink()}
        </a>,
        "##"));

      res.push(Setting.getItem(
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/permissions")}>
          {i18next.t("general:Permissions")}
          {Setting.renderExternalLink()}
        </a>,
        "###"));
    } else if (Conf.ShortcutPageItems.length > 0 && domain === "video") {
      if (Conf.EnableExtraPages) {
        res.push(Setting.getItem(<Link to="/videos">{i18next.t("general:Videos")}</Link>, "/videos"));
        // res.push(Setting.getItem(<Link to="/public-videos">{i18next.t("general:Public Videos")}</Link>, "/public-videos"));
        // res.push(Setting.getItem(<Link to="/tasks">{i18next.t("general:Frameworks")}</Link>, "/tasks"));
        // res.push(Setting.getItem(<Link to="/articles">{i18next.t("general:Articles")}</Link>, "/articles"));
      }

      if (window.location.pathname === "/") {
        Setting.goToLinkSoft(this, "/videos");
      }
    } else {
      res.push(Setting.getItem(<Link to="/chat">{i18next.t("general:Chat")}</Link>, "/chat"));
      res.push(Setting.getItem(<Link to="/stores">{i18next.t("general:Stores")}</Link>, "/stores"));
      res.push(Setting.getItem(<Link to="/providers">{i18next.t("general:Providers")}</Link>, "/providers"));
      res.push(Setting.getItem(<Link to="/vectors">{i18next.t("general:Vectors")}</Link>, "/vectors"));
      res.push(Setting.getItem(<Link to="/chats">{i18next.t("general:Chats")}</Link>, "/chats"));
      res.push(Setting.getItem(<Link to="/messages">{i18next.t("general:Messages")}</Link>, "/messages"));
      res.push(Setting.getItem(<Link to="/usages">{i18next.t("general:Usages")}</Link>, "/usages"));

      res.push(Setting.getItem(<Link to="/nodes">{i18next.t("general:Nodes")}</Link>, "/nodes"));
      res.push(Setting.getItem(<Link to="/machines">{i18next.t("general:Machines")}</Link>, "/machines"));
      res.push(Setting.getItem(<Link to="/images">{i18next.t("general:Images")}</Link>, "/images"));
      res.push(Setting.getItem(<Link to="/sessions">{i18next.t("general:Sessions")}</Link>, "/sessions"));
      res.push(Setting.getItem(<Link to="/records">{i18next.t("general:Records")}</Link>, "/records"));

      // res.push(Setting.getItem(<Link to="/videos">{i18next.t("general:Videos")}</Link>, "/videos"));
      // res.push(Setting.getItem(<Link to="/public-videos">{i18next.t("general:Public Videos")}</Link>, "/public-videos"));

      // res.push(Setting.getItem(<Link to="/tasks">{i18next.t("general:Frameworks")}</Link>, "/tasks"));
      // res.push(Setting.getItem(<Link to="/articles">{i18next.t("general:Articles")}</Link>, "/articles"));

      res.push(Setting.getItem(
        <a target="_blank" rel="noreferrer" href={Setting.isLocalhost() ? `${Setting.ServerUrl}/swagger/index.html` : "/swagger/index.html"}>
          {i18next.t("general:Swagger")}
          {Setting.renderExternalLink()}
        </a>,
        "#0"));

      res.push(Setting.getItem(
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/users")}>
          {i18next.t("general:Users")}
          {Setting.renderExternalLink()}
        </a>,
        "#"));

      if (Setting.isLocalAdminUser(this.state.account)) {
        res.push(Setting.getItem(
          <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/resources")}>
            {i18next.t("general:Resources")}
            {Setting.renderExternalLink()}
          </a>,
          "##"));

        res.push(Setting.getItem(
          <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.state.account).replace("/account", "/permissions")}>
            {i18next.t("general:Permissions")}
            {Setting.renderExternalLink()}
          </a>,
          "###"));
      }
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
      window.location.replace(Setting.getSigninUrl());
    } else if (this.state.account === undefined) {
      return null;
    } else {
      return component;
    }
  }

  renderRouter() {
    if (this.state.account?.type.startsWith("video-")) {
      if (window.location.pathname === "/") {
        return (
          <PublicVideoListPage account={this.state.account} />
        );
      }
    }

    return (
      <Switch>
        <Route exact path="/access/:owner/:name" render={(props) => this.renderSigninIfNotSignedIn(<AccessPage account={this.state.account} {...props} />)} />
        <Route exact path="/callback" component={AuthCallback} />
        <Route exact path="/signin" render={(props) => this.renderHomeIfSignedIn(<SigninPage {...props} />)} />
        <Route exact path="/" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
        <Route exact path="/home" render={(props) => this.renderSigninIfNotSignedIn(<HomePage account={this.state.account} {...props} />)} />
        <Route exact path="/stores" render={(props) => this.renderSigninIfNotSignedIn(<StoreListPage account={this.state.account} {...props} />)} />
        <Route exact path="/stores/:owner/:storeName" render={(props) => this.renderSigninIfNotSignedIn(<StoreEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/stores/:owner/:storeName/view" render={(props) => this.renderSigninIfNotSignedIn(<FileTreePage account={this.state.account} {...props} />)} />
        <Route exact path="/videos" render={(props) => this.renderSigninIfNotSignedIn(<VideoListPage account={this.state.account} {...props} />)} />
        <Route exact path="/videos/:owner/:videoName" render={(props) => this.renderSigninIfNotSignedIn(<VideoEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/public-videos" render={(props) => <PublicVideoListPage {...props} />} />
        <Route exact path="/public-videos/:owner/:videoName" render={(props) => <VideoPage account={this.state.account} {...props} />} />
        <Route exact path="/providers" render={(props) => this.renderSigninIfNotSignedIn(<ProviderListPage account={this.state.account} {...props} />)} />
        <Route exact path="/providers/:providerName" render={(props) => this.renderSigninIfNotSignedIn(<ProviderEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/vectors" render={(props) => this.renderSigninIfNotSignedIn(<VectorListPage account={this.state.account} {...props} />)} />
        <Route exact path="/vectors/:vectorName" render={(props) => this.renderSigninIfNotSignedIn(<VectorEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/chats" render={(props) => this.renderSigninIfNotSignedIn(<ChatListPage account={this.state.account} {...props} />)} />
        <Route exact path="/chats/:chatName" render={(props) => this.renderSigninIfNotSignedIn(<ChatEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/messages" render={(props) => this.renderSigninIfNotSignedIn(<MessageListPage account={this.state.account} {...props} />)} />
        <Route exact path="/messages/:messageName" render={(props) => this.renderSigninIfNotSignedIn(<MessageEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/usages" render={(props) => this.renderSigninIfNotSignedIn(<UsagePage account={this.state.account} {...props} />)} />
        <Route exact path="/nodes" render={(props) => this.renderSigninIfNotSignedIn(<NodeListPage account={this.state.account} {...props} />)} />
        <Route exact path="/nodes/:nodeName" render={(props) => this.renderSigninIfNotSignedIn(<NodeEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/sessions" render={(props) => this.renderSigninIfNotSignedIn(<SessionListPage account={this.state.account} {...props} />)} />
        <Route exact path="/records" render={(props) => this.renderSigninIfNotSignedIn(<RecordListPage account={this.state.account} {...props} />)} />
        <Route exact path="/records/:organizationName/:recordName" render={(props) => this.renderSigninIfNotSignedIn(<RecordEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/machines" render={(props) => this.renderSigninIfNotSignedIn(<MachineListPage account={this.state.account} {...props} />)} />
        <Route exact path="/machines/:organizationName/:machineName" render={(props) => this.renderSigninIfNotSignedIn(<MachineEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/images" render={(props) => this.renderSigninIfNotSignedIn(<ImageListPage account={this.state.account} {...props} />)} />
        <Route exact path="/images/:organizationName/:imageName" render={(props) => this.renderSigninIfNotSignedIn(<ImageEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/tasks" render={(props) => this.renderSigninIfNotSignedIn(<TaskListPage account={this.state.account} {...props} />)} />
        <Route exact path="/tasks/:taskName" render={(props) => this.renderSigninIfNotSignedIn(<TaskEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/articles" render={(props) => this.renderSigninIfNotSignedIn(<ArticleListPage account={this.state.account} {...props} />)} />
        <Route exact path="/articles/:articleName" render={(props) => this.renderSigninIfNotSignedIn(<ArticleEditPage account={this.state.account} {...props} />)} />
        <Route exact path="/chat" render={(props) => this.renderSigninIfNotSignedIn(<ChatPage account={this.state.account} {...props} />)} />
        <Route exact path="/chat/:chatName" render={(props) => this.renderSigninIfNotSignedIn(<ChatPage account={this.state.account} {...props} />)} />
        <Route path="" render={() => <Result status="404" title="404 NOT FOUND" subTitle={i18next.t("general:Sorry, the page you visited does not exist.")} extra={<a href="/"><Button type="primary">{i18next.t("general:Back Home")}</Button></a>} />} />
        <Route exact path="/workbench" render={(props) => this.renderSigninIfNotSignedIn(<NodeWorkbench account={this.state.account} {...props} />)} />
      </Switch>
    );
  }

  isWithoutCard() {
    return Setting.isMobile() || window.location.pathname.startsWith("/chat");
  }

  renderContent() {
    if (Setting.getUrlParam("isRaw") !== null) {
      return (
        <HomePage account={this.state.account} />
      );
    } else if (Setting.getSubdomain() === "portal") {
      return (
        <ShortcutsPage account={this.state.account} />
      );
    }

    const onClick = ({key}) => {
      this.props.history.push(key);
    };
    const menuStyleRight = Setting.isAdminUser(this.state.account) && !Setting.isMobile() ? "calc(180px + 260px)" : "260px";
    return (
      <Layout id="parent-area">
        <Header style={{padding: "0", marginBottom: "3px", backgroundColor: "white"}}>
          {Setting.isMobile() ? null : (
            <Link to={"/"}>
              <div className="logo" />
            </Link>
          )}
          {(Setting.isMobile() ?
            <React.Fragment>
              <Drawer title={i18next.t("general:Close")} placement="left" visible={this.state.menuVisible} onClose={this.onClose}>
                <Menu
                  items={this.getMenuItems()}
                  mode={"inline"}
                  selectedKeys={[this.state.selectedMenuKey]}
                  style={{lineHeight: "64px"}}
                  onClick={this.onClose}
                >
                </Menu>
              </Drawer>
              <Button icon={<BarsOutlined />} onClick={this.showMenu} type="text">
                {i18next.t("general:Menu")}
              </Button>
            </React.Fragment> :
            <Menu
              onClick={onClick}
              items={this.getMenuItems()}
              mode={"horizontal"}
              selectedKeys={[this.state.selectedMenuKey]}
              style={{position: "absolute", left: "145px", right: menuStyleRight}}
            />
          )}
          {
            this.renderAccountMenu()
          }
        </Header>
        <Content style={{display: "flex", flexDirection: "column"}}>
          {this.isWithoutCard() ?
            this.renderRouter() :
            <Card className="content-warp-card">
              {this.renderRouter()}
            </Card>
          }
        </Content>
        {this.renderFooter()}
      </Layout>
    );
  }

  renderFooter() {
    // How to keep your footer where it belongs ?
    // https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c

    return (
      <React.Fragment>
        <Footer id="footer" style={
          {
            borderTop: "1px solid #e8e8e8",
            backgroundColor: "white",
            textAlign: "center",
            height: "67px",
          }
        }>
          Powered by <a target="_blank" href="https://github.com/casibase/casibase" rel="noreferrer"><img style={{paddingBottom: "3px"}} height={"20px"} alt={"Casibase"} src={`${Setting.StaticBaseUrl}/img/casibase-logo_1200x256.png`} /></a>
        </Footer>
      </React.Fragment>
    );
  }

  renderPage() {
    return (
      <React.Fragment>
        {/* { */}
        {/*   this.renderBanner() */}
        {/* } */}
        <FloatButton.BackTop />
        <CustomGithubCorner />
        {
          this.renderContent()
        }
      </React.Fragment>
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

export default withRouter(withTranslation()(App));
