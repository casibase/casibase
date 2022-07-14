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
import * as TopicBackend from "../backend/TopicBackend";
import {Link} from "react-router-dom";
import Avatar from "../Avatar";
import i18next from "i18next";

const pangu = require("pangu");

class RightHotTopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      info: null,
      limit: 10,
    };
  }

  componentDidMount() {
    this.getHotTopic();
  }

  getHotTopic() {
    if (this.state.info !== null) {
      return;
    }
    TopicBackend.getHotTopic(this.state.limit).then((res) => {
      this.setState({
        info: res.data,
      });
    });
  }

  renderTopics(topic) {
    return (
      <div key={topic?.id} className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width="24" valign="middle" align="center">
                <Avatar username={topic?.author} avatar={topic?.avatar} size={"small"} />
              </td>
              <td width="10"></td>
              <td width="auto" valign="middle">
                <span className="item_hot_topic_title">
                  <Link to={`/t/${topic?.id}?from=${encodeURIComponent(window.location.href)}`}>{pangu.spacing(topic?.title)}</Link>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className="box" id="TopicsHot">
        <div className="cell">
          <span className="fade">{i18next.t("bar:Today Top 10")}</span>
        </div>
        {this.state.info?.map((topic) => {
          return this.renderTopics(topic);
        })}
      </div>
    );
  }
}

export default RightHotTopicBox;
