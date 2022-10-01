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
import {Link, withRouter} from "react-router-dom";
import LatestReplyBox from "./LatestReplyBox";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
import * as MemberBackend from "../backend/MemberBackend";
import i18next from "i18next";
import * as Conf from "../Conf";

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
      TAB_LIST: [
        {label: "Q&A", value: "qna"},
        {label: "Tech", value: "tech"},
        {label: "Play", value: "play"},
        {label: "Jobs", value: "jobs"},
        {label: "Deals", value: "deals"},
        {label: "City", value: "city"},
      ],
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
    this.getMember();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      const params = new URLSearchParams(newProps.location.search);
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

  getMember() {
    if (this.state.tab === undefined) {
      return;
    }

    MemberBackend.getMember(this.state.memberId).then((res) => {
      this.setState({
        member: res.data,
      });
    });
  }

  getAllCreatedTopics() {
    TopicBackend.getAllCreatedTopics(this.state.memberId, this.state.tab, this.state.limit, this.state.page).then((res) => {
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

  renderTab(tab) {
    return {
      ...(this.state.tab === tab.value ? (
        <Link key={tab.value} to={`/member/${this.state.memberId}/${tab.value}`} className="cell_tab_current">
          {" "}
          {tab.label}{" "}
        </Link>
      ) : (
        <Link key={tab.value} to={`/member/${this.state.memberId}/${tab.value}`} className="cell_tab">
          {" "}
          {tab.label}{" "}
        </Link>
      )),
    };
  }

  renderMobileTab() {
    return (
      <div className="fr">
        <label className="f14" htmlFor="switch-topics">
          {i18next.t("member:Switch topic list")}
          <select
            id="switch-topics"
            defaultValue={this.state.tab === undefined ? "all" : this.state.tab}
            onChange={(event) => {
              if (event.target.value === "all") {
                this.props.history.push(`/member/${this.state.memberId}/`);
              } else {
                this.props.history.push(`/member/${this.state.memberId}/${event.target.value}`);
              }
            }}
          >
            <option value="all">
              {this.state.memberId}
              {i18next.t("member:'s all topics")}
            </option>
            {this.state.TAB_LIST.map((tab) => {
              return (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    );
  }

  showPageColumn(url) {
    if (this.state.topicsNum < this.state.limit) {
      return;
    }

    return <PageColumn page={this.state.page} total={this.state.topicsNum} url={url} defaultPageNum={this.state.limit} />;
  }

  render() {
    const pcBrowser = Setting.PcBrowser;

    if (this.props.member === null) {
      return null;
    }

    if (this.state.tab === "replies") {
      if (this.state.member === null) {
        this.props.history.push(`/member/${this.state.memberId}`);
      }

      if (this.state.member.name) {
        document.title = `${this.state.member.name}${i18next.t("member:'s more replies")} - ${Setting.getForumName()}`;
      }
      return <LatestReplyBox size={"large"} />;
    }

    if (this.state.tab === "topics") {
      if (this.state.member === null) {
        this.props.history.push(`/member/${this.state.memberId}`);
      }

      if (this.state.member.name) {
        document.title = `${this.state.member.name}${i18next.t("member:'s more topics")} - ${Setting.getForumName()}`;
      }

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

    let memberAvatar;
    if (this.state.tab === undefined) {
      memberAvatar = this.props.member.avatar;
    } else {
      memberAvatar = this.state.member.avatar;
    }

    return (
      <div className="box">
        <div className="cell_tabs">
          <div className="fl">
            <img
              src={memberAvatar !== "" ? memberAvatar : Setting.getUserAvatar(this.state.memberId)}
              width={24}
              border={0}
              style={{borderRadius: "24px", marginTop: "-2px"}}
              alt={this.state.memberId}
              onError={(event) => {
                event.target.onerror = "";
                event.target.src = Conf.AvatarErrorUrl;
                return true;
              }}
            />
          </div>
          {!pcBrowser ? this.renderMobileTab() : null}
          {pcBrowser ? (
            this.state.tab === undefined ? (
              <Link to={`/member/${this.state.memberId}`} className="cell_tab_current">
                {" "}
                {`${this.state.memberId}${i18next.t("member:'s all created topics")}`}{" "}
              </Link>
            ) : (
              <Link to={`/member/${this.state.memberId}`} className="cell_tab">
                {" "}
                {`${this.state.memberId}${i18next.t("member:'s all created topics")}`}{" "}
              </Link>
            )
          ) : null}
          {!pcBrowser ? <div className="sep10" style={{clear: "both"}} /> : null}
          {pcBrowser
            ? this.state.TAB_LIST.map((tab) => {
              return this.renderTab(tab);
            })
            : null}
        </div>
        <TopicList topics={this.state.topics} showNodeName={true} showAvatar={false} timeStandard={"createdTime"} />
        {this.state.tab === undefined ? (
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
