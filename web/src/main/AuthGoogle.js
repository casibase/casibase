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
import * as MemberBackend from "../backend/MemberBackend";
import {withRouter} from "react-router-dom";

class GoogleCallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      state: "",
      code: "",
      isAuthenticated: false,
      isSignedUp: false,
      email: ""
    };
    const params = new URLSearchParams(this.props.location.search)
    this.state.code = params.get("code")
    this.state.state = params.get("state")
  }
  
  getAuthenticatedInfo() {
    let redirectUrl
    redirectUrl = `${Setting.ClientUrl}/GoogleCallback`
    MemberBackend.googleLogin(this.state.code, this.state.state, redirectUrl)
      .then((res) => {
        if (!res.isAuthenticated) {
          window.location.href = '/signup'
          return;
        }
        if (!res.isSignedUp) {
          window.location.href = `/settings/username?email=${res.email}`
          return;
        }
        window.location.href = '/'
      });
  }
  
  componentDidMount() {
    this.getAuthenticatedInfo()
  }
  
  render() {
    return (
      <div>
        <h3>
          Logging in ......
        </h3>
      </div>
    )
  }
}

export default withRouter(GoogleCallback);
  