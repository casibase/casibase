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
import { withRouter, Link } from "react-router-dom";
import React from "react";
import i18next from "i18next";
import Header from "./Header";
import * as Setting from "../Setting";
import Avatar from "../Avatar";
import * as MemberBackend from "../backend/MemberBackend";
import { scoreConverter } from "./Tools";

class RankingRichBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      richList: undefined,
    };
  }

  componentDidMount() {
    MemberBackend.getRankingRichList().then((res) => {
      this.setState({
        richList: res,
      });
    });
  }

  renderRichBox(score) {
    const { goldCount, silverCount, bronzeCount } = scoreConverter(score);
    return (
      <div
        className="balance_area bigger"
        style={{ fontSize: "24px", lineHeight: "24px" }}
      >
        {goldCount}&nbsp;
        <img
          src={Setting.getStatic("/static/img/gold@2x.png")}
          height="16"
          alt="G"
          border="0"
        />
        &nbsp;{silverCount}&nbsp;
        <img
          src={Setting.getStatic("/static/img/silver@2x.png")}
          height="16"
          alt="S"
          border="0"
        />
        &nbsp;{bronzeCount}&nbsp;
        <img
          src={Setting.getStatic("/static/img/bronze@2x.png")}
          height="16"
          alt="B"
          border="0"
        />
      </div>
    );
  }

  render() {
    return (
      <div className="box">
        {/* header */}
        <div className="cell">
          <div className="fr" style={{ margin: "-3px -8px 0px 0px" }}>
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
          <Link to="/">{Setting.getForumName()}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span>{" "}
          {i18next.t("balance:Rich ranking")}
        </div>
        {/* richList */}
        <div className="inner">
          <table cellPadding="10" cellSpacing="0" border="0" width="100%">
            {this.state.richList
              ? this.state.richList.map((member, key) => (
                  <tr>
                    <td
                      width={Setting.PcBrowser ? "73" : "36"}
                      valign="top"
                      align="center"
                      key={key}
                    >
                      <Avatar
                        username={member.id}
                        avatar={member.avatar}
                        key={key}
                      />
                    </td>
                    <td width="auto" align="left">
                      <h2 style={{ marginBottom: "10px", marginTop: "0px" }}>
                        <span class="gray">{key + 1}.</span>{" "}
                        <a href={`/member/${member.id}`}>{member.id}</a>
                      </h2>
                      <span className="gray f12"> {member.tagline} </span>
                      <div className="sep5"></div>
                      <span className="gray f12">
                        {" "}
                        <a href={member.website}>{member.website}</a>{" "}
                      </span>
                      <div className="sep5"></div>
                      {/* <span className="fade">第 n 名会员</span> */}
                    </td>
                    <td width="140" align="center">
                      <div>{this.renderRichBox(member.score)}</div>
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

export default withRouter(RankingRichBox);
