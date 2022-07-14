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
import {Link} from "react-router-dom";
import * as Setting from "./Setting";
import * as Conf from "./Conf";

class Avatar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    let style;
    switch (this.props.size) {
      case "small":
        style = {width: "24px", height: "24px"};
        break;
      case "middle":
        style = {width: "36px", height: "36px"};
        break;
      case "large":
        style = {width: "73px", height: "73px"};
        break;
      default:
        style = {width: "48px", height: "48px"};
        break;
    }

    let src;
    if (this.props.avatar !== "") {
      src = this.props.avatar;
    } else {
      src = Setting.getUserAvatar(this.props.username);
    }

    if (this.props.username === "" || this.props.username === "客人") {
      return <img src={Conf.AvatarAnonymousUrl} className="avatar" border="0" align="default" style={style} alt={"Anonymous User"} key={this.props.key} />;
    }

    return (
      <Link to={`/member/${this.props.username}`}>
        <img
          src={src}
          className="avatar"
          border="0"
          align="default"
          style={style}
          alt={this.props.username}
          key={this.props.key}
          onError={(event) => {
            event.target.onerror = "";
            event.target.src = Conf.AvatarErrorUrl;
            return true;
          }}
        />
      </Link>
    );
  }
}

export default Avatar;
