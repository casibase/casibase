// Copyright 2021 The casbin Authors. All Rights Reserved.
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
import ReplyBox from "./main/ReplyBox";
import * as TopicBackend from "./backend/TopicBackend";

export default class Embed extends React.Component {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(window.location.search);
    this.state = {
      nodeId: params.get("nodeId"),
      author: params.get("author"),
      encodedUrlPath: params.get("urlPath"),
      title: params.get("title"),
      topic: null,
    };

    if (this.state.nodeId !== null && this.state.encodedUrlPath !== null && this.state.title !== null) {
      TopicBackend.getTopicByUrlPathAndTitle(this.state.nodeId, this.state.encodedUrlPath, this.state.title, this.state.author).then((res) => {
        if (res.status === "ok") {
          this.setState({
            topic: res.data,
          });
        }
      });
    }
  }

  render() {
    if (this.state.topic === null) {
      return "Loading...";
    }
    return <ReplyBox account={this.props.account} topic={this.state.topic} isEmbedded={true} refreshAccount={this.props.refreshAccount.bind(this)} />;
  }
}
