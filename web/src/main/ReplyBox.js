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
import * as ReplyBackend from "../backend/ReplyBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import NewReplyBox from "./NewReplyBox";
import ReactMarkdown from "react-markdown";

class ReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this)
    this.handleReply = this.handleReply.bind(this)
    this.changeStickyStatus = this.changeStickyStatus.bind(this)
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: null,
      replies: [],
      reply: "",
      sticky: false,
    };
  }

  componentDidMount() {
    this.getTopic();
    this.getReplies();
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId)
      .then((res) => {
        this.setState({
          topic: res,
        });
      });
  }

  getReplies() {
    ReplyBackend.getReplies(this.state.topicId)
      .then((res) => {
        this.setState({
          replies: res,
        });
      });
  }

  handleClick(e) {
    this.handleComment(e);
  }

  handleComment(content) {
    let temp
    if (this.state.reply.length !== 0) {
      temp = this.state.reply + "\n"
    }else {
      temp = this.state.reply
    }

    this.setState({
      reply: temp + content,
      sticky: true,
    })
  }

  handleReply(content) {
    this.setState({
      reply: content
    })
  }

  changeStickyStatus(status) {
    this.setState({
      sticky: status
    })
  }

  renderReply() {
    return (
      <div className="box">
        <div className="cell">
          <div className="fr" style={{margin: "-3px -5px 0px 0px"}}>
            {
              this.state.topic?.tags?.map((tag, i) => {
                return (
                  <a href={`/tag/${tag}`} className="tag">
                    <li className="fa fa-tag" />
                    {tag}
                  </a>
                )
              })
            }
          </div>
          <span className="gray">
            {this.state.replies.length} replies &nbsp;
            <strong className="snow">•</strong>
            &nbsp;{Setting.getPrettyDate(this.state.replies[this.state.replies.length - 1]?.createdTime)}
          </span>
        </div>
        {
          this.state.replies?.map((reply, i) => {
            return (
              <div id={`r_${reply.id}`} className="cell">
                <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                  <tbody>
                  <tr>
                    <td width="48" valign="top" align="center">
                      <Avatar username={reply.author} avatar={reply.avatar} />
                    </td>
                    <td width="10" valign="top" />
                    <td width="auto" valign="top" align="left">
                      <div className="fr">
                        <div id={`thank_area__${reply.id}`} className="thank_area">
                          <a href="#;" onClick="if (confirm('Are you sure to ignore this reply from @xxx?')) { ignoreReply(9032017, '66707'); }" className="thank" style={{color: "#ccc"}}>ignore</a>
                          &nbsp; &nbsp;
                          <a href="#;" onClick="if (confirm('Are you sure to spend 10 coins in thanking @xxx for this reply?')) { thankReply(9032017); }" className="thank">
                            thank
                          </a>
                        </div>
                        &nbsp;
                        <a href="#;" onClick={() => this.handleClick(`@${reply.author} `)}>
                          <img src={Setting.getStatic("/static/img/reply_neue.png")} align="absmiddle" border="0" alt="Reply" width="20" />
                        </a>
                        &nbsp;&nbsp;
                        <span className="no">
                          {i + 1}
                        </span>
                      </div>
                      <div className="sep3" />
                      <strong>
                        <a href={`/member/${reply.author}`} className="dark">
                          {reply.author}
                        </a>
                      </strong>
                      &nbsp; &nbsp;
                      <span className="ago">
                        {Setting.getPrettyDate(reply.createdTime)}
                      </span>
                      <div className="sep5" />
                      <div className="reply_content">
                        <ReactMarkdown source={reply.content} />
                      </div>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            )
          })
        }
      </div>
    );
  }

  render() {
    if (this.state.topic === null) {
      return null
    }
    
    return (
      <div>
        {
          this.state.replies.length === 0 ?
            <div id="no-comments-yet">
              No reply yet
            </div> :
            this.renderReply()
        }
        <div className="sep20" />
        {
          this.props.account === null ? null :
            <NewReplyBox onReplyChange={this.handleReply} content={this.state.reply} sticky={this.state.sticky} changeStickyStatus={this.changeStickyStatus} member={this.props.account?.id} />
        }
      </div>
    )
  }
}

export default withRouter(ReplyBox);
