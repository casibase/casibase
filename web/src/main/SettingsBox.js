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

import React from "react";
import * as Setting from "../Setting";
import Avatar from "../Avatar";
import { withRouter, Link } from "react-router-dom";
import * as AccountBackend from "../backend/AccountBackend";
import * as MemberBackend from "../backend/MemberBackend";
import * as Tools from "./Tools";
import * as Conf from "../Conf";
import "../Reply.css";
import "../Settings.css";
import i18next from "i18next";
import * as Auth from "../auth/Auth";

class SettingsBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      member: null,
      event: props.match.params.event,
      topics: [],
      username: "",
      password: "",
      form: {},
      avatar: null,
      showSuccess: false,
      emailReminder: false,
      Setting_LIST: [
        { label: "Profile", value: "profile" },
        { label: "Avatar", value: "avatar" },
        { label: "Forum", value: "forum" },
      ],
    };
    if (this.state.event === undefined) {
      this.state.event = "profile";
    }
    if (this.state.event === "avatar") {
      const params = new URLSearchParams(this.props.location.search);
      this.state.showSuccess = params.get("success");
    }

    this.newUsername = this.newUsername.bind(this);
    this.postUsername = this.postUsername.bind(this);
  }

  componentDidMount() {
    this.initForm();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState({
        event: newProps.match.params.event,
        showSuccess: false,
      });
      this.initForm();
    }
  }

  initForm() {
    if (this.state.event !== "profile") {
      return;
    }

    let form = this.state.form;
    form["website"] = this.props.account?.website;
    form["company"] = this.props.account?.company;
    form["bio"] = this.props.account?.bio;
    form["companyTitle"] = this.props.account?.companyTitle;
    form["tagline"] = this.props.account?.tagline;
    form["location"] = this.props.account?.location;
    this.setState({
      form: form,
    });
  }

  newUsername() {
    const params = new URLSearchParams(this.props.location.search);
    let email, method, addition, avatar, addition2;
    email = params.get("email");
    method = params.get("method");
    addition = params.get("addition");
    addition2 = params.get("addition2");
    avatar = params.get("avatar");
    return {
      username: this.state.username,
      password: this.state.password,
      email: email,
      method: method,
      addition: addition,
      addition2: addition2,
      avatar: avatar,
    };
  }

  postUsername() {
    // const name = this.newUsername();
    // AccountBackend.signup(name)
    //   .then((res) => {
    //     if (res.status === "ok") {
    //       Setting.showMessage(
    //         "success",
    //         i18next.t("setting:Set username success")
    //       );
    //       window.location.href = "/";
    //     } else {
    //       Setting.showMessage(
    //         "error",
    //         `${i18next.t("setting:Set username failed")}: ${i18next.t(
    //           "setting:" + res.msg
    //         )}`
    //       );
    //     }
    //   })
    //   .catch((error) => {
    //     Setting.showMessage("error", `setting:Set username failed：${error}`);
    //   });
  }

  handleUsernameChange(e) {
    this.setState({
      username: e.target.value,
    });
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value,
    });
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  publishInfoUpdate() {
    MemberBackend.updateMemberInfo(
      this.props.account?.username,
      this.state.form
    ).then((res) => {
      if (res.status === "ok") {
        this.changeSuccess();
        this.props.refreshAccount();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  updateMemberEmailReminder() {
    MemberBackend.updateMemberEmailReminder(this.state.emailReminder).then(
      (res) => {
        if (res.status === "ok") {
          this.changeSuccess();
          this.props.refreshAccount();
        } else {
          Setting.showMessage("error", res.msg);
        }
      }
    );
  }

  handleChangeAvatar(event) {
    this.setState({
      avatar: event.target.files[0],
    });
  }

  uploadAvatar() {
    if (this.state.avatar === null) {
      return;
    }
    let redirectUrl = window.location.href.substring(
      0,
      window.location.href.lastIndexOf("?")
    );

    Tools.uploadAvatar(this.state.avatar, redirectUrl);
  }

  changeSuccess() {
    this.setState({
      showSuccess: !this.state.showSuccess,
    });
  }

  submitNewUsername() {
    let newUsername = document.getElementById("new-username").value;
    AccountBackend.resetUsername(newUsername).then((res) => {
      if (res.status === "ok") {
        alert(i18next.t("setting:Username has been set"));
        window.location.href = Auth.getSigninUrl();
      } else {
        alert(res.msg);
      }
    });
  }

  renderSettingList(item) {
    return (
      <Link
        to={`/settings/${item.value}`}
        className={this.state.event === item.value ? "tab_current" : "tab"}
      >
        {i18next.t(`setting:${item.label}`)}
      </Link>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="page-content-header">
          <img
            src={Setting.getStatic("/static/img/settings.png")}
            width="64"
            alt="Settings"
          />
          <h2>{i18next.t("setting:Settings")}</h2>
        </div>
        <div className="cell">
          {this.state.Setting_LIST.map((item) => {
            return this.renderSettingList(item);
          })}
        </div>
        {this.state.showSuccess ? (
          <div className="message" onClick={() => this.changeSuccess()}>
            <li className="fa fa-exclamation-triangle"></li>
            &nbsp;{" "}
            {this.state.event === "profile"
              ? i18next.t("setting:Settings have been successfully saved")
              : null}
            {this.state.event === "avatar"
              ? i18next.t("setting:New avatar set successfully")
              : null}
            {this.state.event === "forum"
              ? i18next.t("setting:Change forum setting successfully")
              : null}
          </div>
        ) : null}
      </div>
    );
  }

  renderRadio() {
    if (this.props.account === undefined) {
      return;
    }

    return (
      <td width="auto" align="left">
        <input
          type="radio"
          onClick={() => this.setState({ emailReminder: true })}
          defaultChecked={this.props.account?.emailReminder}
          name="reminder"
        />
        {i18next.t("setting:Open")}{" "}
        <input
          type="radio"
          onClick={() => this.setState({ emailReminder: false })}
          defaultChecked={!this.props.account?.emailReminder}
          name="reminder"
        />
        {i18next.t("setting:Close")}
      </td>
    );
  }

  renderAccountOptions(accountType) {
    return null;
  }

  render() {
    const account = this.props.account;
    const pcBrowser = Setting.PcBrowser;

    if (this.state.event === "username") {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to="/settings">{i18next.t("setting:Settings")}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("setting:Set Username")}
          </div>
          <div className="cell">
            <div className="topic_content">
              {i18next.t("setting:Welcome to")} {Setting.getForumName()}{" "}
              {i18next.t("setting:, you just registered your")}{" "}
              {Setting.getForumName()}{" "}
              {i18next.t(
                "setting:account. Now please set a username here, you can only use half-width English letters and numbers. Other users can send you a message through @ your account name. The user name cannot be changed after setting."
              )}
            </div>
          </div>
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:Username")}
                  </td>
                  <td width="auto" align="left">
                    <input
                      type="text"
                      className="sl"
                      name="username"
                      onChange={this.handleUsernameChange.bind(this)}
                      autoComplete="off"
                    />
                  </td>
                </tr>
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:Password")}
                  </td>
                  <td width="auto" align="left">
                    <input
                      type="password"
                      className="sl"
                      name="password"
                      onChange={this.handlePasswordChange.bind(this)}
                      autoComplete="off"
                    />
                  </td>
                </tr>
                <tr>
                  <td width="120" align="right"></td>
                  <td width="auto" align="left">
                    <input type="hidden" />
                    <input
                      type="submit"
                      className="super normal button"
                      onClick={this.postUsername}
                      value={i18next.t("setting:save")}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (this.state.event === "avatar") {
      return (
        <div>
          {this.renderHeader()}
          <div className="box" data-select2-id="11">
            <div className="cell">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("setting:Current avatar")}
                    </td>
                    <td width="auto" align="left">
                      <Avatar
                        username={this.props.account?.username}
                        avatar={this.props.account?.avatar}
                        size={"large"}
                      />{" "}
                      &nbsp;{" "}
                      <Avatar
                        username={this.props.account?.username}
                        avatar={this.props.account?.avatar}
                      />{" "}
                      &nbsp;{" "}
                      <Avatar
                        username={this.props.account?.username}
                        avatar={this.props.account?.avatar}
                        size={"small"}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("setting:Choose a picture file")}
                    </td>
                    <td width="auto" align="left">
                      <input
                        type="file"
                        accept=".jpg,.gif,.png,.JPG,.GIF,.PNG"
                        onChange={(event) => this.handleChangeAvatar(event)}
                        name="avatar"
                        style={{ width: "200px" }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      <span className="gray">
                        {i18next.t(
                          "setting:Support PNG / JPG / GIF files within 2MB"
                        )}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      <input type="hidden" name="once" />
                      <input
                        type="submit"
                        className="super normal button"
                        onClick={() => this.uploadAvatar()}
                        value={i18next.t("setting:Upload")}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="inner markdown_body">
              <p>{i18next.t("setting:Rules and recommendations on avatars")}</p>
              <ul>
                <li>
                  {Setting.getForumName()}{" "}
                  {i18next.t(
                    "setting:It is forbidden to use any vulgar or sensitive pictures as avatars"
                  )}
                </li>
                <li>
                  {i18next.t(
                    "setting:If you are a man, please do not use a woman’s photo as your avatar, as this may mislead other members"
                  )}
                </li>
                <li>
                  {Setting.getForumName()}{" "}
                  {i18next.t(
                    "setting:It is recommended that you do not use real person photos as avatars, even photos of yourself. The use of other people’s photos is prohibited"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.event === "forum") {
      return (
        <div>
          {this.renderHeader()}
          <div className="box" data-select2-id="11">
            <div className="cell">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("setting:Email Reminder")}
                    </td>
                    {this.renderRadio()}
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      <input type="hidden" name="once" />
                      <input
                        type="submit"
                        className="super normal button"
                        onClick={() => this.updateMemberEmailReminder()}
                        value={i18next.t("setting:Save Settings")}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="inner markdown_body">
              <p>{i18next.t("setting:Description on email reminder")}</p>
              <ul>
                <li>
                  {Setting.getForumName()}{" "}
                  {i18next.t(
                    "setting:Will send you a email when you receive a new reply"
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {this.renderHeader()}
        <div className="inner box" data-select2-id="11">
          <table
            cellPadding="5"
            cellSpacing="0"
            border="0"
            width="100%"
            data-select2-id="9"
          >
            <tbody data-select2-id="8">
              <tr>
                <td width="120" align="right">
                  <Avatar
                    username={account?.username}
                    size="small"
                    avatar={account?.avatar}
                  />
                </td>
                <td width="auto" align="left">
                  {Setting.getForumName()} {i18next.t("member:No.")}{" "}
                  {account?.no} {i18next.t("member:member")}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Username")}
                </td>
                <td width="auto" align="left">
                  {account?.username}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:New Username")}
                </td>
                <td>
                  <input
                    type="text"
                    className="sl"
                    name="company"
                    defaultValue={account?.company}
                    maxLength="32"
                    id="new-username"
                  />
                </td>
              </tr>
              <tr>
                <td />
                <td width="auto" align="left">
                  <input
                    type="submit"
                    className="super normal button"
                    value={i18next.t("setting:Save Username")}
                    onClick={this.submitNewUsername}
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Phone")}
                </td>
                {account?.phone.length === 0 ? (
                  <td width="auto" align="left">
                    <span className="negative">
                      {i18next.t("setting:Phone not verified")}
                    </span>
                  </td>
                ) : (
                  <td width="auto" align="left">
                    <code>
                      {account?.areaCode} {account?.phone}
                    </code>
                  </td>
                )}
              </tr>
              {account?.phoneVerifiedTime.length !== 0 ? (
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:Phone Verification")}
                  </td>
                  <td width="auto" align="left">
                    <span className="green">
                      {i18next.t("setting:Verified on")}{" "}
                      {Setting.getFormattedDate(account?.phoneVerifiedTime)}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td width="120" align="right" />
                  <td width="auto" align="left">
                    <Link to="/settings/phone">
                      {i18next.t("setting:Modify Phone")}
                    </Link>
                  </td>
                </tr>
              )}
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Email")}
                </td>
                {account?.email.length === 0 ? (
                  <td width="auto" align="left">
                    <span className="negative">
                      {i18next.t("setting:Email not verified")}
                    </span>
                  </td>
                ) : (
                  <td width="auto" align="left">
                    <code>{account?.email}</code>
                  </td>
                )}
              </tr>
              {account?.emailVerifiedTime.length !== 0 ? (
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:Email Verification")}
                  </td>
                  <td width="auto" align="left">
                    <span className="green">
                      {i18next.t("setting:Verified on")}{" "}
                      {Setting.getFormattedDate(account?.emailVerifiedTime)}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td width="120" align="right" />
                  <td width="auto" align="left">
                    <Link to="/settings/email">
                      {i18next.t("setting:Modify Email")}
                    </Link>
                  </td>
                </tr>
              )}
              {Conf.GoogleClientId !== "" ? (
                <tr>
                  <td width="120" align="right">
                    Google
                  </td>
                  {account?.googleAccount === "" ? (
                    <td width="auto" align="left">
                      <a
                        onClick={() => Setting.getGoogleAuthCode("link")}
                        href="javascript:void(0);"
                      >
                        {i18next.t("setting:Link with GoogleAccount")}
                      </a>
                    </td>
                  ) : (
                    <td width="auto" align="left">
                      <code>{account?.googleAccount}</code>
                    </td>
                  )}
                </tr>
              ) : null}
              {account?.googleAccount !== "" && Conf.GoogleClientId !== ""
                ? this.renderAccountOptions("google")
                : null}
              {Conf.GithubClientId !== "" ? (
                <tr>
                  <td width="120" align="right">
                    Github
                  </td>
                  {account?.githubAccount === "" ? (
                    <td width="auto" align="left">
                      <a
                        onClick={() => Setting.getGithubAuthCode("link")}
                        href="javascript:void(0);"
                      >
                        {i18next.t("setting:Link with GithubAccount")}
                      </a>
                    </td>
                  ) : (
                    <td width="auto" align="left">
                      <code>{account?.githubAccount}</code>
                    </td>
                  )}
                </tr>
              ) : null}
              {account?.githubAccount !== "" && Conf.GithubClientId !== ""
                ? this.renderAccountOptions("github")
                : null}
              {Conf.WechatClientId !== "" ? (
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:WeChat")}
                  </td>
                  {account?.weChatAccount === "" ? (
                    <td width="auto" align="left">
                      <a
                        onClick={() => Setting.getWeChatAuthCode("link")}
                        href="javascript:void(0);"
                      >
                        {i18next.t("setting:Link with WeChat")}
                      </a>
                    </td>
                  ) : (
                    <td width="auto" align="left">
                      <code>{account?.weChatAccount}</code>
                    </td>
                  )}
                </tr>
              ) : null}
              {account?.WechatVerifiedTime.length !== 0 ? (
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:WeChat Verification")}
                  </td>
                  <td width="auto" align="left">
                    <span className="green">
                      {i18next.t("setting:Verified on")}{" "}
                      {Setting.getFormattedDate(account?.WechatVerifiedTime)}
                    </span>
                  </td>
                </tr>
              ) : null}
              {account?.weChatAccount !== "" && Conf.WechatClientId !== ""
                ? this.renderAccountOptions("wechat")
                : null}
              {Conf.QQClientId !== "" ? (
                <tr>
                  <td width="120" align="right">
                    QQ
                  </td>
                  {account?.qqAccount === "" ? (
                    <td width="auto" align="left">
                      <a
                        onClick={() => Setting.getQQAuthCode("link")}
                        href="javascript:void(0);"
                      >
                        {i18next.t("setting:Link with QQAccount")}
                      </a>
                    </td>
                  ) : (
                    <td width="auto" align="left">
                      <code>{account?.qqAccount}</code>
                    </td>
                  )}
                </tr>
              ) : null}
              {account?.qqVerifiedTime.length !== 0 ? (
                <tr>
                  <td width="120" align="right">
                    {i18next.t("setting:QQ Verification")}
                  </td>
                  <td width="auto" align="left">
                    <span className="green">
                      {i18next.t("setting:Verified on")}{" "}
                      {Setting.getFormattedDate(account?.qqVerifiedTime)}
                    </span>
                  </td>
                </tr>
              ) : null}
              {account?.qqAccount !== "" && Conf.QQClientId !== ""
                ? this.renderAccountOptions("qq")
                : null}
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Website")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="website"
                    defaultValue={account?.website}
                    onChange={(event) =>
                      this.updateFormField("website", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Company")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="company"
                    defaultValue={account?.company}
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("company", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Company title")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="companyTitle"
                    defaultValue={account?.companyTitle}
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("companyTitle", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Location")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="location"
                    defaultValue={account?.location}
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("location", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Tagline")}
                </td>
                <td width="auto" align="left">
                  <input
                    type="text"
                    className="sl"
                    name="tagline"
                    defaultValue={account?.tagline}
                    maxLength="32"
                    onChange={(event) =>
                      this.updateFormField("tagline", event.target.value)
                    }
                    autoComplete="off"
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("setting:Bio")}
                </td>
                <td width="auto" align="left">
                  <textarea
                    className="ml"
                    name="bio"
                    defaultValue={account?.bio}
                    onChange={(event) =>
                      this.updateFormField("bio", event.target.value)
                    }
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <input type="hidden" value="26304" name="once" />
                  <input
                    type="submit"
                    className="super normal button"
                    value={i18next.t("setting:Save Settings")}
                    onClick={this.publishInfoUpdate.bind(this)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(SettingsBox);
