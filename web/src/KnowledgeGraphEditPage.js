import React from "react";
import {Button, Card, Col, Input, Row, Select, Typography} from "antd";
import * as Setting from "./Setting";
import * as KnowledgeGraphBackend from "./backend/KnowledgeGraphBackend";
import * as ChatBackend from "./backend/ChatBackend";
import * as StoreBackend from "./backend/StoreBackend";
import i18next from "i18next";

import * as MessageBackend from "./backend/MessageBackend";
import KnowledgeGraphChart from "./KnowledgeGraphChart";
import KnowledgeGraphAnalyzer from "./KnowledgeGraphAnalyzer";

const {Option} = Select;
const {TextArea} = Input;
const {Text} = Typography;

class KnowledgeGraphEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      knowledgeGraphName: props.match.params.knowledgeGraphName,
      knowledgeGraph: null,
      stores: [],
      chats: [],
      allUsers: [],
      loading: false,
      generating: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getKnowledgeGraph();
    this.loadStores();
  }

  getKnowledgeGraph() {
    if (this.state.knowledgeGraphName === "new") {
      const randomName = Setting.getRandomName();
      this.setState({
        knowledgeGraph: {
          owner: this.state.owner,
          name: `knowledgegraph_${randomName}`,
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
          organization: this.state.owner,
          displayName: `Knowledge Graph ${randomName}`,
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

    KnowledgeGraphBackend.getKnowledgeGraph(`${this.state.owner}/${this.state.knowledgeGraphName}`)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            knowledgeGraph: res.data,
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
    if (!this.state.knowledgeGraph.store) {
      this.setState({
        chats: [],
        allUsers: [],
      });
      return;
    }

    ChatBackend.getChats(this.state.owner, this.state.knowledgeGraph.store)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chats: res.data,
          }, () => {
            if (this.state.knowledgeGraph.chats && this.state.knowledgeGraph.chats.length > 0) {
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

  updateKnowledgeGraphField(key, value) {
    const knowledgeGraph = this.state.knowledgeGraph;
    knowledgeGraph[key] = value;
    this.setState({
      knowledgeGraph: knowledgeGraph,
    }, () => {
      if (key === "chats") {
        this.loadUsers();
      }
    });
  }

  generateKnowledgeGraph() {
    if (!this.state.knowledgeGraph) {
      return;
    }

    this.setState({generating: true});

    let knowledgeGraphId;
    if (this.state.knowledgeGraphName === "new") {
      knowledgeGraphId = `${this.state.knowledgeGraph.owner}/${this.state.knowledgeGraph.name}`;
    } else {
      knowledgeGraphId = `${this.state.owner}/${this.state.knowledgeGraphName}`;
    }

    KnowledgeGraphBackend.generateKnowledgeGraph(knowledgeGraphId)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Knowledge graph generated successfully");
          this.getKnowledgeGraph();
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

  submitKnowledgeGraphEdit(exitAfterSave) {
    if (!this.state.knowledgeGraph) {
      return;
    }

    const knowledgeGraph = this.state.knowledgeGraph;
    if (knowledgeGraph.name === "") {
      Setting.showMessage("error", "Name cannot be empty");
      return;
    }

    this.setState({loading: true});

    if (this.state.knowledgeGraphName === "new") {
      KnowledgeGraphBackend.addKnowledgeGraph(knowledgeGraph)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", "Knowledge graph added successfully");
            this.setState({
              knowledgeGraphName: knowledgeGraph.name,
              loading: false,
            });
            this.getKnowledgeGraph();
            if (exitAfterSave) {
              this.props.history.push("/knowledgegraphs");
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
      KnowledgeGraphBackend.updateKnowledgeGraph(`${this.state.owner}/${this.state.knowledgeGraphName}`, knowledgeGraph)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", "Knowledge graph updated successfully");
            if (knowledgeGraph.name !== this.state.knowledgeGraphName) {
              this.setState({
                knowledgeGraphName: knowledgeGraph.name,
                loading: false,
              });
            } else {
              this.setState({loading: false});
            }
            if (exitAfterSave) {
              this.props.history.push("/knowledgegraphs");
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

  newKnowledgeGraph() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.state.owner,
      name: `knowledgegraph_${randomName}`,
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
      organization: this.state.owner,
      displayName: `Knowledge Graph ${randomName}`,
      store: "",
      chats: [],
      users: [],
      description: "",
      graphData: "",
      analysis: "",
      graphType: "force",
    };
  }

  renderKnowledgeGraph() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("knowledge:Edit Knowledge Graph")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitKnowledgeGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitKnowledgeGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={(Setting.isMobile()) ? {margin: "5px"} : {}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.knowledgeGraph.name} onChange={e => {
              this.updateKnowledgeGraphField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display Name"), i18next.t("general:Display Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.knowledgeGraph.displayName} onChange={e => {
              this.updateKnowledgeGraphField("displayName", e.target.value);
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
              value={this.state.knowledgeGraph.store}
              onChange={(value) => {
                this.updateKnowledgeGraphField("store", value);
                this.loadChats(); // Reload chats when store changes
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
              value={this.state.knowledgeGraph.chats}
              onChange={(value) => {
                this.updateKnowledgeGraphField("chats", value);
              }}
              placeholder={this.state.knowledgeGraph.store ? i18next.t("general:Select chats to analyze") : i18next.t("general:Please select a store first")}
              disabled={!this.state.knowledgeGraph.store}
              notFoundContent={this.state.knowledgeGraph.store ? i18next.t("general:No chats available") : i18next.t("general:Please select a store first")}
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
              value={this.state.knowledgeGraph.users}
              onChange={(value) => {
                this.updateKnowledgeGraphField("users", value);
              }}
              placeholder={this.state.knowledgeGraph.chats && this.state.knowledgeGraph.chats.length > 0 ? i18next.t("general:Select users to analyze") : i18next.t("general:Please select chats first")}
              disabled={!this.state.knowledgeGraph.chats || this.state.knowledgeGraph.chats.length === 0}
              notFoundContent={this.state.knowledgeGraph.chats && this.state.knowledgeGraph.chats.length > 0 ? i18next.t("general:No users available") : i18next.t("general:Please select chats first")}
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
            <TextArea rows={3} value={this.state.knowledgeGraph.description} onChange={e => {
              this.updateKnowledgeGraphField("description", e.target.value);
            }} />
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("knowledge:Graph Type"), i18next.t("knowledge:Select the layout type for the knowledge graph"))} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.knowledgeGraph.graphType || "force"}
              onChange={(value) => {
                this.updateKnowledgeGraphField("graphType", value);
              }}
              placeholder={i18next.t("knowledge:Select graph layout type")}
            >
              <Option value="force">{i18next.t("knowledge:Force Directed")}</Option>
              <Option value="circular">{i18next.t("knowledge:Circular")}</Option>
            </Select>
          </Col>
        </Row>

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("knowledge:Generate Graph"), i18next.t("knowledge:Generate knowledge graph from selected chats"))} :
          </Col>
          <Col span={22} >
            <Button
              type="primary"
              loading={this.state.generating}
              onClick={this.generateKnowledgeGraph.bind(this)}
              disabled={!this.state.knowledgeGraph.store || !this.state.knowledgeGraph.chats || this.state.knowledgeGraph.chats.length === 0}
            >
              {this.state.generating ? i18next.t("knowledge:Generating...") : i18next.t("knowledge:Generate Graph")}
            </Button>
            {(!this.state.knowledgeGraph.store || !this.state.knowledgeGraph.chats || this.state.knowledgeGraph.chats.length === 0) && (
              <div style={{marginTop: "8px", fontSize: "12px", color: "#999"}}>
                {!this.state.knowledgeGraph.store ? i18next.t("general:Please select a store first") :
                  !this.state.knowledgeGraph.chats || this.state.knowledgeGraph.chats.length === 0 ? i18next.t("general:Please select chats first") : ""}
              </div>
            )}
          </Col>
        </Row>
      </Card>
    );
  }

  renderGraph() {
    if (!this.state.knowledgeGraph || !this.state.knowledgeGraph.graphData) {
      return (
        <Card title={i18next.t("knowledge:Knowledge Graph")}>
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
      graphData = JSON.parse(this.state.knowledgeGraph.graphData);
    } catch (e) {
      return (
        <Card title={i18next.t("knowledge:Knowledge Graph")}>
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
        <Card title={i18next.t("knowledge:Knowledge Graph")}>
          <div style={{textAlign: "center", padding: "50px"}}>
            <Text type="secondary">
              {i18next.t("knowledge:No graph data available. Please configure chats and generate the graph.")}
            </Text>
          </div>
        </Card>
      );
    }

    return (
      <Card title={i18next.t("knowledge:Knowledge Graph")}>
        <KnowledgeGraphChart
          data={graphData}
          layout={this.state.knowledgeGraph.graphType || "force"}
          onNodeClick={() => {}}
          i18n={(key) => i18next.t(key) || key}
          style={{height: "500px"}}
        />
      </Card>
    );
  }

  renderAnalysis() {
    if (!this.state.knowledgeGraph || !this.state.knowledgeGraph.analysis) {
      return null;
    }

    let analysis;
    let graphData;
    try {
      analysis = JSON.parse(this.state.knowledgeGraph.analysis);
      graphData = JSON.parse(this.state.knowledgeGraph.graphData);
    } catch (e) {
      return null;
    }

    if (!analysis.totalNodes || analysis.totalNodes === 0) {
      return null;
    }

    return (
      <Card title={i18next.t("knowledge:Analysis")} style={{marginTop: "16px"}}>
        <KnowledgeGraphAnalyzer
          data={graphData}
          i18n={(key) => i18next.t(key) || key}
        />
      </Card>
    );
  }

  render() {
    if (this.state.knowledgeGraph === null) {
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
        {this.renderKnowledgeGraph()}
        <div style={{marginTop: "20px"}}>
          {this.renderGraph()}
          {this.renderAnalysis()}
        </div>
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitKnowledgeGraphEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitKnowledgeGraphEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default KnowledgeGraphEditPage;
