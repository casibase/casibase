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
import * as Setting from "./Setting";
import * as TopicBackend from "./backend/TopicBackend";
import * as TabBackend from "./backend/TabBackend";
import * as NotificationBackend from "./backend/NotificationBackend";
import Avatar from "./Avatar";
import TopicList from "./main/TopicList";
import { withRouter, Link } from "react-router-dom";
import moment from "moment";
import i18next from "i18next";
import { scoreConverter } from "./main/Tools";

class TopicPage extends React.Component {
  constructor(props) {
    super(props);
    const rootTabId = "all"; // should be set as the root tab id
    const lastTabOpen = localStorage.getItem("casnode-lastUsedTab");
    this.state = {
      classes: props,
      topics: [],
      defaultHomePageNum: 50,
      tab: lastTabOpen ? lastTabOpen : rootTabId,
      tabs: [],
      tabInfo: null,
      nodes: [],
    };
    const params = new URLSearchParams(this.props.location.search);
    if (params.get("tab") !== null) {
      this.state.tab = params.get("tab");
    }
  }

  componentDidMount() {
    this.getNodeInfo();
    this.getTopics();
    this.getUnreadNotificationNum();
  }

  getUnreadNotificationNum() {
    if (Setting.PcBrowser) {
      return;
    }

    NotificationBackend.getUnreadNotificationNum().then((res) => {
      this.setState({
        unreadNotificationNum: res?.data,
      });
    });
  }

  changeTab(tab) {
    this.setState(
      {
        tab: tab,
      },
      () => {
        window.history.pushState({}, 0, `/?tab=${this.state.tab}`);
        localStorage.setItem("casnode-lastUsedTab", tab);
        this.getNodeInfo();
        this.getTopics();
      }
    );
  }

  getNodeInfo() {
    let tab;
    TabBackend.getTabs().then((res) => {
      this.setState({
        tabs: res,
      });
    });
    this.state.tab === undefined ? (tab = "") : (tab = this.state.tab);
    TabBackend.getTabWithNode(tab).then((res) => {
      if (res === null) {
        window.location.href = `/`;
      }
      this.setState({
        tabInfo: res?.data,
        nodes: res?.data2,
      });
    });
  }

  getTopics() {
    if (this.state.tab !== undefined) {
      TopicBackend.getTopicsWithTab(
        this.state.tab,
        this.state.defaultHomePageNum,
        1
      ).then((res) => {
        this.setState({
          topics: res,
        });
      });
      return;
    }
    TopicBackend.getTopics(this.state.defaultHomePageNum, 1).then((res) => {
      this.setState({
        topics: res,
      });
    });
  }

  newTopic() {
    return {
      owner: "admin",
      id: `topic_${this.state.topics.length}`,
      title: `Topic ${this.state.topics.length}`,
      createdTime: moment().format(),
      content: "description...",
    };
  }

  addTopic() {
    const newTopic = this.newTopic();
    TopicBackend.addTopic(newTopic)
      .then((res) => {
        Setting.showMessage("success", `Adding topic succeeded`);
        this.setState({
          topics: Setting.addRow(this.state.topics, newTopic),
        });
      })
      .catch((error) => {
        Setting.showMessage("error", `Adding topic failed：${error}`);
      });
  }

  deleteTopic(i) {
    TopicBackend.deleteTopic(this.state.topics[i].id)
      .then((res) => {
        Setting.showMessage("success", `Deleting topic succeeded`);
        this.setState({
          topics: Setting.deleteRow(this.state.topics, i),
        });
      })
      .catch((error) => {
        Setting.showMessage("error", `Deleting topic succeeded：${error}`);
      });
  }

