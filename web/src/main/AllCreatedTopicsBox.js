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
import * as Setting from "../Setting";
import * as TopicBackend from "../backend/TopicBackend";
import { withRouter, Link } from "react-router-dom";
import LatestReplyBox from "./LatestReplyBox";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
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
      member: [],
      url: "",
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }
    if (this.state.tab === undefined) {
      this.state.limit = 10;
    }
  }

  componentDidMount() {
    this.getAllCreatedTopics();
    this.geCreatedTopicsNum();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      let params = new URLSearchParams(newProps.location.search);
      let page = params.get("p");
      if (page === null) {
        page = 1;
      }
      this.setState(
        {
          page: parseInt(page),
          memberId: newProps.match.params.memberId,
        },
        () => {
          this.getAllCreatedTopics();
          this.geCreatedTopicsNum();
        }
      );
    }
  }

  getAllCreatedTopics() {
    var selectTab = this.props.match.params.tab;
    if (selectTab === undefined) {
      selectTab = "all";
    }
    TopicBackend.getAllCreatedTopics(this.state.memberId, selectTab, this.state.limit, this.state.page).then((res) => {
      this.setState({
        topics: res,
        tab: this.props.match.params.tab,
      });
    });
  }

  geCreatedTopicsNum() {
    if (this.state.tab === undefined) {
      return;
    }

    TopicBackend.getCreatedTopicsNum(this.state.memberId).then((res) => {
      this.setState({
        topicsNum: res,
      });
    });
  }

  showPageColumn(url) {
    if (this.state.topicsNum < this.state.limit) {
      return;
    }

    return <PageColumn page={this.state.page} total={this.state.topicsNum} url={url} defaultPageNum={this.state.limit} />;
  }

  changeTab = () => {
    console.log(this);
    this.props.changeTab(this.state.tab);
  };

  render() {
    const pcBrowser = Setting.PcBrowser;
    this.changeTab();
    let isMemberTab = this.state.tab === undefined || this.state.tab === "all";

    if (this.props.member === null) {
      return null;
    }

    if (this.state.tab === "replies") {
      if (this.state.member === null) {
        this.props.history.push(`/member/${this.state.memberId}`);
      }

      if (this.state.member.name) document.title = `${this.state.member.name}${i18next.t("member:'s more replies")} - ${Setting.getForumName()}`;
      return <LatestReplyBox size={"large"} />;
    }

    if (this.state.tab === "topics") {
      if (this.state.member === null) {
        this.props.history.push(`/member/${this.state.memberId}`);
      }

      if (this.state.member.name) document.title = `${this.state.member.name}${i18next.t("member:'s more topics")} - ${Setting.getForumName()}`;

      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()} </Link>
            <span className="chevron">&nbsp;›&nbsp;</span>
            <Link to={`/member/${this.state.memberId}`}> {this.state.memberId}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("member:All Topics")}
            <div className="fr f12">
              <span className="snow">{i18next.t("member:Total Topics")}&nbsp;</span> <strong className="gray">{this.state.topicsNum}</strong>
            </div>
          </div>
          {pcBrowser ? this.showPageColumn(`/member/${this.state.memberId}/topics`) : null}
          <TopicList topics={this.state.topics} showNodeName={true} showAvatar={false} />
          {this.showPageColumn(`/member/${this.state.memberId}/topics`)}
        </div>
      );
    }

    return (
      <div className="box">
        <TopicList topics={this.state.topics} showNodeName={true} showAvatar={false} timeStandard={"createdTime"} />
        {isMemberTab ? (
          <div className="inner">
            <span className="chevron">»</span>
            <Link to={`/member/${this.state.memberId}/topics`}> {`${this.state.memberId}${i18next.t("member:'s more topics")}`} </Link>
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(AllCreatedTopicsBox);
