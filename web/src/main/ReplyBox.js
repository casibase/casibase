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
import * as BalanceBackend from "../backend/BalanceBackend";
import {withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import NewReplyBox from "./NewReplyBox";
import ReactMarkdown from "react-markdown";
import Zmage from "react-zmage";
import i18next from "i18next";

const pangu = require("pangu")

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
      memberList: [],
      replyThanksCost: 10,
      sticky: false,
    };
  }

  componentDidMount() {
    this.getTopic();
    this.getReplies();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.reply !== this.state.reply || prevState.sticky !== this.state.sticky) {
      return
    }
    let url = window.location.href;
    let id = url.substring(url.lastIndexOf("#")+1);
    setTimeout(function() {
      let anchorElement = document.getElementById(id);
      if (anchorElement) {
        anchorElement.scrollIntoView()
      }
    }, 100)
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
        }, () => {
          this.getMemberList();
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

  getMemberList() {
    let list = []
    let temp = []
    for (let i = 0; i < this.state.replies.length; ++ i) {
      let flag = true
      for (let j = 0; j < temp.length; ++ j) {
        if (temp[j] === this.state.replies[i].author) {
          flag = false
          break
        }
      }
      if (flag) {
        temp.push(this.state.replies[i].author)
        list.push(this.state.replies[i].author + " ")
      }
    }
    //console.log(list)
    this.setState({
      memberList: list
    })
  }

  thanksReply(id, author) {
    if (window.confirm(`Are you sure to spend ${this.state.replyThanksCost} coins in thanking @${author} for this reply?`)) {
      BalanceBackend.addThanks(id, 2)
        .then((res) => {
          if (res?.status === "ok") {
            Setting.refresh()
          } else {
            alert(res?.msg)
          }
        })
    }
  }

  deleteReply(id) {
    if (window.confirm(`Are you sure to delete this reply?`)) {
      ReplyBackend.deleteReply(id)
        .then((res) => {
          if (res?.status === "ok") {
            Setting.refresh()
          } else {
            alert(res?.msg)
          }
        })
    }
  }

  scrollToAnchor = (anchorName) => {
    if (anchorName) {
      let anchorElement = document.getElementById(anchorName);
      if (anchorElement) {
        anchorElement.scrollIntoView()
      }
    }
  }

  renderImage = ({alt, src}) => {
    return(
      <Zmage src={src} alt={alt} style={{maxWidth: "100%"}}/>
    );
  };

  renderLink = (props) => {
    return(
      <a {...props} target="_blank" />
    );
  };

  renderReply() {
    return (
      <div className={`box ${this.state.topic.nodeId}`}>
        <div className={`cell ${this.state.topic.nodeId}`}>
          <div className="fr" style={{margin: "-3px -5px 0px 0px"}}>
            {
              this.state.topic?.tags?.map((tag, i) => {
                return (
                  <a href={`/tag/${tag}`} className={`tag ${this.state.topic.nodeId}`}>
                    <li className="fa fa-tag" />
                    {tag}
                  </a>
                )
              })
            }
          </div>
          <span className="gray">
            {this.state.replies.length}{" "}{i18next.t("reply:replies")}{" "}&nbsp;
            <strong className="snow">•</strong>
            &nbsp;{Setting.getPrettyDate(this.state.replies[this.state.replies.length - 1]?.createdTime)}
          </span>
        </div>
        {
          this.state.replies?.map((reply, i) => {
            return (
              <div id={`r_${reply.id}`} className={`cell ${this.state.topic.nodeId}`}>
                <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                  <tbody>
                  <tr>
                    <td width="48" valign="top" align="center">
                      <Avatar username={reply.author} avatar={reply.avatar} />
                    </td>
                    <td width="10" valign="top" />
                    <td width="auto" valign="top" align="left">
                      <div className="fr">
                        {
                          this.props.account !== null && this.props.account !== undefined && this.props.account.id !== reply?.author ?
                            reply?.thanksStatus === false ?
                              <div id={`thank_area__${reply.id}`} className="thank_area">
                                <a href="#;" onClick="if (confirm('Are you sure to ignore this reply from @xxx?')) { ignoreReply(9032017, '66707'); }" className="thank" style={{color: "#ccc", display: Setting.PcBrowser ? "" : "none"}}>{i18next.t("reply:ignore")}</a>
                                &nbsp; &nbsp;
                                <a href="#;" onClick={() => this.thanksReply(reply.id, reply.author)} className="thank">
                                  {
                                    Setting.PcBrowser ?
                                      i18next.t("reply:thank") :
                                      <img src={Setting.getStatic("/static/img/heart_neue.png")} style={{verticalAlign: "bottom"}} alt={i18next.t("reply:thank")} width="16" />
                                  }
                                </a>
                              </div> :
                              <div id={`thank_area__${reply.id}`} className="thank_area thanked">
                                {i18next.t("reply:thanked")}
                              </div>
                            : null
                        }
                        {" "}&nbsp;
                        {
                          reply?.deletable ?
                            <div id={`thank_area__${reply.id}`} className="thank_area">
                              <a href="#;" onClick={() => this.deleteReply(reply.id)} className="delete">
                                {i18next.t("reply:Delete")}
                              </a>
                              &nbsp; &nbsp;
                              <a href={`/edit/reply/${reply.id}`} className="edit">
                                {i18next.t("reply:Edit")}
                              </a>
                            </div> : null
                        }
                        &nbsp;
                        <a href="#;" onClick={() => this.handleClick(`@${reply.author} `)}>
                          <img src={Setting.getStatic("/static/img/reply_neue.png")} align="absmiddle" border="0" alt="Reply" width="20" />
                        </a>
                        &nbsp;&nbsp;
                        <span className={`no ${this.state.topic.nodeId}`}>
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
                      <span className="ago" onClick={() => {
                        this.scrollToAnchor(`r_${reply?.id}`)
                        window.history.pushState({}, 0, `/t/${this.state.topic?.id}#r_${reply.id}`)
                      }}>
                        {Setting.getPrettyDate(reply.createdTime)}
                      </span>
                      {" "}&nbsp;{" "}
                      {
                        reply?.thanksNum !== 0 ?
                          <span className="small fade">
                            <img src={Setting.getStatic("/static/img/heart_neue_red.png")} width="14" align="absmiddle" alt="❤️"/>
                            {" "}{reply?.thanksNum}
                          </span> : null
                      }
                      <div className="sep5" />
                      <div className={`reply_content ${this.state.topic.nodeId}`}>
                        <ReactMarkdown
                          renderers={{
                            image: this.renderImage,
                            link: this.renderLink
                          }}
                          source={Setting.getFormattedContent(reply.content, true)}
                          escapeHtml={false}
                        />
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
              {i18next.t("reply:No reply yet")}
            </div> :
            this.renderReply()
        }
        {Setting.PcBrowser ? <div className="sep20"/> : <div className="sep5"/>}
        {
          this.props.account === null ? null :
            <NewReplyBox onReplyChange={this.handleReply} content={this.state.reply} sticky={this.state.sticky} changeStickyStatus={this.changeStickyStatus} member={this.props.account?.id} nodeId={this.state.topic?.nodeId} memberList={this.state.memberList} />
        }
      </div>
    )
  }
}

export default withRouter(ReplyBox);
