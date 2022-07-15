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
import Avatar from "../Avatar";
import "../node.css";
import i18next from "i18next";
import {Link} from "react-router-dom";
import UserLink from "../UserLink";

const pangu = require("pangu");

class TopicList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  addTopicHitCount(topicId) {
    TopicBackend.addTopicHitCount(topicId).then((res) => {
      if (res?.status === "fail") {
        Setting.showMessage("error", res?.msg);
      }
      // goToLink(`/t/${topicId}?from=${encodeURIComponent(window.location.href)}`)
    });
  }

  topTopicStyle = {
    backgroundImage: `url('${Setting.getStatic("/img/corner_star.png")}')`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "20px 20px",
    backgroundPosition: "right top",
  };

  // return style according to whether it is a topped topic.
  topStyle(nodeTopTime, tabTopTime, homePageTopTime) {
    switch (this.props.topType) {
      case "node":
        if (nodeTopTime !== "") {
          return this.topTopicStyle;
        }
        return null;
      case "tab":
        if (tabTopTime !== "" || homePageTopTime !== "") {
          return this.topTopicStyle;
        }
        return null;
      case "homePage":
        if (homePageTopTime !== "") {
          return this.topTopicStyle;
        }
        return null;
      default:
        return null;
    }
  }

  renderTopic(topic) {
    const pcBrowser = Setting.PcBrowser;
    const style = this.topStyle(topic?.nodeTopTime, topic?.tabTopTime, topic?.homePageTopTime);

    return (
      <div key={topic?.id} className={`cell item ${this.props.nodeId}`} style={style}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              {this.props.showAvatar ? (
                <td width={Setting.PcBrowser ? "48" : "24"} valign="top" align="center">
                  <Avatar username={topic?.author} avatar={topic?.avatar} size={Setting.PcBrowser ? "" : "small"} />
                </td>
              ) : null}
              {this.props.showAvatar ? <td width="10" /> : null}
              <td width="auto" valign="middle">
                {!pcBrowser && this.props.showNodeName ? (
                  <span className="small fade">
                    <Link to={`/go/${encodeURIComponent(topic.nodeId)}`} className="node">
                      {topic.nodeName}
                    </Link>{" "}
                    &nbsp;•&nbsp;{" "}
                    <strong>
                      <UserLink username={topic.author} classNameText={"node"} />
                    </strong>
                  </span>
                ) : null}
                {!pcBrowser && this.props.showNodeName ? <div className="sep5" /> : null}
                <span className="item_title">
                  <Link to={`/t/${topic?.id}`} onClick={() => this.addTopicHitCount(topic?.id)} className={`topic-link b ${this.props.nodeId}`}>
                    {pangu.spacing(topic.title)}
                  </Link>
                </span>
                <div className="sep5" />
                <span className={pcBrowser ? "topic_info" : "small fade"}>
                  {pcBrowser ? (
                    <span>
                      <div className="votes" />
                      {this.props.showNodeName ? (
                        <span>
                          <Link to={`/go/${encodeURIComponent(topic.nodeId)}`} className="node">
                            {topic.nodeName}
                          </Link>{" "}
                          &nbsp;•&nbsp;{" "}
                        </span>
                      ) : null}
                      <strong>
                        <UserLink username={topic.author} classNameText={`${this.props.nodeId} member`} />
                      </strong>{" "}
                      &nbsp;•&nbsp; {topic.lastReplyTime === "" || this.props.timeStandard === "createdTime" ? Setting.getPrettyDate(topic.createdTime) : Setting.getPrettyDate(topic.lastReplyTime)}
                      {topic.lastReplyUser === "" ? null : (
                        <div style={{display: "inline"}}>
                          {" "}
                          &nbsp;•&nbsp; {i18next.t("topic:last reply from")}{" "}
                          <strong>
                            <UserLink username={topic.lastReplyUser} classNameText={`${this.props.nodeId} member`} />
                          </strong>
                        </div>
                      )}
                    </span>
                  ) : (
                    <span>
                      {this.props.showNodeName ? (
                        <span>
                          {topic.lastReplyTime === "" || this.props.timeStandard === "createdTime" ? Setting.getPrettyDate(topic.createdTime) : Setting.getPrettyDate(topic.lastReplyTime)}
                          {topic.lastReplyUser === "" ? null : (
                            <div style={{display: "inline"}}>
                              {" "}
                              &nbsp;•&nbsp; {i18next.t("topic:last reply from")}{" "}
                              <strong>
                                <UserLink username={topic.lastReplyUser} classNameText={`${this.props.nodeId} member`} />
                              </strong>
                            </div>
                          )}
                        </span>
                      ) : (
                        <span>
                          <strong>{topic.author}</strong> &nbsp;•&nbsp; {topic.contentLength} {i18next.t("topic:words")} &nbsp;•&nbsp; {topic.hitCount} {i18next.t("topic:hits")}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </td>
              <td width="70" align="right" valign="middle">
                {topic.replyCount === 0 ? null : (
                  <Link to={`/t/${topic?.id}`} onClick={() => this.addTopicHitCount(topic?.id)} className={`count_livid ${this.props.nodeId}`}>
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

  render() {
    return (
      <div className={`box ${this.props.nodeId}`}>
        {this.props.topics?.map((topic) => {
          return this.renderTopic(topic);
        })}
      </div>
    );
  }
}

export default TopicList;
