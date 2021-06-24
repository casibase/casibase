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
import * as BalanceBackend from "../backend/BalanceBackend";
import { withRouter, Link } from "react-router-dom";
import i18next from "i18next";

class CheckinBonusBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      checkinBonusStatus: false,
      date: null,
      showSuccess: false,
    };
  }

  componentDidMount() {
    this.getCheckinBonusStatus();
  }

  getCheckinBonusStatus() {
    BalanceBackend.getCheckinBonusStatus().then((res) => {
      this.setState({
        checkinBonusStatus: res.data,
        date: res.data2,
      });
    });
  }

  getDailyCheckinBonus() {
    BalanceBackend.getCheckinBonus().then((res) => {
      if (res.status !== "ok") {
        Setting.showMessage("error", res.msg);
      } else {
        this.setState({
          checkinBonusStatus: true,
          showSuccess: true,
        });
      }
    });
  }

  changeSuccessStatus() {
    this.setState({
      showSuccess: !this.state.showSuccess,
    });
  }

  render() {
    if (this.state.checkinBonusStatus) {
      return (
        <div className="box">
          <div className="cell">
            <Link to="/">{Setting.getForumName()}</Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            {i18next.t("mission:Daily tasks")}
          </div>
          {this.state.showSuccess ? (
            <div className="message" onClick={() => this.changeSuccessStatus()}>
              <li className="fa fa-exclamation-triangle"></li>
              &nbsp;{" "}
              {i18next.t("mission:Successfully received daily checkin bonus")}
            </div>
          ) : null}
          <div className="cell">
            <span className="gray">
              <li className="fa fa-ok-sign" style={{ color: "#0c0" }}></li>{" "}
              &nbsp;
              {i18next.t("mission:Daily checkin bonus has been received")}
            </span>
            <div className="sep10"></div>
            <input
              type="button"
              className="super normal button"
              value={i18next.t("mission:Check my account balance")}
              onClick={() => (window.location.href = "/balance")}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="box">
        <div className="cell">
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          {i18next.t("mission:Daily tasks")}
        </div>
        <div className="cell">
          <h1>
            {i18next.t("mission:Daily checkin bonus")} {this.state.date}
          </h1>
          <input
            type="button"
            className="super normal button"
            value={i18next.t("mission:Receive X copper coins")}
            onClick={() => this.getDailyCheckinBonus()}
          />
        </div>
        <div className="cell">
          {i18next.t("mission:Logged in continuously")} 1{" "}
          {i18next.t("mission:Successfully received daily checkin bonus")}
        </div>
      </div>
    );
  }
}

export default withRouter(CheckinBonusBox);
