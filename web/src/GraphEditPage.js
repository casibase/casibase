// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import {Button, Card, Col, Input, Row} from "antd";
import * as GraphBackend from "./backend/GraphBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import GraphDataPage from "./GraphDataPage";
import {Controlled as CodeMirror} from "react-codemirror2";

class GraphEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      graphName: props.match.params.graphName,
      graph: null,
      graphCount: "key",
    };
  }

  UNSAFE_componentWillMount() {
    this.getGraph();
  }

  getGraph() {
    GraphBackend.getGraph(this.props.account.name, this.state.graphName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            graph: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseGraphField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateGraphField(key, value) {
    value = this.parseGraphField(key, value);

    const graph = this.state.graph;
    graph[key] = value;
    this.setState({
      graph: graph,
    });
  }

  renderGraph() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("graph:Edit Graph")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.graph.name} onChange={e => {
              this.updateGraphField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.graph.displayName} onChange={e => {
              this.updateGraphField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Text"), i18next.t("general:Text - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.graph.text}
                options={{mode: "application/json", theme: "material-darker", lineNumbers: true}}
                onBeforeChange={(editor, data, value) => {
                  this.updateGraphField("text", value);
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Preview")}:
          </Col>
          <Col span={22} >
            <div key={this.state.graphCount} style={{height: "640px", width: "100%"}}>
              <GraphDataPage account={this.props.account} owner={this.state.graph?.owner} graphName={this.state.graph?.name} graphText={this.state.graph?.text} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitGraphEdit(exitAfterSave) {
    const graph = Setting.deepCopy(this.state.graph);
    if (!exitAfterSave) {
      this.setState({
        graphCount: this.state.graphCount + "a",
      });
    }
    GraphBackend.updateGraph(this.state.graph.owner, this.state.graphName, graph)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              graphName: this.state.graph.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/graphs");
            } else {
              this.props.history.push(`/graphs/${this.state.graph.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateGraphField("name", this.state.graphName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.graph !== null ? this.renderGraph() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default GraphEditPage;
