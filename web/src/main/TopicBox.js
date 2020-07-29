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
import * as NodeBackend from "../backend/NodeBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import * as BalanceBackend from "../backend/BalanceBackend";
import "../node.css"
import i18next from "i18next";

import "codemirror/lib/codemirror.css"
require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require('react-markdown');
const pangu = require("pangu");

class TopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: [],
      topicThanksCost: 15,
      favoritesStatus: false,
    };
  }

  componentDidMount() {
    this.getTopic();
    this.getFavoriteStatus();
    TopicBackend.addTopicBrowseCount(this.state.topicId);
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId)
      .then((res) => {
        this.setState({
          topic: res,
        }, () => {
          this.props.getNodeId(this.state.topic?.nodeId);
          NodeBackend.addNodeBrowseCount(this.state.topic?.nodeId);
        });
      });
  }

  getFavoriteStatus() {
    FavoritesBackend.getFavoritesStatus(this.state.topicId, 1)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: res.data,
          });
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  renderOutdatedProblem() {
    const diffDays = Setting.getDiffDays(this.state.topic?.createdTime);

    if (diffDays <= 30) {
      return null;
    }

    return (
      <div className="outdated">
        {i18next.t("topic:This is a topic created")} {diffDays} {i18next.t("topic:days ago, the information in it may have changed.")}
      </div>
    )
  }

  addFavorite() {
    FavoritesBackend.addFavorites(this.state.topicId, 1)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: res.data,
          });
          Setting.refresh()
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  deleteFavorite() {
    FavoritesBackend.deleteFavorites(this.state.topicId, 1)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favoritesStatus: !res.data,
          });
          Setting.refresh()
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
  }

  thanksTopic(id, author) {
    if (window.confirm(`Are you sure to spend ${this.state.topicThanksCost} coins in thanking @${author} for this topic?`)) {
      BalanceBackend.addThanks(id, 1)
        .then((res) => {
          if (res?.status === "ok") {
            Setting.refresh()
          } else {
            alert(res?.msg)
          }
        })
    }
  }

  render() {
    if (this.state.topic !== null && this.state.topic.length === 0) {
      return (
        <div class="box">
          <div class="header"><a href="/">{Setting.getForumName()}</a> <span class="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("loading:Topic is loading")}</div>
          <div class="cell"><span class="gray bigger">{i18next.t("loading:Please wait patiently...")}</span></div>
        </div>
      )
    }

    if (this.state.topic === null) {
      return (
        <div class="box">
          <div class="header"><a href="/">{Setting.getForumName()}</a> <span class="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("error:Topic not found")}</div>
          <div class="cell"><span class="gray bigger">404 Topic Not Found</span></div>
          <div class="inner">←  <a href="/">{i18next.t("error:Back to Home Page")}</a></div>
        </div>
      )
    }

    return (
      <div className={`box ${this.state.topic.nodeId}`} style={{borderBottom: "0px"}}>
        <div className={`header ${this.state.topic.nodeId}`}>
          <div className="fr">
            <Avatar username={this.state.topic?.author} size="large" avatar={this.state.topic?.avatar} />
          </div>
          <a href="/" className={`${this.state.topic?.nodeId}`}>{Setting.getForumName()}</a>
          {" "}
          <span className="chevron">
            &nbsp;›&nbsp;
          </span>
          {" "}
          <a href={`/go/${this.state.topic?.nodeId}`} className={`${this.state.topic?.nodeId}`}>{this.state.topic?.nodeName}</a>
          <div className="sep10" />
          <h1>
            {this.state.topic?.title}
          </h1>
          <div id="topic_677954_votes" className="votes">
            <a href="javascript:" onClick="upVoteTopic(677954);" className={`vote ${this.state.topic.nodeId}`}>
              <li className="fa fa-chevron-up" />
            </a>
            {" "}&nbsp;
            <a href="javascript:" onClick="downVoteTopic(677954);" className={`vote ${this.state.topic.nodeId}`}>
              <li className="fa fa-chevron-down" />
            </a>
          </div>
          &nbsp;{" "}
          <small className="gray">
            <a href={`/member/${this.state.topic?.author}`} className={`${this.state.topic.nodeId}`}>{this.state.topic?.author}</a> · {Setting.getPrettyDate(this.state.topic?.createdTime)} · {this.state.topic?.hitCount}{" "}{i18next.t("topic:hits")}
          </small>
        </div>
        {
          this.renderOutdatedProblem()
        }
        <div className={`cell ${this.state.topic.nodeId}`}>
          <div className={`topic_content ${this.state.topic.nodeId}`}>
            <div className="markdown_body">
              <ReactMarkdown source={pangu.spacing(this.state.topic?.content.replace(/@(.*?) /g, function (w) {
                return `[${w.substring(0,w.length-1)}](${Setting.ClientUrl}/member/${w.substring(1,)}) `
              }))} escapeHtml={false} />
            </div>
          </div>
        </div>
        <div className="topic_buttons">
          <div className="fr topic_stats" style={{paddingTop: "4px"}}>
            {this.state.topic?.hitCount}{" "}{i18next.t("topic:hits")}{" "}&nbsp;∙&nbsp; {this.state.topic?.favoriteCount}{" "}{i18next.t("topic:favorites")}{" "}&nbsp;
          </div>
          {
            this.props.account !== undefined ?
              this.state.favoritesStatus ?
                <a href="#;" onClick={() => {this.deleteFavorite()}} className="tb">{i18next.t("topic:Cancel Favor")}</a> : <a href="#;" onClick={() => {this.addFavorite()}} className="tb">{i18next.t("topic:Favor")}</a> :
              null
          }
          <a href="#;" onClick="window.open('https://twitter.com/share?url=https://www.example.com/t/123456?r=username&amp;related=casbinforum&amp;hashtags=inc&amp;text=title', '_blank', 'width=550,height=370'); recordOutboundLink(this, 'Share', 'twitter.com');" className="tb">
            Tweet
          </a>
          &nbsp;
          <a href="#;" onClick="window.open('https://service.weibo.com/share/share.php?url=https://www.example.com/t/123456?r=username&amp;title=casbinforum%20-%20title', '_blank', 'width=550,height=370'); recordOutboundLink(this, 'Share', 'weibo.com');" className="tb">
            Weibo
          </a>
          &nbsp;
          <a href="#;" onClick="if (confirm('Are you sure to ignore this topic?')) { location.href = '/ignore/topic/123456?once=39724'; }" className="tb">
            {i18next.t("topic:Ignore")}
          </a>
          &nbsp;
          {
            this.props.account !== undefined && this.props.account?.id !== this.state.topic?.author ?
              this.state.topic?.thanksStatus === false ?
                <div id="topic_thank">
                  <a href="#;" onClick={() => this.thanksTopic(this.state.topic?.id, this.state.topic?.author)} className="tb">
                    {i18next.t("topic:Thank")}
                  </a>
                </div> :
                <div id="topic_thank">
                  <span class="topic_thanked">
                    {i18next.t("topic:Thanked")}
                  </span>
                </div>
              : null
          }
        </div>
      </div>
    );
  }
}

export default withRouter(TopicBox);
