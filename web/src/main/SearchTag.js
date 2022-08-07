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
import * as Setting from "../Setting";
import * as TopicBackend from "../backend/TopicBackend";
import {Link, withRouter} from "react-router-dom";
import PageColumn from "./PageColumn";
import i18next from "i18next";
import TopicList from "./TopicList";
import {Helmet} from "react-helmet";

class SearchTag extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      tagId: props.match.params.tagId,
      page: 1,
      limit: 20,
      topics: [],
      topicNum: 1,
      url: "",
    };
    this.state.url = `/tag/${this.state.tagId}`;
  }

  componentDidMount() {
    TopicBackend.getTopicsWithTag(this.state.tagId, this.state.limit, this.state.page).then((res) => {
      this.setState({
        topics: res,
        topicNum: res.length,
      });
    });
  }

  showPageColumn() {
    if (this.state.topicNum < this.state.limit) {
      return null;
    }

    return <PageColumn page={this.state.page} total={this.state.topicNum} url={this.state.url} tagId={this.state.tagId} />;
  }

  renderTag() {
    return (
      <div className={`box ${this.state.tagId}`}>
        <div className="cell" align="center" style={{border: 0}}>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
            <span className="chevron">{this.state.tagId}</span>{" "}
            <span className="gray" style={{float: "right"}}>
              {`${i18next.t("node:all")} ${this.state.topicNum} ${i18next.t("node:topics")}`}
            </span>
          </div>
        </div>
        <TopicList topics={this.state.topics} showNodeName={false} showAvatar={true} />
        {this.showPageColumn()}
      </div>
    );
  }

  render() {
    const pcBrowser = Setting.PcBrowser;

    if (this.state.topics.length === 0) {
      return (
        <div>
          <div className="box">
            <Helmet>
              <title>{`${i18next.t("topic:Search")} - ${Setting.getForumName()}`}</title>
            </Helmet>
            <div className="header">
              <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
              {i18next.t("tag:No related pages with tags")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {this.renderTag()}
        {pcBrowser ? <div className="sep20" /> : null}
      </div>
    );
  }
}

export default withRouter(SearchTag);
