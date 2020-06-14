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

class SettingsBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      member: null,
    };
  }

  render() {
    const account = this.props.account;

    return (
      <div className="box">
        <Header item="Settings" />
        <div className="inner" data-select2-id="11">
          <form method="post" action="/settings" data-select2-id="10">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%" data-select2-id="9">
              <tbody data-select2-id="8">
              <tr>
                <td width="120" align="right">
                  <Avatar username={account?.id} size="small" />
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
                  Website
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="website" value={account?.website} autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Company
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="company" value={account?.company} maxLength="32" autoComplete="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Bio
                </td>
                <td width="auto" align="left">
                  <textarea className="ml" name="bio">
                    {account?.bio}
                  </textarea>
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <input type="hidden" value="26304" name="once" />
                  <input type="submit" className="super normal button" value="Save Settings" />
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

export default SettingsBox;
