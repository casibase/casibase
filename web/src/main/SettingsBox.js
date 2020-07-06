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
import Header from "./Header";
import Avatar from "../Avatar";
import {withRouter} from "react-router-dom";
import * as AccountBackend from "../backend/AccountBackend"
import * as MemberBackend from "../backend/MemberBackend";
import '../Reply.css'

class SettingsBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      member: null,
      event: props.match.params.event,
      topics: [],
      username: "",
      form: {},
    };
    this.newUsername = this.newUsername.bind(this);
    this.postUsername = this.postUsername.bind(this);
  }

  componentDidMount() {
    this.initForm()
  }

  initForm() {
    let form = this.state.form;
    form["website"] = this.props.account?.website;
    form["company"] = this.props.account?.company;
    form["bio"] = this.props.account?.bio;
    this.setState({
      form: form,
    });
  }

  newUsername() {
    const params = new URLSearchParams(this.props.location.search)
    let email, method, addition, avatar
    email = params.get("email")
    method = params.get("method")
    addition = params.get("addition")
    avatar = params.get("avatar")
    return {
      username: this.state.username,
      email: email,
      method: method,
      addition: addition,
      avatar: avatar,
    }
  }

  postUsername() {
      const name = this.newUsername();
      AccountBackend.signup(name)
        .then((res) => {
            if (res.status === "ok") {
              Setting.showMessage("success", `Set username success`);
              window.location.href = '/'
            }else {
              Setting.showMessage("error", `Set username failed：${res.msg}`);
            }
          }
        )
        .catch(error => {
          Setting.showMessage("error", `Set username failed：${error}`);
        });
  }

  handelChange(e){
    this.setState({
      username: e.target.value
      })
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  publishInfoUpdate() {
    MemberBackend.updateMemberInfo(this.props.account?.id, this.state.form)
      .then((res) => {
        if (res.status === 'ok') {
          Setting.showMessage("success", `Update memberInfo success`);
        } else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  render() {
    const account = this.props.account;

    if (this.state.event === "username") {
      return (
        <div className="box">
          <div className="header">
            <a href="/">{Setting.getForumName()}</a>
            <span className="chevron">&nbsp;›&nbsp;</span>
            <a href="/settings">Settings</a> <span className="chevron">&nbsp;›&nbsp;</span> Set Username
          </div>
          <div className="cell">
            <div className="topic_content">
              Welcome to Casbin forum, you just registered your Casbin forum account through Google. Now please set a username here, you can only use half-width English letters and numbers. Other users can
              send you a message through @ your account name. The user name cannot be changed after setting.
            </div>
          </div>
          <div className="inner">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tr>
                <td width="120" align="right">Username</td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="username" onChange={this.handelChange.bind(this)} autoComplete="off"/></td>
              </tr>
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left"><input type="hidden"/>
                <input type="submit" className="super normal button" onClick={this.postUsername} value="save"/></td>
              </tr>
            </table>
          </div>
        </div>
      )
    }

    return (
      <div className="box">
        <Header item="Settings" />
        <div className="inner" data-select2-id="11">
          <form data-select2-id="10">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%" data-select2-id="9">
              <tbody data-select2-id="8">
              <tr>
                <td width="120" align="right">
                  <Avatar username={account?.id} size="small" avatar={account?.avatar} />
                </td>
                <td width="auto" align="left">
                  {Setting.getForumName()} No. {account?.no} member
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Username
                </td>
                <td width="auto" align="left">
                  {account?.id}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Phone
                </td>
                <td width="auto" align="left">
                  <code>
                    {account?.phone}
                  </code>
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <a href="/settings/phone">
                    Modify phone
                  </a>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Email
                </td>
                <td width="auto" align="left">
                  <code>
                    {account?.email}
                  </code>
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <a href="/settings/email">
                    Modify Email
                  </a>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Email Verification
                </td>
                <td width="auto" align="left">
                  <span className="green">
                    Verified on {Setting.getFormattedDate(account?.emailVerifiedTime)}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Google
                </td>
                {
                  account?.googleAccount === "" ?
                    <td width="auto" align="left">
                      <a onClick={() => Setting.getGoogleAuthCode("link")} href="javascript:void(0)">
                        Link with GoogleAccount
                      </a>
                    </td> :
                    <td width="auto" align="left">
                      <code>
                        {account?.googleAccount}
                      </code>
                    </td>
                }
              </tr>
              {
                account?.googleAccount === "" ? null :
                  <tr>
                    <td width="120" align="right" />
                    <td width="auto" align="left">
                      <a href="/settings/google">
                        Modify GoogleAccount
                      </a>
                    </td>
                  </tr>
              }
              <tr>
                <td width="120" align="right">
                  Github
                </td>
                {
                  account?.githubAccount === "" ?
                    <td width="auto" align="left">
                      <a onClick={() => Setting.getGithubAuthCode("link")} href="javascript:void(0)">
                        Link with GithubAccount
                      </a>
                    </td> :
                    <td width="auto" align="left">
                      <code>
                        {account?.githubAccount}
                      </code>
                    </td>
                }
              </tr>
              {
                account?.githubAccount === "" ? null :
                  <tr>
                    <td width="120" align="right" />
                    <td width="auto" align="left">
                      <a href="/settings/github">
                        Modify GithubAccount
                      </a>
                    </td>
                  </tr>
              }
              <tr>
                <td width="120" align="right">
                  WeChat
                </td>
                {
                  account?.weChatAccount === "" ?
                    <td width="auto" align="left">
                      <a href="/settings/wechat">
                        Link with WeChat
                      </a>
                    </td> :
                    <td width="auto" align="left">
                      <code>
                        {account?.weChatAccount}
                      </code>
                    </td>
                }
              </tr>
              {
                account?.weChatAccount === "" ? null :
                  <tr>
                    <td width="120" align="right" />
                    <td width="auto" align="left">
                      <a href="/settings/weChat">
                        Modify WeChat
                      </a>
                    </td>
                  </tr>
              }
              <tr>
                <td width="120" align="right">
                  Website
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="website" defaultValue={account?.website} onChange={event => this.updateFormField("website", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Company
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="company" defaultValue={account?.company} maxLength="32" onChange={event => this.updateFormField("company", event.target.value)} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Bio
                </td>
                <td width="auto" align="left">
                  <textarea className="ml" name="bio" defaultValue={account?.bio} onChange={event => this.updateFormField("bio", event.target.value)} />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <input type="hidden" value="26304" name="once" />
                  <input type="submit" className="super normal button" value="Save Settings" onClick={this.publishInfoUpdate.bind(this)} />
                </td>
              </tr>
              </tbody>
            </table>
          </form>
        </div>
      </div>
    );
  }
}

export default withRouter(SettingsBox);
