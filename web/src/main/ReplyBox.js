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
import * as ReplyBackend from "../backend/ReplyBackend";
import * as BalanceBackend from "../backend/BalanceBackend";
import {Link, withRouter} from "react-router-dom";
import Avatar from "../Avatar";
import NewReplyBox from "./NewReplyBox";
import PageColumn from "./PageColumn";
import ReactMarkdown from "react-markdown";
import Zmage from "react-zmage";
import i18next from "i18next";
import UserLink from "../UserLink";

// const pangu = require("pangu");
const maxReplyDepth = Setting.PcBrowser ? Conf.ReplyMaxDepth : Conf.ReplyMobileMaxDepth;

class ReplyBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleReply = this.handleReply.bind(this);
    this.changeStickyStatus = this.changeStickyStatus.bind(this);
    this.state = {
      classes: props,
      topicId: this.props.topic.id,
      topic: this.props.topic,
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
      parent: {
        id: 0,
        username: "",
      },
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
    // this.getTopic();
    const lastIndex = window.location.href.lastIndexOf("#");
    if (lastIndex >= 0) {
      const idString = window.location.href.substring(lastIndex + 1);
      if (document.getElementById(idString) === null) {
        const targetReply = parseInt(idString.substring(2));
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
      this.setState({fullUrl: window.location.href});
      const lastIndex = window.location.href.lastIndexOf("#");
      if (lastIndex >= 0) {
        const idString = window.location.href.substring(lastIndex + 1);
        if (document.getElementById(idString) === null) {
          const targetReply = parseInt(idString.substring(2));
          if (!isNaN(targetReply)) {
            this.jumpToTargetPage(targetReply);
          }
        }
      }
    }
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      const params = new URLSearchParams(newProps.location.search);
      const page = params.get("p");
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
          const targetPage = Math.ceil((i + 1) / this.state.limit);
          ReplyBackend.getReplies(this.state.topicId, this.state.limit, targetPage, false).then((res) => {
            this.setState(
              {
                replies: res?.data,
                repliesNum: res?.data2[0],
                page: res?.data2[1],
                latestReplyTime: Setting.getPrettyDate(res?.data[res?.data.length - 1]?.createdTime),
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

  getReplies(init) {
    ReplyBackend.getReplies(this.state.topicId, this.state.limit, this.state.page, init).then((res) => {
      this.setState(
        {
          replies: res?.data,
          repliesNum: res?.data2[0],
          page: res?.data2[1],
          latestReplyTime: this.props.topic.lastReplyTime,
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

  handleCancelReply() {
    this.setState({
      parent: {
        id: 0,
        username: "",
      },
    });
  }

  changeStickyStatus(status) {
    this.setState({
      sticky: status,
    });
  }

  getMemberList() {
    const list = [this.props.topic?.author];
    const temp = [this.props.topic?.author + " "];
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
    // console.log(list)
    this.setState({
      memberList: list,
    });
  }

  thanksReply(id, author) {
    if (window.confirm(`Are you sure to spend ${this.state.replyThanksCost} coins in thanking @${author} for this reply?`)) {
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
    if (window.confirm("Are you sure to delete this reply?")) {
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
      const anchorElement = document.getElementById(anchorName);
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

  renderImage = ({alt, src}) => {
    return <Zmage src={src} alt={alt} style={{maxWidth: "100%"}} />;
  };

  renderLink = (props) => {
    const check = Setting.checkPageLink(props.href);
    if (check) {
      return <a {...props} />;
    }
    return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
  };

  renderReplyBox(reply, no = -1) {
    const isChild = no < 0;

    return (
      <div id={`r_${reply.id}`}>
        <div style={{minHeight: isChild ? "48px" : "60px"}}>
          <div style={{width: isChild ? "36px" : "48px", float: "left"}}>
            <Avatar username={reply.author} avatar={reply.avatar} size={isChild ? "middle" : ""} />
          </div>
          <div style={{marginLeft: isChild ? "48px" : "60px"}}>
            <div className="fr">
              {this.props.account !== null && this.props.account !== undefined && this.props.account.id !== reply?.author ? (
                reply?.thanksStatus === false ? (
                  <div id={`thank_area__${reply.id}`} className="thank_area" style={{marginRight: "10px"}}>
                    {/* <a*/}
                    {/*  className="thank"*/}
                    {/*  style={{*/}
                    {/*    color: "#ccc",*/}
                    {/*    display: Setting.PcBrowser ? "" : "none",*/}
                    {/*    marginRight: "10px",*/}
                    {/*  }}*/}
                    {/* >*/}
                    {/*  {i18next.t("reply:ignore")}*/}
                    {/* </a>*/}
                    <a onClick={() => this.thanksReply(reply.id, reply.author)} className="thank link-btn">
                      {Setting.PcBrowser ? i18next.t("reply:thank") : <img src={Setting.getStatic("/img/heart_neue.png")} width="16" style={{verticalAlign: "bottom"}} alt={i18next.t("reply:thank")} />}
                    </a>
                  </div>
                ) : (
                  <div id={`thank_area__${reply.id}`} className="thank_area thanked">
                    {i18next.t("reply:thanked")}
                  </div>
                )
              ) : null}
              {reply?.deletable ? (
                <div id={`thank_area__${reply.id}`} className="thank_area" style={{marginRight: "10px"}}>
                  <a className="delete link-btn" style={{marginRight: "10px"}} onClick={() => this.deleteReply(reply.id)}>
                    {i18next.t("reply:Delete")}
                  </a>
                  <a href={`/edit/reply/${reply.id}`} className="edit link-btn">
                    {i18next.t("reply:Edit")}
                  </a>
                </div>
              ) : null}
              {this.props.account !== undefined && this.props.account !== null ? (
                <a
                  onClick={() => {
                    this.handleClick(`@${reply.author} `);
                    this.setState({
                      parent: {id: reply.id, username: reply.author},
                    });
                  }}
                  style={{marginRight: "10px"}}
                >
                  <img src={Setting.getStatic("/img/reply_neue.png")} align="absmiddle" border="0" alt="Reply" width="20" />
                </a>
              ) : null}
              {isChild ? null : (
                <Link className={`no ${this.props.topic.nodeId}`} to={`/r/${reply.id}`}>
                  {no + 1}
                </Link>
              )}
            </div>
            <strong>
              <UserLink username={reply.author} classNameText={"dark"} />
            </strong>
            <Link
              className="ago"
              to={`#r_${reply.id}`}
              style={{marginLeft: "10px"}}
              onClick={() => {
                this.scrollToAnchor(`r_${reply?.id}`);
              }}
            >
              {Setting.getPrettyDate(reply.createdTime)}
            </Link>
            {reply?.thanksNum !== 0 ? (
              <span className="small fade">
                <img src={Setting.getStatic("/img/heart_neue_red.png")} width="14" align="absmiddle" alt="❤️" />
                {reply?.thanksNum}
              </span>
            ) : null}
            <div className={`reply_content ${this.props.topic.nodeId}`}>
              {reply.deleted ? (
                <span style={{color: "#ccc"}}>This reply has been deleted</span>
              ) : (
                <ReactMarkdown escapeHtml={false} renderers={{image: this.renderImage, link: this.renderLink}} source={Setting.getFormattedContent(reply.content, true)} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderNestedReply(reply, no, depth) {
    depth++;
    const result = [];
    if (no >= 0) {
      result.push(this.renderReplyBox(reply, no));
    }
    result.push(
      <div style={{paddingLeft: depth < maxReplyDepth ? "40px" : "", marginTop: 16}}>
        {reply.child?.map((childItem) => {
          const childResult = [];
          if (!(childItem.deleted && childItem.child === null)) {
            childResult.push(this.renderReplyBox(childItem, -1));
          }
          if (childItem.child) {
            childResult.push(this.renderNestedReply(childItem, -1, depth));
          }
          return childResult;
        })}
      </div>
    );

    return result;
  }

  renderReply() {
    return (
      <div className={`box ${this.props.topic.nodeId}`}>
        <div className={`cell ${this.props.topic.nodeId}`}>
          <div className="fr" style={{margin: "-3px -5px 0px 0px"}}>
            {this.props.topic?.tags?.map((tag, i) => {
              return (
                <Link key={i} to={`/tag/${tag}`} className={`tag ${this.props.topic.nodeId}`}>
                  <li className="fa fa-tag" />
                  {tag}
                </Link>
              );
            })}
          </div>
          <span className="gray">
            {this.state.repliesNum} {i18next.t("reply:replies")} &nbsp;
            <strong className="snow">•</strong>
            &nbsp;{Setting.getFormattedDate(this.state.latestReplyTime)}
          </span>
        </div>
        {Setting.PcBrowser ? this.showPageColumn() : null}
        {this.state.replies?.map((reply, no) => {
          return !(reply.deleted && reply.child === null) ? (
            <div id={`r_${reply.id}`} className={`cell ${this.props.topic.nodeId}`}>
              {this.renderNestedReply(reply, no, 0)}
            </div>
          ) : null;
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
        {this.state.replies.length === 0 ? <div id="no-comments-yet">{i18next.t("reply:No reply yet")}</div> : this.renderReply()}
        <div className={Setting.PcBrowser ? "sep20" : "sep5"} />
        {this.state.replies.length === 0 ? (
          <div className="box">
            <div className="inner">
              {this.props.topic?.tags?.map((tag) => {
                return (
                  <Link key={tag} to={`/tag/${tag}`} className={`tag ${this.props.topic.nodeId}`}>
                    <li className="fa fa-tag" />
                    {tag}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
        <NewReplyBox
          account={this.props.account}
          isEmbedded={this.props.isEmbedded}
          onReplyChange={this.handleReply}
          content={this.state.reply}
          sticky={this.state.sticky}
          changeStickyStatus={this.changeStickyStatus}
          member={this.props.account?.name}
          nodeId={this.props.topic?.nodeId}
          memberList={this.state.memberList}
          refreshReplies={this.getReplies.bind(this)}
          topic={this.props.topic}
          parent={this.state.parent}
          cancelReply={this.handleCancelReply.bind(this)}
          refreshAccount={this.props.refreshAccount.bind(this)}
        />
      </div>
    );
  }
}

export default withRouter(ReplyBox);
