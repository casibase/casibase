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
import "../node.css";
import "./rightNodeRelation.css";
import Collapse, {Panel} from "rc-collapse";
import i18next from "i18next";

class RightNodeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodeId: props.match.params.nodeId,
      info: null,
      showRelatedNode: false,
      showChildNode: false,
    };
  }

  componentDidMount() {
    this.getNodeRelation();
  }

  getNodeRelation() {
    NodeBackend.getNodeRelation(this.state.nodeId).then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  changeShowRelatedNode() {
    this.setState({
      showRelatedNode: !this.state.showRelatedNode,
    });
  }

  changeShowChildNode() {
    this.setState({
      showRelatedNode: !this.state.showChildNode,
    });
  }

  renderNodes(node) {
    return (
      <div key={node?.id} className="node rightFavorite node-casbin">
        <div className="node_compose rightFavorite">
          <Link to={`/new/${node?.id}`} id="linkCompose">
            <img src={Setting.getStatic("/img/compose.png")} align="absmiddle" border="0" width="23" height="18" alt="New Topic" />
          </Link>
        </div>
        <Link to={`/go/${encodeURIComponent(node?.id)}`} id="linkAvatar">
          <div id="avatar" style={{backgroundImage: `url(${node?.image})`}} className="rightFavorite" />
        </Link>
        &nbsp;{" "}
        <Link to={`/go/${encodeURIComponent(node?.id)}`} id="linkTitle">
          {node?.name}
        </Link>
      </div>
    );
  }

  render() {
    const relatedNum = this.state.info?.relatedNode?.length;
    const childNum = this.state.info?.childNode?.length;

    return (
      <div className={`box ${this.state.nodeId}`}>
        <div className="inner">
          <strong className="gray">{i18next.t("bar:Parent node")}</strong>
          <div className="sep10"></div>
          {this.renderNodes(this.state.info?.parentNode)}
        </div>
        {relatedNum !== 0 ? (
          <span>
            <div className="cell-top">
              <span className="f12 gray">
                <div className="fr">{this.state.info?.relatedNode.length}</div>
                {i18next.t("bar:Related nodes")}
              </span>
            </div>
            <div className="nodes-sidebar-container">
              {this.state.info?.relatedNode.slice(0, 5).map((node) => {
                return this.renderNodes(node);
              })}
              {relatedNum > 5 ? (
                <Collapse onChange={() => this.changeShowRelatedNode()}>
                  <Panel
                    header={
                      <span>
                        <i className={this.state.showRelatedNode ? "fa fa-caret-down" : "fa fa-caret-right"}>
                          {" "}
                          &nbsp;
                          <span>{this.state.showRelatedNode ? `${i18next.t("bar:Collapse the extra nodes below")}` : `${i18next.t("bar:show")} ${relatedNum - 5} ${i18next.t("bar:more related nodes")}`}</span>
                        </i>
                      </span>
                    }
                    showArrow={false}
                    className="toggle-more-nodes"
                  >
                    {this.state.info?.relatedNode.slice(5, relatedNum).map((node) => {
                      return this.renderNodes(node);
                    })}
                  </Panel>
                </Collapse>
              ) : null}
            </div>
          </span>
        ) : null}
        {childNum !== 0 ? (
          <span>
            <div className="cell-top">
              <span className="f12 gray">
                <div className="fr">{childNum}</div>
                {i18next.t("bar:Child nodes")}
              </span>
            </div>
            <div className="nodes-sidebar-container">
              {this.state.info?.childNode.slice(0, 5).map((node) => {
                return this.renderNodes(node);
              })}
              {childNum > 5 ? (
                <Collapse onChange={() => this.changeShowChildNode()}>
                  <Panel
                    header={
                      <span>
                        <i className={this.state.showChildNode ? "fa fa-caret-down" : "fa fa-caret-right"}>
                          {" "}
                          &nbsp;
                          <span>{this.state.showChildNode ? `${i18next.t("bar:Collapse the extra nodes below")}` : `${i18next.t("bar:show")} ${childNum - 5} ${i18next.t("bar:more child nodes")}`}</span>
                        </i>
                      </span>
                    }
                    showArrow={false}
                    className="toggle-more-nodes"
                  >
                    {this.state.info?.childNode.slice(5, childNum).map((node) => {
                      return this.renderNodes(node);
                    })}
                  </Panel>
                </Collapse>
              ) : null}
            </div>
          </span>
        ) : null}
      </div>
    );
  }
}

export default withRouter(RightNodeBox);
