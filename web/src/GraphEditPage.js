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
import {Button, Card, Col, Input, Row, Select, Typography} from "antd";
import * as Setting from "./Setting";
import * as GraphBackend from "./backend/GraphBackend";
import * as ChatBackend from "./backend/ChatBackend";
import * as StoreBackend from "./backend/StoreBackend";
import i18next from "i18next";

import * as MessageBackend from "./backend/MessageBackend";
import GraphChart from "./GraphChart";
import GraphAnalyzer from "./GraphAnalyzer";

const {Option} = Select;
const {TextArea} = Input;
const {Text} = Typography;

class GraphEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      graphName: props.match.params.graphName,
      graph: null,
      stores: [],
      chats: [],
      allUsers: [],
      loading: false,
      generating: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getGraph();
    this.loadStores();
  }

  getGraph() {
    if (this.state.graphName === "new") {
      const randomName = Setting.getRandomName();
      this.setState({
        graph: {
          owner: this.state.owner,
          name: `graph_${randomName}`,
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
          organization: this.state.owner,
          displayName: `Graph ${randomName}`,
          store: "",
          chats: [],
          users: [],
          description: "",
          graphData: "",
          analysis: "",
          graphType: "force",
        },
      });
      return;
    }

    GraphBackend.getGraph(`${this.state.owner}/${this.state.graphName}`)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            graph: res.data,
          }, () => {
            if (res.data.store) {
              this.loadChats();
            }
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      })
      .catch(error => {
        Setting.showMessage("error", error);
      });
  }

  loadStores() {
    StoreBackend.getStores(this.state.owner)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data && res.data.length > 0) {
            this.setState({
              stores: res.data,
            });
          } else {
            StoreBackend.getGlobalStores()
              .then((globalRes) => {
                if (globalRes.status === "ok" && globalRes.data && globalRes.data.length > 0) {
                  this.setState({
                    stores: globalRes.data,
                  });
                } else {
                  Setting.showMessage("warning", "No stores available. Please create a store first.");
                }
              })
              .catch((globalError) => {
                Setting.showMessage("error", globalError);
              });
          }
        } else {
          Setting.showMessage("error", res.msg);
        }
      })
      .catch(error => {
        Setting.showMessage("error", error);
      });
  }

  loadChats() {
    if (!this.state.graph.store) {
      this.setState({
        chats: [],
        allUsers: [],
      });
      return;
    }

    ChatBackend.getChats(this.state.owner, this.state.graph.store)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chats: res.data,
          }, () => {
            if (this.state.graph.chats && this.state.graph.chats.length > 0) {
              this.loadUsers();
            }
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      })
      .catch(error => {
        Setting.showMessage("error", error);
      });
  }

  loadUsers() {
    if (!this.state.chats || this.state.chats.length === 0) {
      this.setState({
        allUsers: [],
      });
      return;
    }

    const users = new Set();
    let completedRequests = 0;

    this.state.chats.forEach(chat => {
      MessageBackend.getChatMessages(this.state.owner, chat.name)
        .then((res) => {
          if (res.status === "ok") {
            res.data.forEach(msg => {
              if (msg.user) {
                users.add(msg.user);
              }
            });
          }
        })
        .catch(error => {
          Setting.showMessage("error", error);
        })
        .finally(() => {
          completedRequests++;
          if (completedRequests === this.state.chats.length) {
            this.setState({
              allUsers: Array.from(users),
            });
          }
        });
    });
  }

  updateGraphField(key, value) {
    const graph = this.state.graph;
    graph[key] = value;
    this.setState({
      graph: graph,
    }, () => {
      if (key === "chats") {
        this.loadUsers();
      }
    });
  }

  generateGraph() {
    if (!this.state.graph) {
      return;
    }

    this.setState({generating: true});

    let graphId;
    if (this.state.graphName === "new") {
      graphId = `${this.state.graph.owner}/${this.state.graph.name}`;
    } else {
      graphId = `${this.state.owner}/${this.state.graphName}`;
    }

    GraphBackend.generateGraph(graphId)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Graph generated successfully");
          this.getGraph();
        } else {
          Setting.showMessage("error", res.msg);
        }
        this.setState({generating: false});
      })
      .catch(error => {
        Setting.showMessage("error", error);
        this.setState({generating: false});
      });
  }

  submitGraphEdit(exitAfterSave) {
    if (!this.state.graph) {
      return;
    }

    const graph = this.state.graph;
    if (graph.name === "") {
      Setting.showMessage("error", "Name cannot be empty");
      return;
    }

    this.setState({loading: true});

    if (this.state.graphName === "new") {
      GraphBackend.addGraph(graph)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", "Graph added successfully");
            this.setState({
              graphName: graph.name,
              loading: false,
            });
            this.getGraph();
            if (graph.store && graph.chats && graph.chats.length > 0) {
              this.autoGenerateGraph(`${graph.owner}/${graph.name}`, exitAfterSave);
            } else if (exitAfterSave) {
              this.props.history.push("/graphs");
            }
          } else {
            Setting.showMessage("error", res.msg);
            this.setState({loading: false});
          }
        })
        .catch(error => {
          Setting.showMessage("error", error);
          this.setState({loading: false});
        });
    } else {
      GraphBackend.updateGraph(`${this.state.owner}/${this.state.graphName}`, graph)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", "Graph updated successfully");
            if (graph.name !== this.state.graphName) {
              this.setState({
                graphName: graph.name,
                loading: false,
              });
            } else {
              this.setState({loading: false});
            }
            if (graph.store && graph.chats && graph.chats.length > 0) {
              this.autoGenerateGraph(`${this.state.owner}/${graph.name}`, exitAfterSave);
            } else if (exitAfterSave) {
              this.props.history.push("/graphs");
            }
          } else {
            Setting.showMessage("error", res.msg);
            this.setState({loading: false});
          }
        })
        .catch(error => {
          Setting.showMessage("error", error);
          this.setState({loading: false});
        });
    }
  }

  autoGenerateGraph(graphId, exitAfterSave = false) {
    this.setState({generating: true});
    GraphBackend.generateGraph(graphId)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Graph generated successfully");
          this.getGraph();
          if (exitAfterSave) {
            this.props.history.push("/graphs");
          }
        } else {
          Setting.showMessage("error", res.msg);
          if (exitAfterSave) {
            this.props.history.push("/graphs");
          }
        }
        this.setState({generating: false});
      })
      .catch(error => {
        Setting.showMessage("error", error);
        if (exitAfterSave) {
          this.props.history.push("/graphs");
        }
        this.setState({generating: false});
      });
  }

  newGraph() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.state.owner,
      name: `graph_${randomName}`,
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
      organization: this.state.owner,
      displayName: `Graph ${randomName}`,
      store: "",
      chats: [],
      users: [],
      description: "",
      graphData: "",
      analysis: "",
      graphType: "force",
    };
  }

  renderGraph() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("knowledge:Edit Graph")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={(Setting.isMobile()) ? {margin: "5px"} : {}} type="inner">
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
            {Setting.getLabel(i18next.t("general:Display Name"), i18next.t("general:Display Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.graph.displayName} onChange={e => {
              this.updateGraphField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.graph.store}
              onChange={(value) => {
                this.updateGraphField("store", value);
                this.loadChats();
              }}
              placeholder={i18next.t("general:Please select a store first")}
              notFoundContent={i18next.t("general:No stores available")}
            >
              {this.state.stores.map((store, index) => (
                <Option key={store.name} value={store.name}>
                  {store.displayName || store.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Chats"), i18next.t("general:Select chats to analyze"))} :
          </Col>
          <Col span={22} >
            <Select
              mode="multiple"
              style={{width: "100%"}}
              value={this.state.graph.chats}
              onChange={(value) => {
                this.updateGraphField("chats", value);
              }}
              placeholder={this.state.graph.store ? i18next.t("general:Select chats to analyze") : i18next.t("general:Please select a store first")}
              disabled={!this.state.graph.store}
              notFoundContent={this.state.graph.store ? i18next.t("general:No chats available") : i18next.t("general:Please select a store first")}
            >
              {this.state.chats.map((chat, index) => (
                <Option key={chat.name} value={chat.name}>
                  {chat.displayName || chat.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Users"), i18next.t("general:Select users to analyze (leave empty for all users)"))} :
          </Col>
          <Col span={22} >
            <Select
              mode="multiple"
              style={{width: "100%"}}
              value={this.state.graph.users}
              onChange={(value) => {
                this.updateGraphField("users", value);
              }}
              placeholder={this.state.graph.chats && this.state.graph.chats.length > 0 ? i18next.t("general:Select users to analyze") : i18next.t("general:Please select chats first")}
              disabled={!this.state.graph.chats || this.state.graph.chats.length === 0}
              notFoundContent={this.state.graph.chats && this.state.graph.chats.length > 0 ? i18next.t("general:No users available") : i18next.t("general:Please select chats first")}
              allowClear
            >
              {this.state.allUsers.map((user, index) => (
                <Option key={user} value={user}>
                  {user}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea rows={3} value={this.state.graph.description} onChange={e => {
              this.updateGraphField("description", e.target.value);
            }} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("knowledge:Graph Type"), i18next.t("knowledge:Select the layout type for the graph"))} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.graph.graphType || "force"}
              onChange={(value) => {
                this.updateGraphField("graphType", value);
              }}
              placeholder={i18next.t("knowledge:Select graph layout type")}
            >
              <Option value="force">{i18next.t("knowledge:Force Directed")}</Option>
              <Option value="circular">{i18next.t("knowledge:Circular")}</Option>
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  renderGraphChart() {
    if (!this.state.graph || !this.state.graph.graphData) {
      return (
        <Card title={
          <div>
            {i18next.t("knowledge:Graph")}
            {this.state.graph && this.state.graph.store && this.state.graph.chats && this.state.graph.chats.length > 0 && (
              <Button
                style={{float: "right", marginTop: "-4px"}}
                size="small"
                onClick={() => this.autoGenerateGraph(`${this.state.owner}/${this.state.graph.name}`)}
                loading={this.state.generating}
              >
                {i18next.t("general:Reset")}
              </Button>
            )}
          </div>
        }>
          <div style={{textAlign: "center", padding: "50px"}}>
            <Text type="secondary">
              {i18next.t("knowledge:No graph data available. Please configure chats and generate the graph.")}
            </Text>
          </div>
        </Card>
      );
    }

    let graphData;
    try {
      graphData = JSON.parse(this.state.graph.graphData);
    } catch (e) {
      return (
        <Card title={
          <div>
            {i18next.t("knowledge:Graph")}
            {this.state.graph && this.state.graph.store && this.state.graph.chats && this.state.graph.chats.length > 0 && (
              <Button
                style={{float: "right", marginTop: "-4px"}}
                size="small"
                onClick={() => this.autoGenerateGraph(`${this.state.owner}/${this.state.graph.name}`)}
                loading={this.state.generating}
              >
                {i18next.t("general:Reset")}
              </Button>
            )}
          </div>
        }>
          <div style={{textAlign: "center", padding: "50px"}}>
            <Text type="secondary">
              {i18next.t("knowledge:Invalid graph data format.")}
            </Text>
          </div>
        </Card>
      );
    }

    if (!graphData.nodes || graphData.nodes.length === 0) {
      return (
        <Card title={
          <div>
            {i18next.t("knowledge:Graph")}
            {this.state.graph && this.state.graph.store && this.state.graph.chats && this.state.graph.chats.length > 0 && (
              <Button
                style={{float: "right", marginTop: "-4px"}}
                size="small"
                onClick={() => this.autoGenerateGraph(`${this.state.owner}/${this.state.graph.name}`)}
                loading={this.state.generating}
              >
                {i18next.t("general:Reset")}
              </Button>
            )}
          </div>
        }>
          <div style={{textAlign: "center", padding: "50px"}}>
            <Text type="secondary">
              {i18next.t("knowledge:No graph data available. Please configure chats and generate the graph.")}
            </Text>
          </div>
        </Card>
      );
    }

    return (
      <Card title={
        <div>
          {i18next.t("knowledge:Graph")}
          <Button
            style={{float: "right", marginTop: "-4px"}}
            size="small"
            onClick={() => this.autoGenerateGraph(`${this.state.owner}/${this.state.graph.name}`)}
            loading={this.state.generating}
          >
            {i18next.t("general:Reset")}
          </Button>
        </div>
      }>
        <GraphChart
          data={graphData}
          layout={this.state.graph.graphType || "force"}
          onNodeClick={() => {}}
          i18n={(key) => i18next.t(key) || key}
          style={{height: "500px"}}
        />
      </Card>
    );
  }

  renderAnalysis() {
    if (!this.state.graph || !this.state.graph.analysis) {
      return null;
    }

    let analysis;
    let graphData;
    try {
      analysis = JSON.parse(this.state.graph.analysis);
      graphData = JSON.parse(this.state.graph.graphData);
    } catch (e) {
      return null;
    }

    if (!analysis.totalNodes || analysis.totalNodes === 0) {
      return null;
    }

    return (
      <Card title={i18next.t("knowledge:Analysis")} style={{marginTop: "16px"}}>
        <GraphAnalyzer
          data={graphData}
          i18n={(key) => i18next.t(key) || key}
        />
      </Card>
    );
  }

  render() {
    if (this.state.graph === null) {
      return (
        <div className="App">
          <div style={{paddingTop: "10%"}}>
            <div style={{textAlign: "center"}}>
              <div>{i18next.t("general:Loading...")}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {this.renderGraph()}
        <div style={{marginTop: "20px"}}>
          {this.renderGraphChart()}
          {this.renderAnalysis()}
        </div>
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default GraphEditPage;
