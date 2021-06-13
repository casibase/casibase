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
import * as Conf from "../Conf";
import * as TopicBackend from "../backend/TopicBackend";
import * as ReplyBackend from "../backend/ReplyBackend";
import * as BalanceBackend from "../backend/BalanceBackend";
import { withRouter, Link } from "react-router-dom";
import Avatar from "../Avatar";
import NewReplyBox from "./NewReplyBox";
import PageColumn from "./PageColumn";
import ReactMarkdown from "react-markdown";
import Zmage from "react-zmage";
import i18next from "i18next";

const pangu = require("pangu");

class ReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleReply = this.handleReply.bind(this);
    this.changeStickyStatus = this.changeStickyStatus.bind(this);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      topic: null,
      replies: [],
      reply: "",
      memberList: [],
      replyThanksCost: 10,
      repliesNum: 0,
      latestReplyTime: "",
      p: "",
      page: -1,
      limit: Conf.DefaultTopicPageReplyNum,
      minPage: 1,
      maxPage: -1,
      sticky: false,
      url: `/t/${props.match.params.topicId}`,
      fullUrl: window.location.href,
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = -1;
    } else {
      this.state.page = parseInt(this.state.p);
    }
  }

  componentDidMount() {
    //this.getTopic();
    let lastIndex = window.location.href.lastIndexOf("#");
    if (lastIndex >= 0) {
      let idString = window.location.href.substring(lastIndex + 1);
      if (document.getElementById(idString) === null) {
        let targetReply = parseInt(idString.substring(2));
        if (!isNaN(targetReply)) {
          this.jumpToTargetPage(targetReply);
        }
      }
    } else {
      this.getReplies(this.state.page === -1);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.fullUrl !== window.location.href) {
      this.state.fullUrl = window.location.href;
      let lastIndex = window.location.href.lastIndexOf("#");
      if (lastIndex >= 0) {
        let idString = window.location.href.substring(lastIndex + 1);
        if (document.getElementById(idString) === null) {
          let targetReply = parseInt(idString.substring(2));
          if (!isNaN(targetReply)) {
            this.jumpToTargetPage(targetReply);
          }
        }
      }
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      let params = new URLSearchParams(newProps.location.search);
      let page = params.get("p");
      if (page !== null) {
        this.setState(
          {
            page: parseInt(page),
          },
          () => this.getReplies(false)
        );
      }
    }
  }

  jumpToTargetPage(targetReply) {
    ReplyBackend.getRepliesOfTopic(this.state.topicId).then((res) => {
      let found = false;
      res.data.map((reply, i) => {
        if (reply.id === targetReply) {
          found = true;
          let targetPage = Math.ceil((i + 1) / this.state.limit);
          ReplyBackend.getReplies(
            this.state.topicId,
            this.state.limit,
            targetPage,
            false
          ).then((res) => {
            this.setState(
              {
                replies: res?.data,
                repliesNum: res?.data2[0],
                page: res?.data2[1],
                latestReplyTime: Setting.getPrettyDate(
                  res?.data[res?.data.length - 1]?.createdTime
                ),
              },
              () => {
                document.getElementById("r_" + targetReply).scrollIntoView();
              }
            );
          });
        }
      });
      if (!found) {
        this.getReplies(true);
      }
    });
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId).then((res) => {
      this.setState({
        topic: res,
      });
    });
  }

  getReplies(init) {
    ReplyBackend.getReplies(
      this.state.topicId,
      this.state.limit,
      this.state.page,
      init
    ).then((res) => {
      this.setState(
        {
          replies: res?.data,
          repliesNum: res?.data2[0],
          page: res?.data2[1],
          latestReplyTime: Setting.getPrettyDate(
            res?.data[res?.data.length - 1]?.createdTime
          ),
        },
        () => {
          this.getMemberList();
        }
      );
    });
  }

  handleClick(e) {
    this.handleComment(e);
  }

  handleComment(content) {
    let temp;
    if (this.state.reply.length !== 0) {
      temp = this.state.reply + "\n";
    } else {
      temp = this.state.reply;
    }

    this.setState({
      reply: temp + content,
      sticky: true,
    });
  }

  handleReply(content) {
    this.setState({
      reply: content,
    });
  }

  changeStickyStatus(status) {
    this.setState({
      sticky: status,
    });
  }

  getMemberList() {
    let list = [];
    let temp = [];
    for (let i = 0; i < this.state.replies.length; ++i) {
      let flag = true;
      for (let j = 0; j < temp.length; ++j) {
        if (temp[j] === this.state.replies[i].author) {
          flag = false;
          break;
        }
      }
      if (flag) {
        temp.push(this.state.replies[i].author);
        list.push(this.state.replies[i].author + " ");
      }
    }
    //console.log(list)
    this.setState({
      memberList: list,
    });
  }

  thanksReply(id, author) {
    if (
      window.confirm(
        `Are you sure to spend ${this.state.replyThanksCost} coins in thanking @${author} for this reply?`
      )
    ) {
      BalanceBackend.addThanks(id, 2).then((res) => {
        if (res?.status === "ok") {
          this.getReplies(false);
        } else {
          alert(res?.msg);
        }
      });
    }
  }

  deleteReply(id) {
    if (window.confirm(`Are you sure to delete this reply?`)) {
      ReplyBackend.deleteReply(id).then((res) => {
        if (res?.status === "ok") {
          this.getReplies(false);
        } else {
          alert(res?.msg);
        }
      });
    }
  }

  scrollToAnchor = (anchorName) => {
    if (anchorName) {
      let anchorElement = document.getElementById(anchorName);
      if (anchorElement) {
        anchorElement.scrollIntoView();
      }
    }
  };

  showPageColumn() {
    if (this.state.repliesNum < this.state.limit) {
      return;
    }

    return (
      <PageColumn
        page={this.state.page}
        total={this.state.repliesNum}
        url={this.state.url}
        defaultPageNum={this.state.limit}
        onChange={(page) => {
          this.setState(
            {
              page: page,
            },
            () => this.getReplies(false)
          );
        }}
      />
    );
  }

  renderImage = ({ alt, src }) => {
    return <Zmage src={src} alt={alt} style={{ maxWidth: "100%" }} />;
  };

  renderLink = (props) => {
    let check = Setting.checkPageLink(props.href);
    if (check) {
      return <a {...props} />;
    }
    return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
  };

  renderReply() {
    return (
      <div className={`box ${this.props.topic.nodeId}`}>
        <div className={`cell ${this.props.topic.nodeId}`}>
          <div className="fr" style={{ margin: "-3px -5px 0px 0px" }}>
            {this.props.topic?.tags?.map((tag, i) => {
              return (
                <Link
                  to={`/tag/${tag}`}
                  className={`tag ${this.props.topic.nodeId}`}
                >
                  <li className="fa fa-tag" />
                  {tag}
                </Link>
              );
            })}
          </div>
          <span className="gray">
            {this.state.repliesNum} {i18next.t("reply:replies")} &nbsp;
            <strong className="snow">•</strong>
            &nbsp;{this.state.latestReplyTime}
          </span>
        </div>
        {Setting.PcBrowser ? this.showPageColumn() : null}
        {this.state.replies?.map((reply, i) => {
          return (
            <div
              id={`r_${reply.id}`}
              className={`cell ${this.props.topic.nodeId}`}
            >
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="48" valign="top" align="center">
                      <Avatar username={reply.author} avatar={reply.avatar} />
                    </td>
                    <td width="10" valign="top" />
                    <td width="auto" valign="top" align="left">
                      <div className="fr">
                        {this.props.account !== null &&
                        this.props.account !== undefined &&
                        this.props.account.id !== reply?.author ? (
                          reply?.thanksStatus === false ? (
                            <div
                              id={`thank_area__${reply.id}`}
                              className="thank_area"
                            >
                              <a
                                href="#;"
                                onClick="if (confirm('Are you sure to ignore this reply from @xxx?')) { ignoreReply(9032017, '66707'); }"
                                className="thank"
                                style={{
                                  color: "#ccc",
                                  display: Setting.PcBrowser ? "" : "none",
                                }}
                              >
                                {i18next.t("reply:ignore")}
                              </a>
                              &nbsp; &nbsp;
                              <a
                                href="#;"
                                onClick={() =>
                                  this.thanksReply(reply.id, reply.author)
                                }
                                className="thank"
                              >
                                {Setting.PcBrowser ? (
                                  i18next.t("reply:thank")
                                ) : (
                                  <img
                                    src={Setting.getStatic(
                                      "/static/img/heart_neue.png"
                                    )}
                                    style={{ verticalAlign: "bottom" }}
                                    alt={i18next.t("reply:thank")}
                                    width="16"
                                  />
                                )}
                              </a>
                            </div>
                          ) : (
                            <div
                              id={`thank_area__${reply.id}`}
                              className="thank_area thanked"
                            >
                              {i18next.t("reply:thanked")}
                            </div>
                          )
                        ) : null}{" "}
                        &nbsp;
                        {reply?.deletable ? (
                          <div
                            id={`thank_area__${reply.id}`}
                            className="thank_area"
                          >
                            <a
                              href="#;"
                              onClick={() => this.deleteReply(reply.id)}
                              className="delete"
                            >
                              {i18next.t("reply:Delete")}
                            </a>
                            &nbsp; &nbsp;
                            <a
                              href={`/edit/reply/${reply.id}`}
                              className="edit"
                            >
                              {i18next.t("reply:Edit")}
                            </a>
                          </div>
                        ) : null}
                        &nbsp;
                        {this.props.account !== undefined &&
                        this.props.account !== null ? (
                          <a
                            href="#;"
                            onClick={() =>
                              this.handleClick(`@${reply.author} `)
                            }
                          >
                            <img
                              src={Setting.getStatic(
                                "/static/img/reply_neue.png"
                              )}
                              align="absmiddle"
                              border="0"
                              alt="Reply"
                              width="20"
                            />
                          </a>
                        ) : null}
                        &nbsp;&nbsp;
                        <span className={`no ${this.props.topic.nodeId}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="sep3" />
                      <strong>
                        <Link to={`/member/${reply.author}`} className="dark">
                          {reply.author}
                        </Link>
                      </strong>
                      &nbsp; &nbsp;
                      <Link
                        className="ago"
                        to={`#r_${reply.id}`}
                        onClick={() => {
                          this.scrollToAnchor(`r_${reply?.id}`);
                        }}
                      >
                        {Setting.getPrettyDate(reply.createdTime)}
                      </Link>{" "}
                      &nbsp;{" "}
                      {reply?.thanksNum !== 0 ? (
                        <span className="small fade">
                          <img
                            src={Setting.getStatic(
                              "/static/img/heart_neue_red.png"
                            )}
                            width="14"
                            align="absmiddle"
                            alt="❤️"
                          />{" "}
                          {reply?.thanksNum}
                        </span>
                      ) : null}
                      <div className="sep5" />
                      <div
                        className={`reply_content ${this.props.topic.nodeId}`}
                      >
                        <ReactMarkdown
                          renderers={{
                            image: this.renderImage,
                            link: this.renderLink,
                          }}
                          source={Setting.getFormattedContent(
                            reply.content,
                            true
                          )}
                          escapeHtml={false}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
        {this.showPageColumn()}
      </div>
    );
  }

  render() {
    if (this.props.topic === null) {
      return null;
    }

    return (
      <div>
        {this.state.replies.length === 0 ? (
          <div id="no-comments-yet">{i18next.t("reply:No reply yet")}</div>
        ) : (
          this.renderReply()
        )}
        {Setting.PcBrowser ? (
          <div className="sep20" />
        ) : (
          <div className="sep5" />
        )}
        {this.state.replies.length === 0 ? (
          <div>
            <div className="inner" style={{ backgroundColor: "white" }}>
              {this.props.topic?.tags?.map((tag, i) => {
                return (
                  <Link
                    key={tag}
                    to={`/tag/${tag}`}
                    className={`tag ${this.props.topic.nodeId}`}
                  >
                    <li className="fa fa-tag" />
                    {tag}
                  </Link>
                );
              })}
            </div>
            <div className="sep20" />
          </div>
        ) : null}
        {this.props.account === null ? null : (
          <NewReplyBox
            onReplyChange={this.handleReply}
            content={this.state.reply}
            sticky={this.state.sticky}
            changeStickyStatus={this.changeStickyStatus}
            member={this.props.account?.username}
            nodeId={this.props.topic?.nodeId}
            memberList={this.state.memberList}
            refreshReplies={this.getReplies.bind(this)}
            topic={this.props.topic}
          />
        )}
      </div>
    );
  }
}

export default withRouter(ReplyBox);
