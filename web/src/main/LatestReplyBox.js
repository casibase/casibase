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
import * as ReplyBackend from "../backend/ReplyBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
import i18next from "i18next";
import * as MemberBackend from "../backend/MemberBackend";

class LatestReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      memberId: props.match.params.memberId,
      p: "",
      page: 1,
      limit: 20,
      minPage: 1,
      maxPage: -1,
      repliesNum: 10,
      replies: [],
      member: null,
      url: "",
    };
    if (this.props.limit !== undefined) {
      this.state.limit = this.props.limit
    }
    const params = new URLSearchParams(this.props.location.search)
    this.state.p = params.get("p")
    if (this.state.p === null) {
      this.state.page = 1
    }else {
      this.state.page = parseInt(this.state.p)
    }
  
    this.state.url = `/member/${this.state.memberId}/replies`
  }

  componentDidMount() {
    this.getLatestReplies();
    this.getRepliesNum();
    this.getMember();
  }

  getMember() {
    MemberBackend.getMember(this.state.memberId)
      .then((res) => {
        this.setState({
          member: res,
        });
      });
  }

  getLatestReplies() {
    ReplyBackend.getLatestReplies(this.state.memberId, this.state.limit, this.state.page)
      .then((res) => {
        this.setState({
          replies: res,
        });
      });
  }

  getRepliesNum() {
    ReplyBackend.getRepliesNum(this.state.memberId)
      .then((res) => {
        this.setState({
          repliesNum: res,
        });
      });
  }

  showPageColumn() {
    if (this.state.repliesNum === 10) {
      return
    }
    return (
      <PageColumn page={this.state.page} total={this.state.repliesNum} url={this.state.url}/>
    )
  }

  renderReplies(reply) {
    return (
      <div>
        <div className="dock_area">
          <table cellPadding="0" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td style={{padding: "10px 15px 8px 15px", fontSize: "12px", textAlign: "left"}}>
                  <div className="fr"><span className="fade">{Setting.getPrettyDate(reply.replyTime)}</span></div>
                  <span className="gray">{i18next.t("member:replied")}{" "}<a href={`/member/${reply.author}`}> {reply.author} </a>{" "}{i18next.t("member:'s topic")}{" "}<span
                    className="chevron">›</span> <a href={`/go/${reply.nodeId}`}>{" "}{reply.nodeName}{" "}</a>
                    <span className="chevron">›</span> <a href={`/t/${reply.topicId}`}>{" "}{reply.topicTitle}{" "}</a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="inner">
          <div className="reply_content">
            <span dangerouslySetInnerHTML={{__html: reply.replyContent}} />
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.member === null) {
      return null
    }

    if (this.props.size === "large") {
      return (
        <div className="box">
          <div className="header">
            <a href="/">{Setting.getForumName()} </a>
            <span className="chevron">&nbsp;›&nbsp;</span>
            <a href={`/member/${this.state.memberId}`}> {this.state.memberId}</a> <span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("member:All Replies")}
            <div className="fr f12"><span className="snow">{i18next.t("member:Total Replies")}&nbsp;</span> <strong className="gray">{this.state.repliesNum}</strong></div>
          </div>
          
          {this.showPageColumn()}
          {
            this.state.replies?.map((reply) => {
              return this.renderReplies(reply);
            })
          }
          {this.showPageColumn()}
        </div>
      );
    }

    return (
      <div className="box">
        <div className="cell"><span className="gray">{`${this.state.memberId}${i18next.t("member:'s latest replies")}`}</span></div>
        {
          this.state.replies?.map((reply) => {
            return this.renderReplies(reply);
          })
        }
        <div className="inner">
          <span className="chevron">»</span> <a href={`/member/${this.state.memberId}/replies`}>{`${this.state.memberId}${i18next.t("member:'s more replies")}`}</a></div>
      </div>
    );
  }
}

export default withRouter(LatestReplyBox);
