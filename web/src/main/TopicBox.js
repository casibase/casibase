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
import ReplyBox from "./ReplyBox";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import * as BalanceBackend from "../backend/BalanceBackend";
import * as TranslatorBackend from "../backend/TranslatorBackend";
import "../node.css";
import Zmage from "react-zmage";
import {Link} from "react-router-dom";
import i18next from "i18next";
import UserLink from "../UserLink";
import * as Conf from "../Conf";
import {Helmet} from "react-helmet";

require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require("react-markdown");
const pangu = require("pangu");

class TopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.topicId,
      event: props.match.params.event,
      topic: [],
      topicThanksCost: 15,
      favoritesStatus: false,
      subscribeStatus: false,
      defaultTopTopicTime: 10,
      from: "/",
      showTranslateBtn: false,
      translation: {
        translated: false,
        from: "",
        content: "",
      },
    };

    const params = new URLSearchParams(this.props.location.search);
    this.state.from = params.get("from");
    if (this.state.from === null) {
      this.state.from = "/";
    } else {
      this.state.from = decodeURIComponent(this.state.from);
    }
  }

  componentDidMount() {
    this.getTopic();
    this.getFavoriteStatus();
    this.getSubscribeStatus();
    TopicBackend.addTopicBrowseCount(this.state.topicId);
    this.renderTranslateButton();
  }

  componentWillUnmount() {
    this.props.getNodeBackground("", "", "", "");
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      if (this.judgeAnchorElement()) {
        return;
      }
      this.setState(
        {
          topicId: newProps.match.params.topicId,
          event: newProps.match.params.event,
        },
        () => this.getTopic()
      );
    }
  }

  judgeAnchorElement() {
    const url = window.location.href;
    const id = url.substring(url.lastIndexOf("#") + 1);
    const anchorElement = document.getElementById(id);
    return !!anchorElement;
  }

  getTopic(event) {
    TopicBackend.getTopic(this.state.topicId).then((res) => {
      this.setState(
        {
          topic: res,
        },
        () => {
          if (event === "refresh") {
            return;
          }

          this.getNodeInfo();
          // this.props.getNodeId(this.state.topic?.nodeId);
          NodeBackend.addNodeBrowseCount(this.state.topic?.nodeId);
        }
      );
    });
  }

  getNodeInfo() {
    NodeBackend.getNode(this.state.topic?.nodeId).then((res) => {
      this.props.getNodeBackground(this.state.nodeId, res?.backgroundImage, res?.backgroundColor, res?.backgroundRepeat);
    });
  }

  getFavoriteStatus() {
    if (this.state.event === "review" || this.props.account === null) {
      return;
    }

    FavoritesBackend.getFavoritesStatus(this.state.topicId, "favor_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  getSubscribeStatus() {
    if (this.state.event === "review" || this.props.account === null) {
      return;
    }

    FavoritesBackend.getFavoritesStatus(this.state.topicId, "subscribe_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          subscribeStatus: res.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
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
    );
  }

  addFavorite() {
    FavoritesBackend.addFavorites(this.state.topicId, "favor_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
        this.getTopic("refresh");
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  addSubscribe() {
    FavoritesBackend.addFavorites(this.state.topicId, "subscribe_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          subscribeStatus: res.data,
        });
        this.getTopic("refresh");
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  deleteFavorite() {
    FavoritesBackend.deleteFavorites(this.state.topicId, "favor_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: !res.data,
        });
        this.getTopic("refresh");
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  deleteSubscribe() {
    FavoritesBackend.deleteFavorites(this.state.topicId, "subscribe_topic").then((res) => {
      if (res.status === "ok") {
        this.setState({
          subscribeStatus: !res.data,
        });
        this.getTopic("refresh");
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  ignoreTopic() {}

  translateTopic() {
    // https://html.spec.whatwg.org/multipage/system-state.html#language-preferences
    // Use navigator.languages to get an array of language tags representing the user's preferred languages

    if (!this.state.translation.translated) {
      TopicBackend.translateTopic(this.state.topicId, navigator.language).then((res) => {
        this.setState((prevState) => {
          prevState.translation.content = res.target;
          prevState.translation.from = res.srcLang;
          prevState.translation.translated = true;
          return prevState;
        });
      });
    } else {
      this.setState({
        translation: {
          translated: false,
        },
      });
    }
  }

  deleteTopic() {
    if (window.confirm("Are you sure to delete this topic?")) {
      TopicBackend.deleteTopic(this.state.topicId).then((res) => {
        if (res) {
          this.props.history.push(this.state.from);
        }
      });
    }
  }

  thanksTopic(id, author) {
    if (window.confirm(`Are you sure to spend ${this.state.topicThanksCost} coins in thanking @${author} for this topic?`)) {
      BalanceBackend.addThanks(id, 1).then((res) => {
        if (res?.status === "ok") {
          this.getTopic("refresh");
        } else {
          alert(res?.msg);
        }
      });
    }
  }

  downVoteTopic() {}

  topTopic(topType) {
    if (this.props.account?.isAdmin || this.state.topic?.nodeModerator) {
      // let time = prompt(i18next.t("topic:How long do you want to top this topic? (minute)"), this.state.defaultTopTopicTime)
      if (window.confirm(`${i18next.t("topic:Are you sure to top this topic?")}`)) {
        TopicBackend.topTopic(this.state.topic?.id, "", topType).then((res) => {
          if (res?.status === "ok") {
            this.getTopic("refresh");
          } else {
            alert(i18next.t(`error:${res?.msg}`));
          }
        });
        return;
      }
      return;
    }

    if (this.state.topic?.topExpiredTime !== "") {
      alert(i18next.t("topic:This topic has been topped"));
      return;
    }

    if (window.confirm(`${i18next.t("topic:Are you sure you want to pin this topic for")} ${this.state.defaultTopTopicTime} ${i18next.t("topic:minutes? The operation price is 200 copper coins.")}`)) {
      TopicBackend.topTopic(this.state.topic?.id, 10, topType).then((res) => {
        if (res?.status === "ok") {
          this.props.history.push("/");
        } else {
          alert(i18next.t(`error:${res?.msg}`));
        }
      });
    }
  }

  upVoteTopic() {}

  openShare() {}

  cancelTopTopic(topType) {
    if (this.props.account?.isAdmin || this.state.topic?.nodeModerator) {
      if (window.confirm(`${i18next.t("topic:Are you sure to cancel top this topic?")}`)) {
        TopicBackend.cancelTopTopic(this.state.topic?.id, topType).then((res) => {
          if (res?.status === "ok") {
            this.getTopic("refresh");
          } else {
            alert(i18next.t(`error:${res?.msg}`));
          }
        });
      }
    }
  }

  renderTopTopic() {
    return (
      <div className="box">
        <div className="inner">
          <div className="fr">
            &nbsp;{" "}
            <a href="javascript:void(0)" onClick={() => {}}>
              {i18next.t("topic:Sink")} ↓
            </a>
            &nbsp;{" "}
            {this.props.account?.isAdmin ? (
              <a href="javascript:void(0)" onClick={() => this.topTopic()}>
                {i18next.t("topic:Top this topic")}
              </a>
            ) : (
              <a href="javascript:void(0)" onClick={() => this.topTopic()}>
                {i18next.t("topic:Top")} {this.state.defaultTopTopicTime} {i18next.t("topic:minutes")}
              </a>
            )}
          </div>
          &nbsp;
        </div>
      </div>
    );
  }

  renderImage = ({alt, src}) => {
    return <Zmage src={src} alt={alt} />;
  };

  renderLink = (props) => {
    const check = Setting.checkPageLink(props.href);
    if (check) {
      return <a {...props} />;
    }
    return <a {...props} target="_blank" rel="nofollow noopener noreferrer" />;
  };

  renderMobileButtons() {
    return (
      <div className="inner">
        <div className="fr" align="right">
          {this.props.account !== undefined && this.props.account !== null ? (
            this.state.favoritesStatus ? (
              <a href="javascript:void(0)" onClick={() => this.deleteFavorite()} className="op">
                {i18next.t("topic:Cancel Favor")}
              </a>
            ) : (
              <a href="javascript:void(0)" onClick={() => this.addFavorite()} className="op">
                {i18next.t("topic:Favor")}
              </a>
            )
          ) : null}{" "}
          &nbsp;
          {this.props.account !== undefined && this.props.account !== null ? (
            this.state.subscribeStatus ? (
              <a href="javascript:void(0)" onClick={() => this.deleteSubscribe()} className="op">
                {i18next.t("topic:Cancel Favor")}
              </a>
            ) : (
              <a href="javascript:void(0)" onClick={() => this.addSubscribe()} className="op">
                {i18next.t("topic:Favor")}
              </a>
            )
          ) : null}{" "}
          &nbsp;
          <a
            href="javascript:void(0)"
            onClick="window.open('https://twitter.com/share?url=https://www.example.com/t/123456?r=username&amp;related=casbinforum&amp;hashtags=inc&amp;text=title', '_blank', 'width=550,height=370'); recordOutboundLink(this, 'Share', 'twitter.com');"
            className="op"
          >
            Tweet
          </a>{" "}
          &nbsp;
          <a href="javascript:void(0)" onClick="shareTopic(``);" className="op">
            Share
          </a>{" "}
          &nbsp;
          <a href="javascript:void(0)" onClick="if (confirm('Are you sure to ignore this topic?')) { location.href = '/ignore/topic/123456?once=39724'; }" className="op">
            {i18next.t("topic:Ignore")}
          </a>{" "}
          &nbsp;
          {this.props.account !== undefined && this.props.account !== null && this.props.account?.name !== this.state.topic?.author ? (
            this.state.topic?.thanksStatus === false ? (
              <div id="topic_thank">
                <a href="javascript:void(0)" onClick={() => this.thanksTopic(this.state.topic?.id, this.state.topic?.author)} className="op">
                  {i18next.t("topic:Thank")}
                </a>
              </div>
            ) : (
              <div id="topic_thank">
                <span className="topic_thanked">{i18next.t("topic:Thanked")}</span>
              </div>
            )
          ) : null}{" "}
          &nbsp;
        </div>{" "}
        &nbsp;{" "}
      </div>
    );
  }

  renderTranslateButton() {
    TranslatorBackend.visibleTranslator().then((res) => {
      let translateBtn = false;
      if (res?.data) {
        translateBtn = true;
      }
      this.setState({
        showTranslateBtn: translateBtn,
      });
    });
  }

  renderDesktopButtons() {
    return (
      <div className="topic_buttons">
        <div className="fr topic_stats" style={{paddingTop: "4px"}}>
          {this.state.topic?.hitCount} {i18next.t("topic:hits")} &nbsp;∙&nbsp; {this.state.topic?.favoriteCount} {i18next.t("topic:favorites")} &nbsp;
        </div>
        {this.props.account !== undefined && this.props.account !== null ? (
          this.state.favoritesStatus ? (
            <a
              href="javascript:void(0)"
              onClick={() => {
                this.deleteFavorite();
              }}
              className="tb"
            >
              {i18next.t("topic:Cancel Favor")}
            </a>
          ) : (
            <a
              href="javascript:void(0)"
              onClick={() => {
                this.addFavorite();
              }}
              className="tb"
            >
              {i18next.t("topic:Favor")}
            </a>
          )
        ) : null}
        &nbsp;
        {this.props.account !== undefined && this.props.account !== null ? (
          this.state.subscribeStatus ? (
            <a
              href="javascript:void(0)"
              onClick={() => {
                this.deleteSubscribe();
              }}
              className="tb"
            >
              {i18next.t("topic:Cancel Subscribe")}
            </a>
          ) : (
            <a
              href="javascript:void(0)"
              onClick={() => {
                this.addSubscribe();
              }}
              className="tb"
            >
              {i18next.t("topic:Subscribe")}
            </a>
          )
        ) : null}
        &nbsp;
        <a href="javascript:void(0)" onClick={() => this.openShare()} className="tb">
          Tweet
        </a>
        &nbsp;
        <a href="javascript:void(0)" onClick={() => this.openShare()} className="tb">
          Weibo
        </a>
        &nbsp;
        <a href="javascript:void(0)" onClick={() => this.ignoreTopic()} className="tb">
          {i18next.t("topic:Ignore")}
        </a>
        &nbsp;
        {this.props.account !== undefined && this.props.account !== null && this.props.account?.name !== this.state.topic?.author ? (
          this.state.topic?.thanksStatus === false ? (
            <div id="topic_thank">
              <a href="javascript:void(0)" onClick={() => this.thanksTopic(this.state.topic?.id, this.state.topic?.author)} className="tb">
                {i18next.t("topic:Thank")}
              </a>
            </div>
          ) : (
            <div id="topic_thank">
              <span className="topic_thanked">{i18next.t("topic:Thanked")}</span>
            </div>
          )
        ) : null}
      </div>
    );
  }

  render() {
    const pcBrowser = Setting.PcBrowser;

    if (this.props.account === undefined || (this.state.topic !== null && this.state.topic.length === 0)) {
      if (!Conf.ShowLoadingIndicator) {
        return null;
      }

      return (
        <div className="box">
          <div className="header">
            {Setting.getHomeLink()} <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Topic is loading")}
          </div>
          <div className="cell">
            <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
          </div>
        </div>
      );
    }

    if (this.state.topic === null) {
      return (
        <div className="box">
          <div className="header">
            {Setting.getHomeLink()} <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Topic not found")}
          </div>
          <div className="cell">
            <span className="gray bigger">404 Topic Not Found</span>
          </div>
          <div className="inner">← {Setting.getHomeLink(i18next.t("error:Back to Home Page"))}</div>
        </div>
      );
    }

    if (this.state.event === "review") {
      if (this.props.account === null || this.props.account?.name !== this.state.topic?.author) {
        this.props.history.push(`/t/${this.state.topic?.id}`);
      }
      return (
        <div className="box">
          <div className="header">
            {Setting.getHomeLink()} <span className="chevron">&nbsp;›&nbsp;</span> <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> <Link to={`/t/${this.state.topic?.id}`}>{pangu.spacing(this.state.topic?.title)}</Link> <span className="chevron">&nbsp;›&nbsp;</span> Review
          </div>
          <div className="cell topic_content markdown_body">
            <p>
              {i18next.t("topic:The new topic has been successfully created on the")} <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link>{" "}
              {i18next.t("topic:node, you can click on the title below to continue to view")}
            </p>
            <h1>
              <Link to={`/t/${this.state.topic?.id}`}>{pangu.spacing(this.state.topic?.title)}</Link>
            </h1>
            <p>
              {i18next.t("topic:Following are some guides to help you better use the topic management related functions of the")} {Setting.getForumName()} {i18next.t("topic:community")}
            </p>
            <ul>
              <li>
                {i18next.t("topic:The topic is currently at")}&nbsp;
                <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link> {i18next.t("topic:node, within 10 minutes after creation, you can")}{" "}
                <Link to={`/move/topic/${this.state.topic?.id}`}>{i18next.t("topic:move freely")}</Link>
              </li>
              <li>
                {i18next.t("topic:If you are not satisfied with the content, within 10 minutes of creation, you can")}
                <Link to={`/edit/topic/${this.state.topic?.id}`}>{i18next.t("topic:edit topic")}</Link>
              </li>
            </ul>
          </div>
          <div className="cell topic_content markdown_body">
            <h3>{i18next.t("topic:Topic meta information")}</h3>
            <table cellPadding="0" cellSpacing="0" border="0" width="100%">
              <tr>
                <td align="right" width="120">
                  ID
                </td>
                <td align="left">{this.state.topic?.id}</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Creator")}</td>
                <td align="left">
                  <UserLink username={this.state.topic?.author} />
                </td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Node")}</td>
                <td align="left">
                  <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link>
                </td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Text syntax format")}</td>
                <td align="left">Markdown</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Hot")}</td>
                <td align="left">{this.state.topic?.hot}</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Topic created")}</td>
                <td align="left">{Setting.getPrettyDate(this.state.topic?.createdTime)}</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Sticky state")}</td>
                <td align="left">否</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Remaining time to top")}</td>
                <td align="left">0</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Movable")}</td>
                <td align="left">{Setting.getBoolConvertedText(this.state.topic?.editable)}</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Editable")}</td>
                <td align="left">{Setting.getBoolConvertedText(this.state.topic?.editable)}</td>
              </tr>
              <tr>
                <td align="right">{i18next.t("topic:Appendable")}</td>
                <td align="left">否</td>
              </tr>
            </table>
          </div>
          <div className="cell topic_content markdown_body">
            <h3>{i18next.t("topic:Related resources")}</h3>
            <ul>
              <li>
                <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link>
                <Link to="/help/currency">{i18next.t("topic:Virtual currency system")}</Link>
              </li>
              <li>
                <Link to="/help/node">{i18next.t("topic:Node usage help")}</Link>
              </li>
              <li>
                <Link to="/help/spam">{i18next.t("topic:Treatment of link handling type spam")}</Link>
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Helmet>
          <title>{`${this.state.topic.title} - ${Setting.getForumName()}`}</title>
          <meta name="keywords" content={this.state.topic?.tags} />
          <meta name="description" content={this.state.topic?.content} />
        </Helmet>
        <div className={`box ${this.state.topic.nodeId}`} style={{borderBottom: "0px"}}>
          <div className={`header ${this.state.topic.nodeId}`}>
            <div className="fr">
              <Avatar username={this.state.topic?.author} size={pcBrowser ? "large" : "middle"} avatar={this.state.topic?.avatar} />
            </div>
            <Link to="/" className={`${this.state.topic?.nodeId}`}>
              {Setting.getForumName()}
            </Link>{" "}
            <span className="chevron">&nbsp;›&nbsp;</span>{" "}
            <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`} className={`${this.state.topic?.nodeId}`}>
              {this.state.topic?.nodeName}
            </Link>
            <div className="sep10" />
            <h1>{this.state.topic?.title}</h1>
            {Setting.PcBrowser ? (
              <span>
                <div id="topic_677954_votes" className="votes">
                  <a href="javascript:void(0)" onClick={this.upVoteTopic()} className={`vote ${this.state.topic.nodeId}`}>
                    <li className="fa fa-chevron-up" />
                  </a>{" "}
                  &nbsp;
                  <a href="javascript:void(0)" onClick={this.downVoteTopic()} className={`vote ${this.state.topic.nodeId}`}>
                    <li className="fa fa-chevron-down" />
                  </a>
                </div>
                &nbsp;{" "}
              </span>
            ) : null}
            <small className="gray">
              <UserLink username={this.state.topic?.author} classNameText={`${this.state.topic.nodeId}`} /> · {Setting.getPrettyDate(this.state.topic?.createdTime)} · {this.state.topic?.hitCount} {i18next.t("topic:hits")}
              &nbsp;{" "}
              {this.props.account?.isAdmin ? (
                <span>
                  {this.state.topic?.homePageTopTime === "" ? (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.topTopic("homePage")} className="op">
                        {i18next.t("topic:HomePageTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  ) : (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.cancelTopTopic("homePage")} className="op">
                        {i18next.t("topic:CancelHomePageTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  )}
                  {this.state.topic?.tabTopTime === "" ? (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.topTopic("tab")} className="op">
                        {i18next.t("topic:TabTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  ) : (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.cancelTopTopic("tab")} className="op">
                        {i18next.t("topic:CancelTabTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  )}
                  {this.state.topic?.nodeTopTime === "" ? (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.topTopic("node")} className="op">
                        {i18next.t("topic:NodeTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  ) : (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.cancelTopTopic("node")} className="op">
                        {i18next.t("topic:CancelNodeTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  )}
                </span>
              ) : this.state.topic?.nodeModerator ? (
                <span>
                  {this.state.topic?.nodeTopTime === "" ? (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.topTopic("node")} className="op">
                        {i18next.t("topic:NodeTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  ) : (
                    <span>
                      <a href="javascript:void(0)" onClick={() => this.cancelTopTopic("node")} className="op">
                        {i18next.t("topic:CancelNodeTop")}
                      </a>
                      &nbsp;{" "}
                    </span>
                  )}
                </span>
              ) : null}
              {this.state.topic?.editable ? (
                <span>
                  <Link to={`/edit/topic/${this.state.topic?.id}`} className="op">
                    {i18next.t("topic:EDIT")}
                  </Link>
                  &nbsp;{" "}
                  <Link to={`/move/topic/${this.state.topic?.id}`} className="op">
                    {i18next.t("topic:MOVE")}
                  </Link>
                  &nbsp;{" "}
                  {this.props.account?.isAdmin || this.state.topic?.nodeModerator ? (
                    <Link onClick={() => this.deleteTopic()} to="javascript:void(0)" className="op">
                      {i18next.t("topic:DELETE")}
                    </Link>
                  ) : null}
                </span>
              ) : null}
            </small>
          </div>
          {this.renderOutdatedProblem()}
          <div className={`cell ${this.state.topic.nodeId}`}>
            <div className={`topic_content ${this.state.topic.nodeId}`}>
              <div className="markdown_body">
                <ReactMarkdown
                  renderers={{
                    image: this.renderImage,
                    link: this.renderLink,
                  }}
                  source={Setting.getFormattedContent(this.state.topic?.content, true)}
                  escapeHtml={false}
                />
                {this.state.showTranslateBtn ? (
                  <a href="javascript:void(0)" onClick={() => this.translateTopic()}>
                    <p style={{margin: 15}}>
                      {this.state.translation.translated ? (
                        <span>
                          {`Translate from ${this.state.translation.from} by  `}
                          <img height={18} src="https://cdn.casbin.org/img/logo_google.svg"></img>
                        </span>
                      ) : (
                        <span>Translate</span>
                      )}
                    </p>
                  </a>
                ) : (
                  ""
                )}
                {this.state.translation.translated ? (
                  <ReactMarkdown
                    renderers={{
                      image: this.renderImage,
                      link: this.renderLink,
                    }}
                    source={Setting.getFormattedContent(this.state.translation.content, true)}
                    escapeHtml={false}
                  />
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
          {Setting.PcBrowser ? this.renderDesktopButtons() : this.renderMobileButtons()}
        </div>
        {pcBrowser ? <div className="sep20" /> : <div className="sep5" />}
        <ReplyBox account={this.props.account} topic={this.state.topic} isEmbedded={false} refreshAccount={this.props.refreshAccount.bind(this)} />
        {pcBrowser ? <div className="sep20" /> : <div className="sep5" />}
        {this.props.account?.isAdmin ? this.renderTopTopic() : null}
      </div>
    );
  }
}

export default withRouter(TopicBox);
