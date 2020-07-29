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
import {withRouter} from "react-router-dom";
import * as TopicBackend from "../backend/TopicBackend";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import PageColumn from "./PageColumn";
import TopicList from "./TopicList";
import NewNodeTopicBox from "./NewNodeTopicBox";
import "../node.css"
import i18next from "i18next";
import ReactMarkdown from "react-markdown";

class NodeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodeId: props.match.params.nodeId,
      topicNum: 1,
      topics: [],
      p: "",
      page: 1,
      limit: 20,
      minPage: 1,
      maxPage: -1,
      showPages: [],
      favoritesNum: 1,
      favoritesStatus: true,
      nodeInfo: [],
      url: "",
    };
    const params = new URLSearchParams(this.props.location.search)
    this.state.p = params.get("p")
    if (this.state.p === null) {
      this.state.page = 1
    }else {
      this.state.page = parseInt(this.state.p)
    }

    this.state.url = `/go/${this.state.nodeId}`
  }

  componentDidMount() {
    this.getTopics();
    this.getNodeInfo();
    this.props.getNodeId(this.state.nodeId);
    NodeBackend.addNodeBrowseCount(this.state.nodeId);
  }

  getNodeInfo() {
    NodeBackend.getNode(this.state.nodeId)
      .then((res) => {
        this.setState({
          nodeInfo: res,
        });
      });
    NodeBackend.getNodeInfo(this.state.nodeId)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            topicNum: res?.data,
            favoritesNum: res?.data2
          });
        }else {
          Setting.showMessage("error", res.msg)
        }
      });
    FavoritesBackend.getFavoritesStatus(this.state.nodeId, 3)
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

  getTopics() {
    TopicBackend.getTopicsWithNode(this.state.nodeId, this.state.limit, this.state.page)
      .then((res) => {
        this.setState({
          topics: res,
        });
      });
  }

  addFavorite() {
    FavoritesBackend.addFavorites(this.state.nodeId, 3)
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
    FavoritesBackend.deleteFavorites(this.state.nodeId, 3)
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

  showPageColumn() {
    return (
      <PageColumn page={this.state.page} total={this.state.favoritesNum} url={this.state.url} nodeId={this.state.nodeId} />
    )
  }

  renderNode() {
    const {nodeInfo, nodeId, page, limit} = this.state
    let from, end
    if (this.state.topicNum !== 0) {
      from = (page - 1) * limit + 1
    }else {
      from = 0
    }
    end = (page - 1) * limit + this.state.topics.length

    return (
      <div className={`box ${this.state.nodeId}`}>
        <div className={`node_header ${this.state.nodeId}`}>
          <div className="node_avatar">
            <div style={{float: "left", display: "inline-block", marginRight: "10px", marginBottom: "initial!important"}}>
              <img src={nodeInfo?.image} border="0" align="default" width="72" alt={nodeInfo?.nodeName}/></div>
          </div>
          <div className="node_info">
            <div className="fr f12"><span>{i18next.t("node:Total topics")}&nbsp;</span>
              <strong>{this.state.topicNum}</strong>
              {this.props.account !== null ? <span className="snow">&nbsp;•&nbsp;</span> : null}
              {
                this.props.account !== null ?
                  this.state.favoritesStatus ? <a onClick={() => {this.deleteFavorite()}} href="javascript:void(0)" className="node_header_link">{i18next.t("fav:Cancel favorite")}</a> : <a onClick={() => {this.addFavorite()}} href="javascript:void(0)" className="node_header_link">{i18next.t("fav:Add to favorite")}</a> :
                  null
              }
            </div>
            <a href="/" className={`${this.state.nodeId}`} >{Setting.getForumName()}</a>
            <span className="chevron">&nbsp;›&nbsp;</span>
            {nodeInfo?.name}
            <div className="sep10"></div>
            <div className="sep5"></div>
            <div className="fr" style={{paddingLeft: "10px"}}>
              <input type="button" className="super normal button" value={i18next.t("node:new topic")}
                     onClick={()=> {Setting.goToLink(`/new/${nodeId}`)}}/>
            </div>
            <span className="f12"><ReactMarkdown source={nodeInfo?.desc} escapeHtml={false} /></span>
            <div className="sep10"></div>
            <div className="node_header_tabs"><a href={`/go/${nodeId}`} className="node_header_tab_current">{i18next.t("node:All topics")}</a>
              <a href={`/go/${nodeId}/links`} className="node_header_tab">{i18next.t("node:Related links")}</a>
            </div>
          </div>
        </div>
        {this.showPageColumn()}
        <TopicList nodeId={this.state.nodeId} topics={this.state.topics} showNodeName={false} showAvatar={true} />
        {this.showPageColumn()}
        <div className="cell" align="center">
          <div className="fr">{`${this.state.favoritesNum} ${i18next.t("node:members have added this node to favorites")}`}</div>
          <span className="gray">{`${i18next.t("node:Topic")} ${from} ${i18next.t("node:to")} ${end} ${i18next.t("node:of all")} ${this.state.topicNum} ${i18next.t("node:topics")}`}</span>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.nodeInfo !== null && this.state.nodeInfo.length === 0) {
      return (
        <div className="box">
          <div className="header"><a href="/">{Setting.getForumName()}</a><span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("loading:Node is loading")}</div>
          <div className="cell"><span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span></div>
        </div>
      )
    }

    if (this.state.nodeInfo === null) {
      return (
        <div id="Main">
          <div class="sep20"></div>
          <div class="box">
            <div class="header">
              <a href="/">{Setting.getForumName()}</a>
              <span className="chevron">&nbsp;›&nbsp;</span>{" "}{i18next.t("error:Node not found")}</div>
            <div class="cell">
              {i18next.t("error:The node you are trying to view does not exist, there are several possibilities")}
              <div class="sep10"></div>
              <ul>
                <li>{i18next.t("error:You entered a node ID that does not exist.")}</li>
                <li>{i18next.t("error:The node is currently in invisible state.")}</li>
              </ul>
            </div>
            <div class="inner">
              {
                this.props.account === null ?
                  <span className="gray">
                    <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a href="/">{i18next.t("error:Home Page")}</a>
                  </span> :
                  <span className="gray">
                    <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a href="/">{i18next.t("error:Home Page")}</a>
                    <br/>
                    <span className="chevron">‹</span>{" "}&nbsp;{i18next.t("error:Back to")}{" "}<a
                    href={`/member/${this.props.account?.id}`}>{i18next.t("error:My profile")}</a>
                  </span>
              }
            </div>
          </div>
        </div>
      )
    }

    return (
      <div id="Main">
        <div className="sep20" />
        {this.renderNode()}
        <div className="sep20" />
        <NewNodeTopicBox nodeId={this.state.nodeId} size={"small"} />
      </div>
    )
  }
}

export default withRouter(NodeBox);
