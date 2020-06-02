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
import Header from "./Header";

class SigninBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    return (
      <div className="box">
        <Header item="Sign In" />
        <div className="message" onClick="$(this).slideUp('fast');">
          <li className="fa fa-exclamation-triangle" />
          &nbsp; You need to sign in to view this page
        </div>
        <div className="cell">
          <form method="post" action="/signin">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
              <tr>
                <td width="120" align="right">
                  Username
                </td>
                <td width="auto" align="left">
                  <input type="text" className="sl" name="bb314296f3630dff0bcb01b1bef726e0f7e13736b5750e9206422f3c511ce41e" value="" autoFocus="autofocus" autoCorrect="off" spellCheck="false" autoCapitalize="off" placeholder="Username or Email address" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  Password
                </td>
                <td width="auto" align="left">
                  <input type="password" className="sl" name="d35d522d8b944ccbde14208cb8da6f72c23c101c43ac1e6bbd7593ed8268f276" value="" autoCorrect="off" spellCheck="false" autoCapitalize="off" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right">Are you a bot?</td>
                <td width="auto" align="left">
                  <div style={{"backgroundImage":"url('/_captcha?once=83861')", "backgroundRepeat":"no-repeat", "width":"320px", "height":"80px", "borderRadius":"3px", "border":"1px solid #ccc"}} />
                  <div className="sep10" />
                  <input type="text" className="sl" name="2b49b9b98de15817b6a6e2b29de34cb0282aac1d697b8c38563434901728343b" value="" autoCorrect="off" spellCheck="false" autoCapitalize="off" placeholder="Please input the captcha" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <input type="hidden" value="83861" name="once" />
                  <input type="submit" className="super normal button" value="Sign In" />
                </td>
              </tr>
              <tr>
                <td width="120" align="right" />
                <td width="auto" align="left">
                  <a href="/forgot">
                    I forgot the password
                  </a>
                </td>
              </tr>
              </tbody>
            </table>
            <input type="hidden" value="https://v2ex.com/signup" name="next" />
          </form>
        </div>
      </div>
    );
  }
}

export default SigninBox;
