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
import * as PlaneBackend from "../backend/PlaneBackend";
import * as NodeBackend from "../backend/NodeBackend";
import * as Setting from "../Setting";
import {Link} from "react-router-dom";
import i18next from "i18next";
import {Helmet} from "react-helmet";

class PlaneBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      planes: [],
      nodesNum: 0,
    };
  }

  componentDidMount() {
    this.getPlaneList();
    this.getNodesNum();
  }

  getPlaneList() {
    PlaneBackend.getPlaneList().then((res) => {
      this.setState({
        planes: res?.data,
      });
    });
  }

  getNodesNum() {
    NodeBackend.getNodesNum().then((res) => {
      this.setState({
        nodesNum: res?.data,
      });
    });
  }

  renderNode(node) {
    return (
      <Link key={node?.id} to={`/go/${encodeURIComponent(node?.id)}`} className="item_node">
        {node?.name}
      </Link>
    );
  }

  renderPlane(plane) {
    return (
      <span key={plane?.id}>
        <div className="sep20"></div>
        <div className="box">
          <div
            className="header"
            style={{
              backgroundColor: plane?.backgroundColor,
              color: plane?.color,
            }}
          >
            <img src={plane?.image} border="0" align="absmiddle" width="24" /> &nbsp; {plane?.name}
            <span className="fr" style={{color: plane?.color, lineHeight: "20px"}}>
              {plane?.id} •{" "}
              <span className="small">
                {plane?.nodes.length} {i18next.t("plane:nodes")}
              </span>
            </span>
          </div>
          <div className="inner">
            {plane?.nodes.map((node) => {
              return this.renderNode(node);
            })}
          </div>
        </div>
      </span>
    );
  }

  render() {
    return (
      <span>
        <div className="box">
          <Helmet>
            <title>{`${i18next.t("plane:Plane list")} - ${Setting.getForumName()}`}</title>
          </Helmet>
          <div className="cell" style={{padding: "0px"}}>
            <table cellPadding="10" cellSpacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td width="64">
                    <img src={Setting.getStatic("/img/network.png")} width="64" alt="Nodes" />
                  </td>
                  <td>
                    <span className="item_title">
                      {Setting.getForumName()} {i18next.t("plane:Plane list")}
                    </span>
                    <div className="sep5"></div>
                    <span className="fade">
                      {this.state.nodesNum} {i18next.t("plane:nodes now and growing.")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {this.state.planes?.map((plane) => {
          return this.renderPlane(plane);
        })}
      </span>
    );
  }
}

export default PlaneBox;