  renderTopic(topic) {
    const style =
      topic.nodeId !== "promotions"
        ? null
        : {
            backgroundImage: `url('${Setting.getStatic(
              "/static/img/corner_star.png"
            )}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "20px 20px",
            backgroundPosition: "right top",
          };

    return (
      <div className="cell item" style={style}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width="48" valign="top" align="center">
                <Avatar username={topic.author} avatar={topic.avatar} />
              </td>
              <td width="10" />
              <td width="auto" valign="middle">
                <span className="item_title">
                  <Link to={`/t/${topic.id}`} className="topic-link">
                    {topic.title}
                  </Link>
                </span>
                <div className="sep5" />
                <span className="topic_info">
                  <div className="votes" />
                  <Link className="node" to={`/go/${topic.nodeId}`}>
                    {topic.nodeName}
                  </Link>{" "}
                  &nbsp;•&nbsp;{" "}
                  <strong>
                    <Link to={`/member/${topic.author}`}>{topic.author}</Link>
                  </strong>{" "}
                  &nbsp;•&nbsp; {Setting.getPrettyDate(topic.createdTime)}
                  {topic.lastReplyUser === "" ? null : (
                    <div style={{ display: "inline" }}>
                      {" "}
                      &nbsp;•&nbsp; last reply from{" "}
                      <strong>
                        <Link to={`/member/${topic.lastReplyUser}`}>
                          {topic.lastReplyUser}
                        </Link>
                      </strong>
                    </div>
                  )}
                </span>
              </td>
              <td width="70" align="right" valign="middle">
                {topic.replyCount === 0 ? null : (
                  <Link to={`/t/${topic.id}`} className="count_livid">
                    {topic.replyCount}
                  </Link>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderTab(tab) {
    return (
      <a
        href="javascript:void(0)"
        onClick={() => this.changeTab(tab?.id)}
        className={this.state.tab === tab?.id ? "tab_current" : "tab"}
      >
        {tab?.name}
      </a>
    );
  }

  renderNode(node) {
    return (
      <span key={node?.id}>
        <Link to={`/go/${node?.id}`}>{node?.name}</Link>
        &nbsp; &nbsp;
      </span>
    );
  }

  renderAccountInfo() {
    if (this.props.account === undefined || this.props.account === null) {
      return null;
    }
    const { goldCount, silverCount, bronzeCount } = scoreConverter(
      this.props.account.score
    );
    return (
      <div class="cell">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width="auto">
                {this.state.unreadNotificationNum === 0 ? (
                  <Link to="/notifications" className="gray">
                    0 {i18next.t("bar:unread")}
                  </Link>
                ) : (
                  <input
                    type="button"
                    className="super special button"
                    value={`${this.state.unreadNotificationNum} ${i18next.t(
                      "bar:unread"
                    )}`}
                    onClick={() => this.props.history.push("/notifications")}
                    style={{
                      marginLeft: "2px",
                      width: "100%",
                      lineHeight: "20px",
                    }}
                  />
                )}
              </td>
              <td width="10"></td>
              <td width="150" align="right">
                <Link
                  to="/balance"
                  className="balance_area"
                  style={{ margin: "0px" }}
                >
                  {goldCount ? (
                    <span>
                      {" "}
                      {goldCount}{" "}
                      <img
                        src={Setting.getStatic("/static/img/gold@2x.png")}
                        height="16"
                        alt="G"
                        border="0"
                      />
                    </span>
                  ) : null}{" "}
                  {silverCount}{" "}
                  <img
                    src={Setting.getStatic("/static/img/silver@2x.png")}
                    height="16"
                    alt="S"
                    border="0"
                  />{" "}
                  {bronzeCount}{" "}
                  <img
                    src={Setting.getStatic("/static/img/bronze@2x.png")}
                    height="16"
                    alt="B"
                    border="0"
                  />
                </Link>
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    let topType = "homePage";
    if (this.state.tab !== undefined) {
      topType = "tab";
    }

    return (
      <div className="box">
        {Setting.PcBrowser ? null : this.renderAccountInfo()}
        <div className="inner" id="Tabs">
          {this.state.tabs.map((tab) => {
            return this.renderTab(tab);
          })}
        </div>
        <div className="cell" id="SecondaryTabs" style={{ padding: "10px" }}>
          {this.props.account !== undefined &&
          this.props.account !== null &&
          this.state.tabInfo?.defaultNode !== "" ? (
            <div className="fr">
              <Link to={`/new/${this.state.tabInfo?.defaultNode}`}>
                {this.state.tab === "all"
                  ? i18next.t("topic:Post a Question")
                  : i18next.t("topic:Create a Post")}
              </Link>
              &nbsp;
              <li className="fa fa-caret-right gray" />
            </div>
          ) : null}
          {this.state.nodes.map((node) => {
            return this.renderNode(node);
          })}
          &nbsp;
        </div>
        <TopicList
          topics={this.state.topics}
          showNodeName={true}
          showAvatar={true}
          topType={topType}
        />
        <div className="inner">
          <span className="chevron">»</span> &nbsp;
          <Link to="/recent">{i18next.t("topic:More Topics")}</Link>
        </div>
      </div>
    );
  }
}

export default withRouter(TopicPage);
