// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import {Link} from "react-router-dom";
import i18next from "i18next";

class UserLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    if (this.props.username === "" || this.props.username === "客人") {
      return <span className={`${this.props.classNameText}`}>{i18next.t("general:Anonymous")}</span>;
    }

    return (
      <Link to={`/member/${this.props.username}`} className={`${this.props.classNameText}`}>
        {this.props.username}
      </Link>
    );
  }
}

export default UserLink;
