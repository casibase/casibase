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
import {withRouter} from "react-router-dom";
import * as FavoritesBackend from "../backend/FavoritesBackend";
import RenderTopics from "./RenderTopics";
import PageColumn from "./PageColumn";
import * as NodeBackend from "../backend/NodeBackend";

class FavoritesBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      favoritesType: props.match.params.favorites,
      favorites: [],
      p: "",
      page: 1,
      limit: 10,
      minPage: 1,
      maxPage: -1,
      favoritesNum: 10,
      temp: 0,
      url: ""
    };
    const params = new URLSearchParams(this.props.location.search)
    this.state.p = params.get("p")
    if (this.state.p === null) {
      this.state.page = 1
    }else {
      this.state.page = parseInt(this.state.p)
    }

    this.state.url = `/my/${this.state.favoritesType}`
  }

  componentDidMount() {
    this.getFavoritesInfo()
  }

  getFavoritesInfo() {
    let favoritesType
    switch (this.state.favoritesType) {
      case "topics": favoritesType = 1; break;
      case "following": favoritesType = 2; break;
      case "node": favoritesType = 3; break;
      default: return
    }
    FavoritesBackend.getFavorites(favoritesType, this.state.limit, this.state.page)
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            favorites: res.data,
            favoritesNum: res.data2,
          });
        }
      });
  }

  renderNodes(node) {
    return (
      <a className="grid_item" href={`/go/${node?.nodeInfo.id}`}>
        <div style={{
          display: "table",
          padding: "20px 0px 20px 0px",
          width: "100%",
          textAlign: "center",
          fontSize: "14px"
        }}>
          <img src={node?.nodeInfo.image} border="0" align="default" width="73" alt={node?.nodeInfo.name}/>
          <div className="sep10"></div>
          {node?.nodeInfo.name}
          <div className="sep5"></div>
          <span className="fade f12">
            <li className="fa fa-comments"></li>
            {node?.topicNum}
          </span>
        </div>
      </a>
    )
  }

  showPageColumn() {
    if (this.state.maxPage === -1) {
      return
    }
    return (
      <PageColumn page={this.state.page} total={this.state.favoritesNum} url={this.state.url}/>
    )
  }

  render() {
    switch (this.state.favoritesType) {
      case "node":
        return (
          <div className="box">
            <div className="header">
              <a href="/">{Setting.getForumName()}</a>
              <span className="chevron">&nbsp;›&nbsp;</span> My favorite nodes
              <div className="fr f12">
                <span className="snow">Total nodes: &nbsp;</span>
                <strong className="gray">{this.state.favoritesNum}</strong></div>
            </div>
            <div id="my-nodes">
              {
                this.state.favorites.map((node) => {
                  return this.renderNodes(node);
                })
              }
            </div>
          </div>
        )
      case "topics":
        return (
          <div className="box">
            <div className="header">
              <a href="/">{Setting.getForumName()}</a>
              <span className="chevron">&nbsp;›&nbsp;</span> My favorite topics
              <div className="fr f12">
                <span className="snow">Total topics: &nbsp;</span>
                <strong className="gray">{this.state.favoritesNum}</strong></div>
            </div>
            <RenderTopics topics={this.state.favorites}/>
          </div>
        )
      case "following":
        return (
          <div className="box">
            <div className="header">
              <a href="/">{Setting.getForumName()}</a>
              <span className="chevron">&nbsp;›&nbsp;</span> Latest topics from people I followed
              <div className="fr f12">
                <span className="snow">Total topics: &nbsp;</span>
                <strong className="gray">{this.state.favoritesNum}</strong></div>
            </div>
            {this.showPageColumn()}
            <RenderTopics topics={this.state.favorites}/>
            {this.showPageColumn()}
          </div>
        )
    }
    return (
      <div className="box">
        {this.state.favoritesType}
      </div>
    )
  }
}

export default withRouter(FavoritesBox);
