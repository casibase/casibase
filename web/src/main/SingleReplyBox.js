// Copyright 2022 The casbin Authors. All Rights Reserved.
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
import * as TopicBackend from "../backend/TopicBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import ReactMarkdown from "react-markdown";
import UserLink from "../UserLink";
import {Helmet} from "react-helmet";
import Zmage from "react-zmage";

class SingleReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      reply: null,
      topic: null,
    };
  }

  componentDidMount() {
    this.getReply(this.props.match.params.replyId);
  }

  getReply(replyId) {
    ReplyBackend.getReplyWithDetails(replyId).then((res) => {
      this.setState({
        reply: res,
      });
      this.getTopic(res.topicId);
    });
  }

  getTopic(topicId) {
    TopicBackend.getTopic(topicId).then((res) => {
      this.setState({
        topic: res,
      });
    });
  }

  renderImage = ({alt, src}) => {
    return <Zmage src={src} alt={alt} />;
  };

  renderLink = (props) => {
    return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
  };

  renderSingleReplyBox(reply) {
    return (
      <div id={`r_${reply.id}`}>
        <div style={{width: "48px", float: "left"}}>
          <Avatar username={reply.author} avatar={reply.avatar} />
        </div>
        <div style={{marginLeft: "60px"}}>
          <strong>
            <UserLink username={reply.author} classNameText={"dark"} />
          </strong>
          <div className={`reply_content ${this.state.topic?.nodeId}`}>
            {reply.delete ? "" : <ReactMarkdown escapeHtml={false} renderers={{image: this.renderImage, link: this.renderLink}} source={Setting.getFormattedContent(reply?.content, true)} />}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.reply === null) {
      return null;
    }
    if (this.state.topic === null) {
      return null;
    }
    return (
      <div>
        <Helmet>
          <title>{`${this.state.reply?.content} - ${this.state.reply?.author}`}</title>
          <meta name="keywords" content={this.state.reply?.tags?.join(",")} />
          <meta name="description" content={`${this.state.topic?.title}`} />
        </Helmet>
        <div className={`box ${this.state.topic?.nodeId}`}>
          <div id={`r_${this.state.reply?.id}`} className={`cell ${this.state.topic?.nodeId}`}>
            {this.renderSingleReplyBox(this.state.reply)}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(SingleReplyBox);
