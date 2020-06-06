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
import Header from "./Header";
import * as TopicBackend from "../backend/TopicBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";

class TopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: null,
    };
  }

  componentDidMount() {
    this.getTopic();
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId)
      .then((res) => {
        this.setState({
          topic: res,
        });
      });
  }

  render() {
    return (
      <div className="box" style={{"borderBottom":"0px"}}>
        <div className="header">
          <div className="fr">
            <Avatar username={this.state.topic?.author} isLarge={true} />
          </div>
          <a href="/">{Setting.getForumName()}</a>
          <span className="chevron">
            &nbsp;›&nbsp;
          </span>
          <a href={`/go/${this.state.topic?.nodeId}`}>{this.state.topic?.nodeName}</a>
          <div className="sep10" />
          <h1>
            {this.state.topic?.title}
          </h1>
          <div id="topic_677954_votes" className="votes">
            <a href="javascript:" onClick="upVoteTopic(677954);" className="vote">
              <li className="fa fa-chevron-up" />
            </a>
            &nbsp;
            <a href="javascript:" onClick="downVoteTopic(677954);" className="vote">
              <li className="fa fa-chevron-down" />
            </a>
          </div>
          &nbsp;
          <small className="gray">
            <a href={`/member/${this.state.topic?.author}`}>{this.state.topic?.author}</a> · {Setting.getPrettyDate(this.state.topic?.createdTime)} · {this.state.topic?.hitCount} hits
          </small>
        </div>
        <div className="outdated">This is a topic created {Setting.getDiffDays(this.state.topic?.createdTime)} days ago, the information in it may have changed.</div>
        <div className="cell">
          <div className="topic_content">
            <div className="markdown_body">
              <span dangerouslySetInnerHTML={{__html: this.state.topic?.content}} />
            </div>
          </div>
        </div>
        <div className="topic_buttons">
          <div className="fr topic_stats" style={{paddingTop: "4px"}}>
            {this.state.topic?.hitCount} hits &nbsp;∙&nbsp; {this.state.topic?.favoriteCount} favorites &nbsp;
          </div>
          <a href="/favorite/topic/123456?t=etpmvbwsbnssixpcdiugximqbxomnnsi" className="tb">
            Favor
          </a>
          &nbsp;
          <a href="#;" onClick="window.open('https://twitter.com/share?url=https://www.example.com/t/123456?r=username&amp;related=casbinforum&amp;hashtags=inc&amp;text=title', '_blank', 'width=550,height=370'); recordOutboundLink(this, 'Share', 'twitter.com');" className="tb">
            Tweet
          </a>
          &nbsp;
          <a href="#;" onClick="window.open('https://service.weibo.com/share/share.php?url=https://www.example.com/t/123456?r=username&amp;title=casbinforum%20-%20title', '_blank', 'width=550,height=370'); recordOutboundLink(this, 'Share', 'weibo.com');" className="tb">
            Weibo
          </a>
          &nbsp;
          <a href="#;" onClick="if (confirm('Are you sure to ignore this topic?')) { location.href = '/ignore/topic/123456?once=39724'; }" className="tb">
            Ignore
          </a>
          &nbsp;
          <div id="topic_thank">
            <a href="#;" onClick="if (confirm('Are you sure to thank the topic's author?')) { thankTopic(123456, '39724'); }" className="tb">
              Thank
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(TopicBox);
