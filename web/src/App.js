import React, {Component} from 'react';
import {Switch, Redirect, Route, withRouter, Link} from 'react-router-dom';
import {Avatar, BackTop, Dropdown, Layout, Menu} from 'antd';
import {DownOutlined, LogoutOutlined, SettingOutlined} from '@ant-design/icons';
import './App.less';
import * as Setting from "./Setting";
import * as AccountBackend from "./backend/AccountBackend";
import AuthCallback from "./AuthCallback";
import * as Conf from "./Conf";
import HomePage from "./HomePage";
import WordsetListPage from "./WordsetListPage";
import WordsetEditPage from "./WordsetEditPage";
import VectorsetListPage from "./VectorsetListPage";
import VectorsetEditPage from "./VectorsetEditPage";
import SigninPage from "./SigninPage";
import i18next from "i18next";
import SelectLanguageBox from "./SelectLanguageBox";

const {Header, Footer} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      uri: null,
    };

    Setting.initServerUrl();
    Setting.initCasdoorSdk(Conf.AuthConfig);
  }

  componentWillMount() {
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
    if (uri === '/') {
      this.setState({selectedMenuKey: '/'});
    } else if (uri.includes('/wordsets')) {
      this.setState({ selectedMenuKey: '/wordsets' });
    } else if (uri.includes('/vectorsets')) {
      this.setState({ selectedMenuKey: '/vectorsets' });
    } else {
      this.setState({selectedMenuKey: 'null'});
    }
  }

  onUpdateAccount(account) {
    this.setState({
      account: account
    });
  }

  setLanguage(account) {
    // let language = account?.language;
    let language = localStorage.getItem("language");
    if (language !== "" && language !== i18next.language) {
      Setting.setLanguage(language);
    }
  }

  getAccount() {
    AccountBackend.getAccount()
      .then((res) => {
        let account = res.data;
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
        if (res.status === 'ok') {
          this.setState({
            account: null
          });

          Setting.showMessage("success", `Successfully signed out, redirected to homepage`);
          Setting.goToLink("/");
          // this.props.history.push("/");
        } else {
          Setting.showMessage("error", `Signout failed: ${res.msg}`);
        }
      });
  }

  handleRightDropdownClick(e) {
    if (e.key === '/account') {
      Setting.openLink(Setting.getMyProfileUrl(this.state.account));
    } else if (e.key === '/logout') {
      this.signout();
    }
  }

  renderAvatar() {
    if (this.state.account.avatar === "") {
      return (
        <Avatar style={{ backgroundColor: Setting.getAvatarColor(this.state.account.name), verticalAlign: 'middle' }} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      )
    } else {
      return (
        <Avatar src={this.state.account.avatar} style={{verticalAlign: 'middle' }} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      )
    }
  }

  renderRightDropdown() {
    const menu = (
      <Menu onClick={this.handleRightDropdownClick.bind(this)}>
        <Menu.Item key="/account">
          <SettingOutlined />
          {i18next.t("account:My Account")}
        </Menu.Item>
        <Menu.Item key="/logout">
          <LogoutOutlined />
          {i18next.t("account:Sign Out")}
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown key="/rightDropDown" overlay={menu} className="rightDropDown">
        <div className="ant-dropdown-link" style={{float: 'right', cursor: 'pointer'}}>
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
    )
  }

  renderAccount() {
    let res = [];

    if (this.state.account === undefined) {
      return null;
    } else if (this.state.account === null) {
      res.push(
        <Menu.Item key="/signup" style={{float: 'right', marginRight: '20px'}}>
          <a href={Setting.getSignupUrl()}>
            {i18next.t("account:Sign Up")}
          </a>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/signin" style={{float: 'right'}}>
          <a href={Setting.getSigninUrl()}>
            {i18next.t("account:Sign In")}
          </a>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="/" style={{float: 'right'}}>
          <a href="/">
            {i18next.t("general:Home")}
          </a>
        </Menu.Item>
      );
    } else {
      res.push(this.renderRightDropdown());
    }

    return res;
  }

  renderMenu() {
    let res = [];

    if (this.state.account === null || this.state.account === undefined) {
      return [];
    }

    res.push(
      <Menu.Item key="/">
        <a href="/">
          {i18next.t("general:Home")}
        </a>
        {/*<Link to="/">*/}
        {/*  Home*/}
        {/*</Link>*/}
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
      <Menu.Item key="/vectorsets">
        <Link to="/vectorsets">
          {i18next.t("general:Vectorsets")}
        </Link>
      </Menu.Item>
    );

    return res;
  }

  renderHomeIfSignedIn(component) {
    if (this.state.account !== null && this.state.account !== undefined) {
      return <Redirect to='/' />
    } else {
      return component;
    }
  }

  renderSigninIfNotSignedIn(component) {
    if (this.state.account === null) {
      sessionStorage.setItem("from", window.location.pathname);
      return <Redirect to='/signin' />
    } else if (this.state.account === undefined) {
      return null;
    }
    else {
      return component;
    }
  }

  renderContent() {
    return (
      <div>
        <Header style={{padding: '0', marginBottom: '3px'}}>
          {
            Setting.isMobile() ? null : <a className="logo" href={"/"}/>
          }
          <Menu
            // theme="dark"
            mode={"horizontal"}
            selectedKeys={[`${this.state.selectedMenuKey}`]}
            style={{lineHeight: '64px'}}
          >
            {
              this.renderMenu()
            }
            {
              this.renderAccount()
            }
            <SelectLanguageBox />
          </Menu>
        </Header>
        <Switch>
          <Route exact path="/callback" component={AuthCallback}/>
          <Route exact path="/" render={(props) => <HomePage account={this.state.account} {...props} />}/>
          <Route exact path="/signin" render={(props) => this.renderHomeIfSignedIn(<SigninPage {...props} />)}/>
          <Route exact path="/wordsets" render={(props) => this.renderSigninIfNotSignedIn(<WordsetListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/wordsets/:wordsetName" render={(props) => this.renderSigninIfNotSignedIn(<WordsetEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/vectorsets" render={(props) => this.renderSigninIfNotSignedIn(<VectorsetListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/vectorsets/:vectorsetName" render={(props) => this.renderSigninIfNotSignedIn(<VectorsetEditPage account={this.state.account} {...props} />)}/>
        </Switch>
      </div>
    )
  }

  renderFooter() {
    // How to keep your footer where it belongs ?
    // https://www.freecodecamp.org/neyarnws/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/

    return (
      <Footer id="footer" style={
        {
          borderTop: '1px solid #e8e8e8',
          backgroundColor: 'white',
          textAlign: 'center',
        }
      }>
        Made with <span style={{color: 'rgb(255, 255, 255)'}}>❤️</span> by <a style={{fontWeight: "bold", color: "black"}} target="_blank" href="https://github.com/casbin/casbase">Casbase</a>, { Setting.isMobile() ? "Mobile" : "Desktop" } View
      </Footer>
    )
  }

  render() {
    return (
      <div id="parent-area">
        <BackTop/>
        <div id="content-wrap">
          {
            this.renderContent()
          }
        </div>
        {
          this.renderFooter()
        }
      </div>
    );
  }
}

export default withRouter(App);
