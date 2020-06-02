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
import {Avatar, Col, Progress, Row, Space, Statistic, Switch} from "antd";
import { UserOutlined, FormOutlined } from '@ant-design/icons';
import * as NodeBackend from "./backend/NodeBackend";

class NodeWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: [],
    };
  }

  componentDidMount() {
    this.getNodes();
  }

  getNodes() {
    NodeBackend.getNodes()
      .then((res) => {
          this.setState({
            nodes: res,
          });
        }
      );
  }

  render() {
    return (
      <div style={{backgroundColor: "white"}}>
        <div className="theme-cell-top">
          All Nodes
        </div>
        <div>
          {
            this.state.nodes.map((node, i) => {
              return (
                <div style={{padding: "5px 10px 5px 10px"}}>
                  <div className="theme-cell-node" style={{backgroundImage: `url("${node.image}")`}}/>
                  &nbsp; {node.title}
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }

}

export default NodeWidget;
