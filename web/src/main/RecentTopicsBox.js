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
import * as TopicBackend from "../backend/TopicBackend";
import TopicList from "./TopicList";
import PageColumn from "./PageColumn";

class RecentTopicsBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topics: [],
      p: "",
      page: 1,
      limit: 25,
      minPage: 1,
      maxPage: -1,
      topicsNum: 1,
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

    this.state.url = `/recent`
  }

  componentDidMount() {
    this.getTopics()
  }

  getTopics() {
    TopicBackend.getTopics(this.state.limit, this.state.page)
      .then((res) => {
        this.setState({
          topics: res
        });
      });
    TopicBackend.getTopicsNum()
      .then((res) => {
        this.setState({
          topicsNum: res
        });
      });
  }

  showPageColumn() {
    if (this.state.maxPage === -1) {
      return
    }
    return (
      <PageColumn page={this.state.page} total={this.state.topicsNum} url={this.state.url}/>
    )
  }

  render() {
    return (
      <div className="box">
        <div className="header">
          <div className="fr f12">
            <span className="fade">{`Total Topics: ${this.state.topicsNum}`}</span>
          </div>
          <a href="/">{Setting.getForumName()}</a>
          <span className="chevron">&nbsp;›&nbsp;</span> Recent Topics
        </div>
        {this.showPageColumn()}
        <TopicList topics={this.state.topics} showNodeName={true} />
        {this.showPageColumn()}
      </div>
    )
  }
}

export default withRouter(RecentTopicsBox);
