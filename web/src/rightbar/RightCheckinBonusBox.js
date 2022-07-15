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
import * as BalanceBackend from "../backend/BalanceBackend";
import * as Setting from "../Setting";
import {Link} from "react-router-dom";
import "./rightFavourite.css";
import i18next from "i18next";

class RightCheckinBonusBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
    };
  }

  componentDidMount() {
    this.getCheckinBonusStatus();
  }

  getCheckinBonusStatus() {
    BalanceBackend.getCheckinBonusStatus().then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  render() {
    if (this.state.info === null || this.state.info || this.props.account === null || this.props.account === undefined) {
      return null;
    }

    return (
      <span>
        {Setting.PcBrowser ? <div className="sep20" /> : null}
        <div className={`box ${this.props.nodeId}`}>
          <div className={`inner ${this.props.nodeId}`}>
            <li className="fa fa-gift" style={{color: "#f90"}}></li>
            &nbsp;
            <Link to="/mission/daily">{i18next.t("bar:Receive today's checkin bonus")}</Link>
          </div>
        </div>
      </span>
    );
  }
}

export default RightCheckinBonusBox;
