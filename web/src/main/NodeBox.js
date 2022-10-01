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
import * as NodeBackend from "../backend/NodeBackend";
import {Link, withRouter} from "react-router-dom";
import * as TopicBackend from "../backend/TopicBackend";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
import NewNodeTopicBox from "./NewNodeTopicBox";
import "../node.css";
import ReactMarkdown from "react-markdown";
import i18next from "i18next";
import * as Conf from "../Conf";
import {Helmet} from "react-helmet";

class NodeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodeId: props.match.params.nodeId,
      event: props.match.params.event,
      topicNum: 1,
      topics: [],
      p: "",
      page: 1,
      limit: 25,
      minPage: 1,
      maxPage: -1,
      showPages: [],
      favoritesNum: 0,
      favoritesStatus: true,
      nodeInfo: [],
      newModerator: "",
      url: "",
      message: "",
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }

    this.state.url = `/go/${encodeURIComponent(this.state.nodeId)}`;
  }

  componentDidMount() {
    this.getTopics();
    this.getNodeInfo();
    // this.props.getNodeId(this.state.nodeId);
    NodeBackend.addNodeBrowseCount(this.state.nodeId);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      const params = new URLSearchParams(newProps.location.search);
      let page = params.get("p");
      if (page === null) {
        page = 1;
      }
      this.setState(
        {
          page: parseInt(page),
        },
        () => this.getTopics()
      );
    }
  }

  componentWillUnmount() {
    this.props.getNodeBackground("", "", "", "");
  }

  getNodeInfo() {
    NodeBackend.getNode(this.state.nodeId).then((res) => {
      this.setState(
        {
          nodeInfo: res,
        },
        () => {
          this.props.getNodeBackground(this.state.nodeId, this.state.nodeInfo?.backgroundImage, this.state.nodeInfo?.backgroundColor, this.state.nodeInfo?.backgroundRepeat);
        }
      );
    });
    NodeBackend.getNodeInfo(this.state.nodeId).then((res) => {
      if (res.status === "ok") {
        this.setState({
          topicNum: res?.data,
          favoritesNum: res?.data2,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });

    if (this.state.event !== undefined) {
      return;
    }

    FavoritesBackend.getFavoritesStatus(this.state.nodeId, "favor_node").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  getNodeFavoriteStatus() {
    FavoritesBackend.getFavoritesStatus(this.state.nodeId, "favor_node").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  getTopics() {
    if (this.state.event !== undefined) {
      return;
    }

    TopicBackend.getTopicsWithNode(this.state.nodeId, this.state.limit, this.state.page).then((res) => {
      this.setState({
        topics: res,
      });
    });
  }

  addFavorite() {
    FavoritesBackend.addFavorites(this.state.nodeId, "favor_node").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: res.data,
        });
        this.getNodeFavoriteStatus();
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  deleteFavorite() {
    FavoritesBackend.deleteFavorites(this.state.nodeId, "favor_node").then((res) => {
      if (res.status === "ok") {
        this.setState({
          favoritesStatus: !res.data,
        });
        this.getNodeFavoriteStatus();
        this.props.refreshFavorites();
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }

  addNodeModerator(moderator) {
    NodeBackend.addNodeModerators({
      nodeId: this.state.nodeInfo?.id,
      memberId: moderator,
    }).then((res) => {
      if (res?.status === "ok") {
        this.setState({
          message: i18next.t("node:Add moderator success"),
        });
        this.getNodeInfo();
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  deleteNodeModerator(moderator) {
    NodeBackend.deleteNodeModerators({
      nodeId: this.state.nodeInfo?.id,
      memberId: moderator,
    }).then((res) => {
      if (res?.status === "ok") {
        this.setState({
          message: i18next.t("node:Delete moderator success"),
        });
        this.getNodeInfo();
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  inputNewModerator(value) {
    this.setState({
      newModerator: value,
    });
  }

  showPageColumn() {
    if (this.state.topicNum < this.state.limit) {
      return null;
    }

    return <PageColumn page={this.state.page} total={this.state.topicNum} url={this.state.url} nodeId={this.state.nodeId} defaultPageNum={this.state.limit} />;
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  renderMessage() {
    if (this.state.message === "") {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
        <li>{i18next.t(`error:${this.state.message}`)}</li>
      </div>
    );
  }

  renderMobileHeader() {
    return (
      <div className="header">
        <div className="fr f12">
          <span className="snow">{i18next.t("node:Total topics")}</span> <strong className="gray">{this.state.topicNum}</strong> {this.props.account !== null ? <span className="snow">&nbsp;•&nbsp;</span> : null}{" "}
          {this.props.account !== null ? (
            this.state.favoritesStatus ? (
              <a
                onClick={() => {
                  this.deleteFavorite();
                }}
                href="javascript:void(0);"
              >
                {i18next.t("fav:Cancel favorite")}
              </a>
            ) : (
              <a
                onClick={() => {
                  this.addFavorite();
                }}
                href="javascript:void(0);"
              >
                {i18next.t("fav:Add to favorite")}
              </a>
            )
          ) : null}
        </div>
        <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {this.state.nodeInfo?.name}
        <div className="sep5"></div>
        {this.props.account !== null ? (
          <div align="right">
            <input type="button" className="super normal button" value={i18next.t("node:new topic")} onClick={() => this.props.history.push(`/new/${this.state.nodeId}`)} style={{width: "100%", lineHeight: "20px"}} />
          </div>
        ) : null}
      </div>
    );
  }

  renderDesktopHeader() {
    const {nodeInfo, nodeId} = this.state;

    return (
      <div
        className={`node_header ${this.state.nodeId}`}
        style={{
          backgroundImage: "url(" + this.state.nodeInfo?.headerImage + ")",
        }}
      >
        <div className="node_avatar">
          <div
            style={{
              float: "left",
              display: "inline-block",
              marginRight: "10px",
              marginBottom: "initial!important",
            }}
          >
            <img src={nodeInfo?.image} border="0" align="default" width="72" alt={nodeInfo?.nodeName} />
          </div>
        </div>
        <div className="node_info">
          <div className="fr f12">
            <span className="gray">
              {this.state.nodeInfo?.moderators !== null && this.state.nodeInfo?.moderators.length !== 0 ? (
                <span>
                  {this.props.account?.isAdmin ? <Link to={`/go/${encodeURIComponent(this.state.nodeId)}/moderators`}>{i18next.t("node:Moderator")}</Link> : <span>{i18next.t("node:Moderator")}</span>}
                  {this.state.nodeInfo?.moderators.map((member) => {
                    return (
                      <span key={member}>
                        {" "}
                        <Link to={`/member/${member}`} target="_blank">
                          {member}
                        </Link>
                      </span>
                    );
                  })}
                </span>
              ) : this.props.account?.isAdmin ? (
                <Link to={this.props.account?.isAdmin ? `/go/${encodeURIComponent(this.state.nodeId)}/moderators` : null}>{i18next.t("node:No moderators")}</Link>
              ) : (
                <span>{i18next.t("node:No moderators")}</span>
              )}{" "}
              &nbsp;
            </span>
            <span>{i18next.t("node:Total topics")}&nbsp;</span>
            <strong>{this.state.topicNum}</strong>
            {this.props.account !== null ? <span className="snow">&nbsp;•&nbsp;</span> : null}
            {this.props.account !== null ? (
              this.state.favoritesStatus ? (
                <a
                  onClick={() => {
                    this.deleteFavorite();
                  }}
                  href="#"
                  className="node_header_link"
                >
                  {i18next.t("fav:Cancel favorite")}
                </a>
              ) : (
                <a
                  onClick={() => {
                    this.addFavorite();
                  }}
                  href="#"
                  className="node_header_link"
                >
                  {i18next.t("fav:Add to favorite")}
                </a>
              )
            ) : null}
            <div>{this.state.nodeInfo.mailingList === "" ? i18next.t("node:No mailing list yet") : <a href={"https://groups.google.com/g/" + this.state.nodeInfo.mailingList.split("@")[0]}>{this.state.nodeInfo.mailingList}</a>}</div>
          </div>
          <Link to="/" className={`${this.state.nodeId}`}>
            {Setting.getForumName()}
          </Link>
          <span className="chevron">&nbsp;›&nbsp;</span>
          {nodeInfo?.name}
          <div className="sep20" />
          <div className="sep5" />
          {this.props.account !== null ? (
            <div className="fr" style={{paddingLeft: "10px"}}>
              <input
                type="button"
                className="super normal button"
                value={i18next.t("node:new topic")}
                onClick={() => {
                  this.props.history.push(`/new/${nodeId}`);
                }}
              />
            </div>
          ) : null}
          <span className="f12">
            <ReactMarkdown
              renderers={{
                image: Setting.renderImage,
                link: Setting.renderLink,
              }}
              source={nodeInfo?.desc}
              escapeHtml={false}
            />
          </span>
          <div className="sep10"></div>
          <div className="node_header_tabs">
            <Link to={`/go/${encodeURIComponent(nodeId)}`} className={!this.props.match.params.event ? "node_header_tab_current" : "node_header_tab"}>
              {i18next.t("node:All topics")}
            </Link>
            <Link to={`/go/${encodeURIComponent(nodeId)}/links`} className={this.props.match.params.event ? "node_header_tab_current" : "node_header_tab"}>
              {i18next.t("node:Related links")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  renderNode() {
    const {page, limit} = this.state;
    let from;
    if (this.state.topicNum !== 0) {
      from = (page - 1) * limit + 1;
    } else {
      from = 0;
    }
    const end = (page - 1) * limit + this.state.topics.length;

    return (
      <div className={`box ${this.state.nodeId}`}>
        {Setting.PcBrowser ? this.renderDesktopHeader() : this.renderMobileHeader()}
        {Setting.PcBrowser ? this.showPageColumn() : null}
        <TopicList nodeId={this.state.nodeId} topics={this.state.topics} showNodeName={false} showAvatar={true} topType={"node"} />
        {this.showPageColumn()}
        <div className="cell" align="center">
          <div className="fr">{`${this.state.favoritesNum} ${i18next.t("node:members have added this node to favorites")}`}</div>
          <span className="gray">{`${i18next.t("node:Topic")} ${from} ${i18next.t("node:to")} ${end} ${i18next.t("node:of all")} ${this.state.topicNum} ${i18next.t("node:topics")}`}</span>
        </div>
      </div>
    );
  }

  renderNodeModerators(moderators) {
    return (
      <tr>
        <td width="120" align="right"></td>
        <td width="auto" align="left">
          <Link to={`/member/${moderators}`} style={{fontWeight: "bolder"}} target="_blank">
            {moderators}
          </Link>
        </td>
        <td width="auto" align="left">
          <a
            onClick={() => {
              this.deleteNodeModerator(moderators);
            }}
            href="javascript:void(0);"
          >
            {i18next.t("node:Cancel moderator permissions")}
          </a>
        </td>
      </tr>
    );
  }

  render() {
    const pcBrowser = Setting.PcBrowser;

    if (this.state.nodeInfo !== null && this.state.nodeInfo.length === 0) {
      if (!Conf.ShowLoadingIndicator) {
        return null;
      }

      return (
        <div id={pcBrowser ? "Main" : ""}>
          <div className="box">
            <div className="header">
              <Link to="/">{Setting.getForumName()}</Link>
              <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Node is loading")}
            </div>
            <div className="cell">
              <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.nodeInfo === null) {
      return (
        <div id={pcBrowser ? "Main" : ""}>
          <div className="sep20"></div>
          <div className="box">
            <div className="header">
              <Link to="/">{Setting.getForumName()}</Link>
              <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Node not found")}
            </div>
            <div className="cell">
              {i18next.t("error:The node you are trying to view does not exist, there are several possibilities")}
              <div className="sep10"></div>
              <ul>
                <li>{i18next.t("error:You entered a node ID that does not exist.")}</li>
                <li>{i18next.t("error:The node is currently in invisible state.")}</li>
              </ul>
            </div>
            <div className="inner">
              {this.props.account === null ? (
                <span className="gray">
                  <span className="chevron">‹</span> &nbsp;
                  {i18next.t("error:Back to")} <Link to="/">{i18next.t("error:Home Page")}</Link>
                </span>
              ) : (
                <span className="gray">
                  <span className="chevron">‹</span> &nbsp;
                  {i18next.t("error:Back to")} <Link to="/">{i18next.t("error:Home Page")}</Link>
                  <br />
                  <span className="chevron">‹</span> &nbsp;
                  {i18next.t("error:Back to")} <Link to={`/member/${this.props.account?.name}`}>{i18next.t("error:My profile")}</Link>
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (this.state.event === "moderators") {
      if (this.props.account === undefined) {
        return null;
      }
      if (this.props.account === null || !this.props.account?.isAdmin) {
        this.props.history.push(Setting.getSigninUrl());
      }

      return (
        <div className={`box ${this.state.nodeId}`}>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("node:Moderator Management")}
          </div>
          {this.renderMessage()}
          <div className="cell">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width="120" align="right">
                    {i18next.t("node:Node name")}
                  </td>
                  <td width="auto" align="left">
                    {this.state.nodeInfo?.name}
                  </td>
                </tr>
                {this.state.nodeInfo?.moderators !== null && this.state.nodeInfo?.moderators.length !== 0 ? (
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Moderators")}
                    </td>
                    <td width="auto" align="left">
                      <Link to={`/member/${this.state.nodeInfo?.moderators[0]}`} style={{fontWeight: "bolder"}} target="_blank">
                        {this.state.nodeInfo?.moderators[0]}
                      </Link>
                    </td>
                    <td width="auto" align="left">
                      <a
                        onClick={() => {
                          this.deleteNodeModerator(this.state.nodeInfo?.moderators[0]);
                        }}
                        href="javascript:void(0);"
                      >
                        {i18next.t("node:Cancel moderator permissions")}
                      </a>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("node:Moderators")}
                    </td>
                    <td width="auto" align="left">
                      <span className="gray">{i18next.t("node:No moderators")}</span>
                    </td>
                  </tr>
                )}
                {this.state.nodeInfo?.moderators !== null ? this.state.nodeInfo?.moderators.slice(1).map((moderators) => this.renderNodeModerators(moderators)) : null}
              </tbody>
            </table>
          </div>
          <div className="cell">
            <table cellPadding="5" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width="120" align="right">
                    {i18next.t("node:Add moderator")}
                  </td>
                  <td width="auto" align="left">
                    <input type="text" className="sl" name="title" maxLength="64" value={this.state.newModerator} onChange={(event) => this.inputNewModerator(event.target.value)} />
                  </td>
                </tr>
                <tr>
                  <td width="120" align="right"></td>
                  <td width="auto" align="left">
                    <input type="submit" className="super normal button" value={i18next.t("node:Add")} onClick={() => this.addNodeModerator(this.state.newModerator)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div id={pcBrowser ? "Main" : ""}>
        <Helmet>
          <title>{`${this.state.nodeInfo.name} - ${Setting.getForumName()}`}</title>
          <meta name="keywords" content={`${this.state.nodeInfo.id},${this.state.nodeInfo.name}`} />
          <meta name="description" content={this.state.nodeInfo.desc} />
        </Helmet>
        {pcBrowser ? <div className="sep20" /> : null}
        {this.renderNode()}
        {pcBrowser ? <div className="sep20" /> : null}
        {this.props.account !== undefined && this.props.account !== null && pcBrowser ? <NewNodeTopicBox nodeId={this.state.nodeId} account={this.props.account} size={"small"} refreshAccount={this.props.refreshAccount.bind(this)} /> : null}
      </div>
    );
  }
}

export default withRouter(NodeBox);
