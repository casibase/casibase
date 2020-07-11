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
import * as Conf from "../Conf"

class SignupBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      code: ""
    };
  }

  getGoogleAuthCode() {
    window.location.href=`${Conf.GoogleOauthUri}?client_id=${Conf.GoogleClientId}&redirect_uri=${Setting.ClientUrl}/callback/google&scope=${Conf.GoogleAuthScope}&response_type=code&state=${Conf.GoogleAuthState}`
  }

  getGithubAuthCode() {
    window.location.href=`${Conf.GithubOauthUri}?client_id=${Conf.GithubClientId}&redirect_uri=${Setting.ClientUrl}/callback/github&scope=${Conf.GithubAuthScope}&response_type=code&state=${Conf.GithubAuthState}`
  }

  render() {
    return (
      <div className="box">
        <Header item="Sign Up" />
        <div className="cell">
          <div className="topic_content markdown_body">
            <p>{`Welcome to ${Setting.getForumName()}, this is the official forum for Casbin developers and users.`}</p>
            <p>You can use the following ways to sign up as a new user:</p>
            <p>If you have previously signed up an account via Email, please click: <a href="/signin">here</a> to sign in.</p>
          </div>
        </div>
        <div className="dock_area">
          <div className="signup_methods">
            <div className="signup_method" onClick={() => Setting.getGoogleAuthCode("signup")}>
              <div className="signup_method_icon signup_method_google"></div>
              <div className="signup_method_label">Continue with Google</div>
            </div>
            <div className="signup_method" onClick={() => Setting.getGithubAuthCode("signup")}>
              <div className="signup_method_icon signup_method_github"></div>
              <div className="signup_method_label">Continue with Github</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SignupBox;
