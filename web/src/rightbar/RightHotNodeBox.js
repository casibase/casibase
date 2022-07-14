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
import {Link} from "react-router-dom";
import i18next from "i18next";

class RightHotNodeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
      limit: 15,
    };
  }

  componentDidMount() {
    this.getHotNode();
  }

  getHotNode() {
    NodeBackend.getHotNode(this.state.limit).then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  renderNodes(node) {
    return (
      <div key={node?.id}>
        <Link to={`/go/${encodeURIComponent(node?.id)}`} className="item_node">
          {node?.name}
        </Link>
      </div>
    );
  }

  render() {
    return (
      <div className="box">
        <div className="cell">
          <div className="fr"></div>
          <span className="fade">{i18next.t("bar:Hottest Nodes")}</span>
        </div>
        <div className="cell">
          {this.state.info?.map((node) => {
            return this.renderNodes(node);
          })}
        </div>
        <div className="inner">
          <a href="/index.xml" target="_blank" rel="noopener noreferrer">
            <img src={Setting.getStatic("/img/rss.png")} align="absmiddle" border="0" style={{marginTop: "-3px"}} />
          </a>
          &nbsp;
          <a href="/index.xml" target="_blank" rel="noopener noreferrer">
            RSS
          </a>
        </div>
      </div>
    );
  }
}

export default RightHotNodeBox;
