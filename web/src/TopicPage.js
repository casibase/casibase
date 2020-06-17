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
import moment from "moment";
import Avatar from "./Avatar";

class TopicPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topics: [],
    };
  }

  componentDidMount() {
    this.getTopics();
  }

  getTopics() {
    TopicBackend.getTopics()
      .then((res) => {
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
    }
  }

  addTopic() {
    const newTopic = this.newTopic();
    TopicBackend.addTopic(newTopic)
      .then((res) => {
          Setting.showMessage("success", `Adding topic succeeded`);
          this.setState({
            topics: Setting.addRow(this.state.topics, newTopic),
          });
        }
      )
      .catch(error => {
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
        }
      )
      .catch(error => {
        Setting.showMessage("error", `Deleting topic succeeded：${error}`);
      });
  }

  renderTopic(topic) {
    const style = topic.nodeId !== "promotions" ? null : {
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
              <Avatar username={topic.author} />
            </td>
            <td width="10" />
            <td width="auto" valign="middle">
                <span className="item_title">
                  <a href={`/t/${topic.id}`} className="topic-link">
                    {
                      topic.title
                    }
                  </a>
                </span>
              <div className="sep5" />
              <span className="topic_info">
                <div className="votes" />
                <a className="node" href={`/go/${topic.nodeId}`}>
                  {topic.nodeName}
                </a>
                {" "}&nbsp;•&nbsp;{" "}
                <strong>
                  <a href={`/member/${topic.author}`}>
                    {topic.author}
                  </a>
                </strong>
                {" "}&nbsp;•&nbsp;{" "}
                {
                  Setting.getPrettyDate(topic.createdTime)
                }
                {
                  topic.lastReplyUser === "" ? null : (
                    <div style={{display: "inline"}}>
                      {" "}&nbsp;•&nbsp;{" "}
                      last reply from <strong><a href={`/member/${topic.lastReplyUser}`}>{topic.lastReplyUser}</a></strong>
                    </div>
                  )
                }
                </span>
            </td>
            <td width="70" align="right" valign="middle">
              {
                topic.replyCount === 0 ? null : (
                  <a href={`/t/${topic.id}`} className="count_livid">
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
      <div className="box">
        <div className="inner" id="Tabs">
          <a href="/?tab=tech" className="tab">Tech</a>
          <a href="/?tab=creative" className="tab">Creative</a>
          <a href="/?tab=play" className="tab">Play</a>
          <a href="/?tab=apple" className="tab">Apple</a>
          <a href="/?tab=jobs" className="tab">Jobs</a>
          <a href="/?tab=deals" className="tab">Deals</a>
          <a href="/?tab=city" className="tab">City</a>
          <a href="/?tab=qna" className="tab">Q&A</a>
          <a href="/?tab=hot" className="tab">Hot</a>
        </div>
        <div className="cell" id="SecondaryTabs">
          <div className="fr">
            <a href="/new/qna">Create a Post</a>
            &nbsp;
            <li className="fa fa-caret-right gray" />
          </div>
          <a href="/go/share">Share</a>
          &nbsp; &nbsp;
          <a href="/go/create">Create</a>
          &nbsp; &nbsp;
          <a href="/go/qna">Q&A</a>
        </div>
        {
          this.state.topics.map((topic, i) => {
            return this.renderTopic(topic);
          })
        }
        <div className="inner">
          <span className="chevron">»</span> &nbsp;<a href="/recent">More Topics</a>
        </div>
      </div>
    );
  }
}

export default TopicPage;
