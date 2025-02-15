// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import NodeTree from "./component/access/NodeTree";
import RemoteDesktop from "./component/access/RemoteDesktop";

class NodeWorkbench extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedNode: null,
      nodeTreeWidth: 240,
      isFullScreen: false,
    };
  }

  handleNodeSelect = (nodeId) => {
    const arr = nodeId.split("/");
    const node = {owner: arr[0], name: arr[1]};
    this.setState({
      selectedNode: node,
    });
  };

  toggleFullScreen = () => {
    this.setState({
      isFullScreen: !this.state.isFullScreen,
    });
  };

  render() {
    const {nodeTreeWidth} = this.state;

    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#f5f5f5",
        }}>
        <div style={{width: nodeTreeWidth, background: "#fff"}}>
          <NodeTree onSelect={this.handleNodeSelect} account={this.props.account} />
        </div>
        <div style={{width: "100%", overflow: "hidden"}} >
          <RemoteDesktop
            node={this.state.selectedNode}
            toggleFullscreen={this.toggleFullScreen}
          />
        </div>
      </div>
    );
  }
}

export default NodeWorkbench;
