// Copyright 2022 The casbin Authors. All Rights Reserved.
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
import {Link, withRouter} from "react-router-dom";
import * as Setting from "../Setting";
import * as ConfBackend from "../backend/ConfBackend";
import "./NoMatch.css";
import i18next from "i18next";
import {Helmet} from "react-helmet";
import ReactMarkdown from "react-markdown";

class NoMatch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      id: this.props.id,
      conf: null,
    };
  }

  componentDidMount() {
    this.i18nTag = `admin:${this.state?.id.charAt(0).toUpperCase() + this.state?.id.slice(1)}`;
    this.getContent(this.state.id);
  }

  getContent(id) {
    ConfBackend.getFrontConfById(id).then((res) => {
      this.setState({
        conf: res.data,
      });
    });
  }

  renderBox() {
    return (
      <div>
        <div className="box">
          <Helmet>
            <title>
              {i18next.t(this.i18nTag)} - {Setting.getForumName()}
            </title>
            <meta name="keywords" content={this.state.conf?.tags} />
          </Helmet>
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link>
            <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t(this.i18nTag)}
          </div>
        </div>

        <div className="box">
          <div className="inner" id="topic_preview">
            <div className="topic_content">
              <div className="markdown_body">
                <ReactMarkdown source={this.state.conf?.value} escapeHtml={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return <div className="main">{this.renderBox()}</div>;
  }
}

export default withRouter(NoMatch);
