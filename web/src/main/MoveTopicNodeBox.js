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
import * as NodeBackend from "../backend/NodeBackend";
import * as TopicBackend from "../backend/TopicBackend";
import Select2 from "react-select2-wrapper";
import i18next from "i18next";
import * as Conf from "../Conf";

const pangu = require("pangu");

class MoveTopicNodeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      topicId: props.match.params.id,
      topic: [],
      nodes: [],
      form: {},
    };
  }

  componentDidMount() {
    this.getNodes();
    this.getTopic();
  }

  initForm() {
    const form = this.state.form;
    form["id"] = this.state.topic?.id;
    form["nodeId"] = this.state.topic?.nodeId;
    form["nodeName"] = this.state.topic?.nodeName;
    this.setState({
      form: form,
    });
  }

  moveTopicNode() {
    TopicBackend.updateTopicNode(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(`/t/${this.state.topicId}`);
      } else {
        Setting.showMessage("error", res?.msg);
      }
    });
  }

  getNodes() {
    NodeBackend.getNodes().then((res) => {
      this.setState({
        nodes: res,
      });
    });
  }

  getTopic() {
    TopicBackend.getTopic(this.state.topicId).then((res) => {
      this.setState(
        {
          topic: res,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  getIndexFromNodeId(nodeId) {
    for (let i = 0; i < this.state.nodes.length; i++) {
      if (this.state.nodes[i].id === nodeId) {
        return i;
      }
    }

    return -1;
  }

  render() {
    if (this.state.topic !== null && this.state.topic.length === 0) {
      if (!Conf.ShowLoadingIndicator) {
        return null;
      }

      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Content loading")}
          </div>
          <div className="cell">
            <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
          </div>
        </div>
      );
    }

    if (this.state.topic === null || !this.state.topic?.editable) {
      return (
        <div className="box">
          <div className="header">
            <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("move:Move topic")}
          </div>
          <div className="inner">{i18next.t("move:You cannot move this topic.")}</div>
        </div>
      );
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`}>{this.state.topic?.nodeName}</Link> <span className="chevron">&nbsp;›&nbsp;</span> <Link to={`/t/${this.state.topic?.id}`}>{pangu.spacing(this.state.topic?.title)}</Link>{" "}
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("move:Move topic")}
        </div>
        <div className="inner">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td width="120" align="right">
                  {i18next.t("move:Topic")} ID
                </td>
                <td width="auto" align="left">
                  {this.state.topic?.id}
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("move:Title")}
                </td>
                <td width="auto" align="left">
                  <Link to={`/t/${this.state.topic?.id}`} target="_blank">
                    {pangu.spacing(this.state.topic?.title)}
                  </Link>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("move:Current node")}
                </td>
                <td width="auto" align="left">
                  <Link to={`/go/${encodeURIComponent(this.state.topic?.nodeId)}`} target="_blank">
                    {this.state.topic?.nodeName}
                  </Link>
                </td>
              </tr>
              <tr>
                <td width="120" align="right">
                  {i18next.t("move:Target node")}
                </td>
                <td width="auto" align="left">
                  <Select2
                    value={this.getIndexFromNodeId(this.state.form.nodeId)}
                    style={{
                      width: Setting.PcBrowser ? "300px" : "200px",
                      fontSize: "14px",
                    }}
                    data={this.state.nodes.map((node, i) => {
                      return {text: `${node.name} / ${node.id}`, id: i};
                    })}
                    onSelect={(event) => {
                      const s = event.target.value;
                      if (s === null) {
                        return;
                      }

                      const index = parseInt(s);
                      const nodeId = this.state.nodes[index].id;
                      const nodeName = this.state.nodes[index].name;
                      this.updateFormField("nodeId", nodeId);
                      this.updateFormField("nodeName", nodeName);
                    }}
                    options={{
                      placeholder: i18next.t("new:Please select a node"),
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td width="120" align="right"></td>
                <td width="auto" align="left">
                  <input type="submit" className="super normal button" value={i18next.t("move:Move")} onClick={() => this.moveTopicNode()} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default withRouter(MoveTopicNodeBox);
