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
import {withRouter} from "react-router-dom";
import * as SearchBackend from "./backend/SearchBackend";
import TopicList from "./main/TopicList";
import i18next from "i18next";

class SearchResultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      keyword: new URLSearchParams(this.props.location.search).get("keyword"),
      topics: [],
      msg: i18next.t("search:loading..."),
    };
  }

  componentDidMount() {
    SearchBackend.search(this.state.keyword).then((res) => this.updateSearchResult(res));
  }

  UNSAFE_componentWillMount() {
    this.props.history.listen((route) => {
      const params = route.search.split("=");
      if (params.length < 2) {
        return;
      }
      this.setState(
        {
          keyword: params[1],
          msg: i18next.t("search:loading..."),
          topics: [],
        },
        () => SearchBackend.search(this.state.keyword).then((res) => this.updateSearchResult(res))
      );
    });
  }

  updateSearchResult(res) {
    if (res.status === "ok") {
      this.setState({
        topics: res.data,
        msg: i18next.t("search:Search result of ") + this.state.keyword,
      });
    }
  }

  renderResult() {
    if (this.state.topics === null) {
      return (
        <div className="cell" id="SecondaryTabs" style={{padding: "10px"}}>
          {i18next.t("search:No topics found")}
        </div>
      );
    }

    if (this.state.topics.length === 0) {
      return null;
    }

    return <TopicList topics={this.state.topics} showNodeName={true} showAvatar={true} />;
  }

  render() {
    return (
      <div>
        <div className="cell" id="SecondaryTabs" style={{padding: "10px"}}>
          {this.state.msg}
        </div>
        {this.renderResult()}
      </div>
    );
  }
}

export default withRouter(SearchResultPage);
