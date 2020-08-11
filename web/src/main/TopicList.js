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
import "../node.css"
import i18next from "i18next";
import {goToLink} from "../Setting";
const pangu = require("pangu")

class TopicList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  addTopicHitCount(topicId) {
    TopicBackend.addTopicHitCount(topicId)
      .then((res) => {
        if (res?.status === "fail") {
          Setting.showMessage("error", res?.msg)
        }
        goToLink(`/t/${topicId}`)
      });
  }

  renderTopic(topic) {
    const style = topic.topExpiredTime === "" ? null : {
      backgroundImage: `url('${Setting.getStatic("/static/img/corner_star.png")}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "20px 20px",
      backgroundPosition: "right top"
    };

    return (
      <div className={`cell item ${this.props.nodeId}`} style={style}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
          <tr>
            {
              this.props.showAvatar ?
                <td width="48" valign="top" align="center">
                  <Avatar username={topic?.author} avatar={topic?.avatar} />
                </td> :
                null
            }
            {
              this.props.showAvatar ?
                <td width="10" />
                :
                null
            }
            <td width="auto" valign="middle">
                <span className="item_title">
                  <a href="javascript:void(0)" onClick={() => this.addTopicHitCount(topic?.id)} className={`topic-link b ${this.props.nodeId}`}>
                    {
                      pangu.spacing(topic.title)
                    }
                  </a>
                </span>
              <div className="sep5" />
              <span className="topic_info">
                <div className="votes" />
                {
                  this.props.showNodeName ?
                    <a className="node" href={`/go/${topic.nodeId}`}>
                      {topic.nodeName}
                    </a> :
                    null
                }
                {
                  this.props.showNodeName ?
                    ` • ` :
                    null
                }
                <strong>
                  <a href={`/member/${topic.author}`} className={`${this.props.nodeId} member`}>
                    {topic.author}
                  </a>
                </strong>
                {" "}&nbsp;•&nbsp;{" "}
                {
                  (topic.lastReplyTime === "" || this.props.timeStandard === "createdTime") ? Setting.getPrettyDate(topic.createdTime) : Setting.getPrettyDate(topic.lastReplyTime)
                }
                {
                  topic.lastReplyUser === "" ? null : (
                    <div style={{display: "inline"}}>
                      {" "}&nbsp;•&nbsp;{" "}
                      {i18next.t("topic:last reply from")}{" "}<strong><a href={`/member/${topic.lastReplyUser}`} className={`${this.props.nodeId} member`}>{topic.lastReplyUser}</a></strong>
                    </div>
                  )
                }
                </span>
            </td>
            <td width="70" align="right" valign="middle">
              {
                topic.replyCount === 0 ? null : (
                  <a href="javascript:void(0)" onClick={() => this.addTopicHitCount(topic?.id)} className={`count_livid ${this.props.nodeId}`}>
                    {
                      topic.replyCount
                    }
                  </a>
                )
              }
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    )
  }

  render() {
    return (
      <div className={`box ${this.props.nodeId}`}>
        {
          this.props.topics.map((topic) => {
            return this.renderTopic(topic);
          })
        }
      </div>
    )
  }
}

export default TopicList;
