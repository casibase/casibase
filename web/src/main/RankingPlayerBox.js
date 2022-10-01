// Copyright 2022 The casbin Authors. All Rights Reserved.
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

import {Link, withRouter} from "react-router-dom";
import React from "react";
import i18next from "i18next";
import * as Setting from "../Setting";
import Avatar from "../Avatar";
import * as MemberBackend from "../backend/MemberBackend";
import {Helmet} from "react-helmet";

class RankingPlayerBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerList: undefined,
    };
  }

  componentDidMount() {
    MemberBackend.getRankingPlayerList().then((res) => {
      this.setState({
        playerList: res.data,
      });
    });
  }

  renderPlayerBox(karma) {
    return (
      <div className="balance_area" style={{fontSize: "24px", lineHeight: "24px", width: "70%", background: "#f5f5f5"}}>
        ${karma}
      </div>
    );
  }

  render() {
    return (
      <div className="box">
        <Helmet>
          <title>{i18next.t("balance:Consumption ranking")}</title>
          <meta name="keywords" content={Setting.getForumName()} />
        </Helmet>
        <div className="cell">
          <div className="fr" style={{margin: "-1px -8px 0px 0px"}}>
            <Link to="/top/rich" className="tab">
              {i18next.t("balance:Wealth ranking")}
            </Link>
            <Link to="/top/player" className="tab">
              {i18next.t("balance:Consumption ranking")}
            </Link>
            <Link to="/balance/add/alipay" className="tab">
              {i18next.t("balance:Recharge")}
            </Link>
          </div>
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("balance:Consumption ranking")}
        </div>
        {/* playerList */}
        <div className="inner">
          <table cellPadding="10" cellSpacing="0" border="0" width="100%">
            {this.state.playerList
              ? this.state.playerList.map((member, key) => (
                <tr key={key}>
                  <td width={Setting.PcBrowser ? "65" : "36"} valign="top" align="center" key={key}>
                    <Avatar username={member.name} avatar={member.avatar} key={key} />
                  </td>
                  <td width="auto" align="left">
                    <h2 style={{marginBottom: "10px", marginTop: "0px", fontSize: "20px"}}>
                      <span className="gray">{key + 1}.</span> <a href={`/member/${member.name}`}>{member.name}</a>
                    </h2>
                    <div className="sep5"></div>
                    <span className="gray f12">
                      {" "}
                      <a>{member.bio}</a>{" "}
                    </span>
                    <div className="sep5"></div>
                    <span className="gray f12">
                      {" "}
                      <a href={member.homepage}>{member.homepage}</a>{" "}
                    </span>
                    <div className="sep5"></div>
                    <span style={{fontSize: "18px", color: "#bbbbbb"}}>
                      {i18next.t("member:No.")}&nbsp;{member.ranking}&nbsp;{i18next.t("member:member")}
                    </span>
                    <div className="sep5"></div>
                  </td>
                  <td width="200px" align="center">
                    <div className="sep20"></div>
                    <div>{this.renderPlayerBox(member.karma)}</div>
                  </td>
                </tr>
              ))
              : null}
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(RankingPlayerBox);
