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
import * as TopicBackend from "../backend/TopicBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import LatestReplyBox from "./LatestReplyBox";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
import * as MemberBackend from "../backend/MemberBackend";
import i18next from "i18next";

class AllCreatedTopicsBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      memberId: props.match.params.memberId,
      tab: props.match.params.tab,
      topics: [],
      limit: 20,
      p: "",
      page: 1,
      minPage: 1,
      maxPage: -1,
      topicsNum: 1,
      temp: 0,
      member: null,
      url: "",
      TAB_LIST: [
        {label: "Q&A", value: "qna"},
        {label: "Tech", value: "tech"},
        {label: "Play", value: "play"},
        {label: "Jobs", value: "jobs"},
        {label: "Deals", value: "deals"},
        {label: "City", value: "city"}
      ]
    };
    const params = new URLSearchParams(this.props.location.search)
    this.state.p = params.get("p")
    if (this.state.p === null) {
      this.state.page = 1
    }else {
      this.state.page = parseInt(this.state.p)
    }
    if (this.state.tab === undefined) {
      this.state.limit = 10
    }
  }

  componentDidMount() {
      this.getAllCreatedTopics();
      this.geCreatedTopicsNum();
      this.getMemberAvatar();
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

  getMemberAvatar() {
    MemberBackend.getMemberAvatar(this.state.memberId)
      .then((res) => {
        this.setState({
          memberAvatar: res,
        });
      });
  }

  getAllCreatedTopics() {
    TopicBackend.getAllCreatedTopics(this.state.memberId, this.state.tab, this.state.limit, this.state.page)
      .then((res) => {
        this.setState({
          topics: res,
        });
      });
  }

  geCreatedTopicsNum() {
    TopicBackend.getCreatedTopicsNum(this.state.memberId)
      .then((res) => {
        this.setState({
          topicsNum: res,
        });
      });
  }

  renderTab(tab) {
    return (
      {
        ...this.state.tab === tab.value ?
          <a href={`/member/${this.state.memberId}/${tab.value}`} class="cell_tab_current"> {tab.label} </a> :
          <a href={`/member/${this.state.memberId}/${tab.value}`} class="cell_tab"> {tab.label} </a>
      }
    )
  }

  showPageColumn(url) {
    if (this.state.topicsNum === 1) {
      return
    }
    return (
      <PageColumn page={this.state.page} total={this.state.topicsNum} url={url}/>
    )
  }

  render() {
    if (this.state.member === null) {
      return null
    }

    {
      if (this.state.tab === "replies") {
        return (
          <LatestReplyBox size={"large"} />
        );
      }
    }
    {
      if (this.state.tab === "topics") {
        {
          return (
            <div className="box">
              <div className="header">
                <a href="/">{Setting.getForumName()} </a>
                <span className="chevron">&nbsp;›&nbsp;</span>
                <a href={`/member/${this.state.memberId}`}> {this.state.memberId}</a> <span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("member:All Topics")}
                <div className="fr f12"><span className="snow">{i18next.t("member:Total Topics")}&nbsp;</span> <strong className="gray">{this.state.topicsNum}</strong></div>
              </div>
      
              {this.showPageColumn(`/member/${this.state.memberId}/topics`)}
              <TopicList topics={this.state.topics} showNodeName={true} showAvatar={false} />
              {this.showPageColumn(`/member/${this.state.memberId}/topics`)}
            </div>
          );
        }
      }
    }
    return (
      <div className="box">
        <div class="cell_tabs">
          <div class="fl">
            {
              this.state.memberAvatar === "" ?
                <img src={Setting.getUserAvatar(this.state.memberId)} width={24} border={0} style={{borderRadius: "24px", marginTop: "-2px"}}/> :
                <img src={this.state.memberAvatar} width={24} border={0} style={{borderRadius: "24px", marginTop: "-2px"}}/>
            }
          </div>
          {
            this.state.tab === undefined ?
              <a href={`/member/${this.state.memberId}`} class="cell_tab_current"> {`${this.state.memberId}${i18next.t("member:'s all topics")}`} </a> :
              <a href={`/member/${this.state.memberId}`} class="cell_tab"> {`${this.state.memberId}${i18next.t("member:'s all topics")}`} </a>
          }
          {
            this.state.TAB_LIST.map((tab) => {
              return this.renderTab(tab);
              })
          }
        </div>
        <TopicList topics={this.state.topics} showNodeName={true} showAvatar={false} timeStandard={"createdTime"} />
        {
          this.state.tab === undefined ?
            <div className="inner"><span className="chevron">»</span>
              <a href={`/member/${this.state.memberId}/topics`}> {`${this.state.memberId}${i18next.t("member:'s more topics")}`} </a>
            </div> :
            <div />
        }
      </div>
    );
  }
}

export default withRouter(AllCreatedTopicsBox);
