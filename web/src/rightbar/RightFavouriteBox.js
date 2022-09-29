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
import * as FavoritesBackend from "../backend/FavoritesBackend";
import {Link} from "react-router-dom";
import "./rightFavourite.css";
import i18next from "i18next";

class RightFavouriteBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
    };
  }

  componentDidMount() {
    this.getFavoriteNode();
  }

  getFavoriteNode() {
    FavoritesBackend.getFavorites("favor_node", 0, 0).then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  renderNodes(node) {
    return (
      <div key={node?.id} className="node rightFavorite">
        <div className="node_compose rightFavorite">
          <Link to={`/new/${node?.id}`} id="linkCompose">
            <img src={Setting.getStatic("/img/compose.png")} align="absmiddle" border="0" width="23" height="18" alt="New Topic" />
          </Link>
        </div>
        <Link to={`/go/${encodeURIComponent(node?.id)}`} id="linkAvatar">
          <div id="avatar" style={{backgroundImage: `url(${node?.image})`}} className="rightFavorite" />
        </Link>
        &nbsp;{" "}
        <span to={`/go/${encodeURIComponent(node?.id)}`} id="linkTitle">
          {node?.name}
        </span>
      </div>
    );
  }

  render() {
    return (
      <div className="box">
        <div className="inner">
          <span className="f12 gray">{i18next.t("bar:My Favorite Nodes")}</span>
        </div>
        <div className="inner" id="nodes-sidebar">
          {this.state.info?.map((node) => {
            return this.renderNodes(node?.nodeInfo);
          })}
        </div>
      </div>
    );
  }
}

export default RightFavouriteBox;
