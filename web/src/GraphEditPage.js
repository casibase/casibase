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
import {Button, Card, Col, DatePicker, Input, Row, Select} from "antd";
import * as GraphBackend from "./backend/GraphBackend";
import * as ChatBackend from "./backend/ChatBackend";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import GraphDataPage from "./GraphDataPage";
import GraphChatDataPage from "./GraphChatDataPage";
import GraphChatTable from "./GraphChatTable";
import Editor from "./common/Editor";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";

dayjs.extend(weekday);
dayjs.extend(localeData);

class GraphEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      graphName: props.match.params.graphName,
      isNewGraph: props.location?.state?.isNewGraph || false,
      graph: null,
      graphCount: "key",
      stores: [],
      filteredChats: [],
      tempStartTime: null,
      tempEndTime: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getGraph();
    this.getStores();
  }

  getStores() {
    StoreBackend.getStores(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            stores: res.data || [],
          });
        }
      });
  }

  getGraph() {
    GraphBackend.getGraph(this.props.account.name, this.state.graphName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            graph: res.data,
          }, () => {
            this.loadFilteredChats();
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseGraphField(key, value) {
    if (["density"].includes(key)) {
      value = parseFloat(value);
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

  handleErrorChange(errorText) {
    this.updateGraphField("errorText", errorText);
  }

  generateGraphData() {
    // First, clear the text field
    this.updateGraphField("text", "");

    // Then save the graph to DB with empty text
    const graph = Setting.deepCopy(this.state.graph);
    graph.text = "";

    GraphBackend.updateGraph(this.state.graph.owner, this.state.graphName, graph)
      .then((res) => {
        if (res.status === "ok") {
          // After saving, reload the graph (which will auto-generate data on backend)
          this.getGraph();
          this.loadFilteredChats();
          Setting.showMessage("success", i18next.t("general:Successfully generated"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to generate")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to generate")}: ${error}`);
      });
  }

  loadFilteredChats() {
    if (this.state.graph && this.state.graph.category === "Chats") {
      ChatBackend.getChats("admin", this.state.graph.store, "", "", "", "", "", "", "", this.state.graph.startTime, this.state.graph.endTime)
        .then((res) => {
          if (res.status === "ok") {
            this.setState({
              filteredChats: res.data || [],
            });
          }
        });
    }
  }

  toDayjs = (rfc3339) => {
    if (!rfc3339) {return null;}
    const d = dayjs(rfc3339);
    return d.isValid() ? d : null;
  };

  toRFC3339 = (d) => (d ? d.format("YYYY-MM-DDTHH:mm:ssZ") : "");

  renderGraph() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("graph:Edit Graph")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.isNewGraph && <Button style={{marginLeft: "20px"}} onClick={() => this.cancelGraphEdit()}>{i18next.t("general:Cancel")}</Button>}
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
            {Setting.getLabel(i18next.t("general:Category"), i18next.t("provider:Category - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.graph.category || "Default"}
              onChange={value => {
                this.updateGraphField("category", value);
              }}
            >
              <Select.Option value="Default">{i18next.t("general:Default")}</Select.Option>
              <Select.Option value={"Assets"}>{i18next.t("general:Assets")}</Select.Option>
              <Select.Option value={"Chats"}>{i18next.t("general:Chats")}</Select.Option>
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("graph:Layout"), i18next.t("graph:Layout - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.graph.layout || (this.state.graph.category === "Chats" ? "wordcloud" : "force")}
              onChange={value => {
                this.updateGraphField("layout", value);
              }}
            >
              {this.state.graph.category === "Chats" ? (
                <Select.Option value="wordcloud">{i18next.t("graph:Word Cloud")}</Select.Option>
              ) : (
                <>
                  <Select.Option value="force">{i18next.t("graph:Force")}</Select.Option>
                  <Select.Option value="circular">{i18next.t("graph:Circular")}</Select.Option>
                  <Select.Option value="radial">{i18next.t("graph:Radial")}</Select.Option>
                  <Select.Option value="grid">{i18next.t("graph:Grid")}</Select.Option>
                  <Select.Option value="tree">{i18next.t("graph:Tree")}</Select.Option>
                  <Select.Option value="none">{i18next.t("general:None")}</Select.Option>
                </>
              )}
            </Select>
          </Col>
        </Row>
        {this.state.graph.category === "Chats" && (
          <>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Select
                  style={{width: "100%"}}
                  value={this.state.graph.store}
                  onChange={value => {
                    this.updateGraphField("store", value);
                  }}
                  allowClear
                >
                  {this.state.stores.map((store) => (
                    <Select.Option key={store.name} value={store.name}>{store.displayName || store.name}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("video:Start time (s)"), i18next.t("video:Start time (s) - Tooltip"))} :
              </Col>
              <Col span={22} >
                <DatePicker
                  showTime
                  style={{width: "300px"}}
                  value={this.toDayjs(this.state.graph.startTime)}
                  onChange={(date) => {
                    const rfc3339 = this.toRFC3339(date);
                    this.updateGraphField("startTime", rfc3339);
                  }}
                />
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("video:End time (s)"), i18next.t("video:End time (s) - Tooltip"))} :
              </Col>
              <Col span={22} >
                <DatePicker
                  showTime
                  style={{width: "300px"}}
                  value={this.toDayjs(this.state.graph.endTime)}
                  onChange={(date) => {
                    const rfc3339 = this.toRFC3339(date);
                    this.updateGraphField("endTime", rfc3339);
                  }}
                />
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("graph:Threshold"), i18next.t("graph:Threshold - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Input
                  style={{width: "200px"}}
                  type="number"
                  min={1}
                  step={1}
                  value={this.state.graph.density || 1}
                  onChange={e => {
                    this.updateGraphField("density", e.target.value);
                  }}
                />
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              </Col>
              <Col span={22} >
                <Button type="primary" onClick={() => this.generateGraphData()}>
                  {i18next.t("general:Generate")}
                </Button>
              </Col>
            </Row>
          </>
        )}
        {this.state.graph.category !== "Chats" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("graph:Node density"), i18next.t("graph:Node density - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={this.state.graph.density || 5}
                onChange={e => {
                  this.updateGraphField("density", e.target.value);
                }}
              />
            </Col>
          </Row>
        )}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Text"), i18next.t("general:Text - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{height: "500px"}}>
              <Editor
                value={this.state.graph.text}
                lang="json"
                fillHeight
                dark
                onChange={value => {
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
            <div key={this.state.graphCount} style={{height: "1000px", width: "100%"}}>
              {this.state.graph?.category === "Chats" ? (
                <GraphChatDataPage graphText={this.state.graph?.text} showBorder={true} onErrorChange={(errorText) => this.handleErrorChange(errorText)} />
              ) : (
                <GraphDataPage account={this.props.account} owner={this.state.graph?.owner} graphName={this.state.graph?.name} graphText={this.state.graph?.text} category={this.state.graph?.category} layout={this.state.graph?.layout} density={this.state.graph?.density} showBorder={true} onErrorChange={(errorText) => this.handleErrorChange(errorText)} />
              )}
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  renderFilteredChatsSection() {
    if (!this.state.graph || this.state.graph.category !== "Chats") {
      return null;
    }

    return <GraphChatTable chats={this.state.filteredChats} />;
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
              isNewGraph: false,
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
        {
          this.renderFilteredChatsSection()
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.isNewGraph && <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.cancelGraphEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      </div>
    );
  }
  cancelGraphEdit() {
    if (this.state.isNewGraph) {
      GraphBackend.deleteGraph(this.state.graph)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Cancelled successfully"));
            this.props.history.push("/graphs");
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${res.msg}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${error}`);
        });
    } else {
      this.props.history.push("/graphs");
    }
  }

}

export default GraphEditPage;
