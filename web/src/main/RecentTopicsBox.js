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
import {Link, withRouter} from "react-router-dom";
import * as TopicBackend from "../backend/TopicBackend";
import TopicList from "./TopicList";
import PageColumn from "./PageColumn";
import i18next from "i18next";
import {Helmet} from "react-helmet";

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
      topicsNum: 0,
      temp: 0,
      url: "",
    };
    const params = new URLSearchParams(this.props.location.search);
    this.state.p = params.get("p");
    if (this.state.p === null) {
      this.state.page = 1;
    } else {
      this.state.page = parseInt(this.state.p);
    }

    this.state.url = "/recent";
  }

  componentDidMount() {
    this.getTopics();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      const params = new URLSearchParams(newProps.location.search);
      let page = params.get("p");
      if (page === null) {
        page = 1;
      }
      this.setState(
        {
          page: parseInt(page),
        },
        () => this.getTopics()
      );
    }
  }

  getTopics() {
    TopicBackend.getTopics(this.state.limit, this.state.page).then((res) => {
      this.setState({
        topics: res,
      });
    });
    if (this.state.topicsNum !== 0) {
      return;
    }
    TopicBackend.getTopicsNum().then((res) => {
      this.setState({
        topicsNum: res,
      });
    });
  }

  showPageColumn() {
    if (this.state.topicsNum < this.state.limit) {
      return;
    }

    return <PageColumn page={this.state.page} total={this.state.topicsNum} url={this.state.url} defaultPageNum={this.state.limit} />;
  }

  render() {
    return (
      <div className="box">
        <Helmet>
          <title>{`${i18next.t("topic:Recent Topics")} - ${Setting.getForumName()}`}</title>
        </Helmet>
        <div className="header">
          <div className="fr f12">
            <span className="fade">{`${i18next.t("topic:Total Topics")} ${this.state.topicsNum}`}</span>
          </div>
          <Link to="/">{Setting.getForumName()}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("topic:Recent Topics")}
        </div>
        {Setting.PcBrowser ? this.showPageColumn() : null}
        <TopicList topics={this.state.topics} showNodeName={true} showAvatar={true} />
        {this.showPageColumn()}
      </div>
    );
  }
}

export default withRouter(RecentTopicsBox);
