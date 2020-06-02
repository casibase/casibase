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

class RightSigninBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    return (
      <div className="box">
        <div className="cell">
          <strong>Casbin Forum</strong>
          <div className="sep5" />
          <span className="fade">For Casbin developers and users</span>
        </div>
        <div className="inner">
          <div className="sep5" />
          <div align="center">
            <a href="/signup" className="super normal button">Sign Up</a>
            <div className="sep5" />
            <div className="sep10" />
            Already have account? please: &nbsp;<a href="/signin">Sign In</a>
          </div>
        </div>
      </div>
    );
  }
}

export default RightSigninBox;
