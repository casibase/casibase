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

class RenderTopics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  renderTopic(topic) {
    const style = topic?.nodeId !== "promotions" ? null : {
      backgroundImage: `url('${Setting.getStatic("/static/img/corner_star.png")}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "20px 20px",
      backgroundPosition: "right top"
    };

    return (
      <div className="cell item" style={style}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
          <tr>
            <td width="48" valign="top" align="center">
              <a href={`/member/${topic?.author}`}>
                <img src={Setting.getUserAvatar(topic?.author)} className="avatar" border="0" align="default"/>
              </a>
            </td>
            <td width="10"></td>
            <td width="auto" valign="middle"><span className="item_title"><a href={`/t/${topic?.id}`} className="topic-link">{topic?.title}</a></span>
              <div className="sep5"></div>
              <span className="topic_info">
                <strong><a href={`/member/${topic?.author}`}>{topic?.author}</a></strong>
                &nbsp;•&nbsp;
                {Setting.getFormattedDate(topic?.createdTime)}
                &nbsp;•&nbsp;
                last reply from
                <strong><a href={`/member/${topic?.lastReplyUser}`}> {topic?.lastReplyUser} </a></strong>
              </span>
            </td>
            <td width="70" align="right" valign="middle">
              <a href={`/t/${topic?.id}`} className="count_livid">{topic?.replyCount}</a>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    )
  }

  render() {
    return (
      <div id="TopicsNode">
        {
          this.props.topics.map((topic) => {
            return this.renderTopic(topic);
          })
        }
      </div>
    )
  }
}

export default RenderTopics;
  