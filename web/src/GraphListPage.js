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
import {Link} from "react-router-dom";
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as GraphBackend from "./backend/GraphBackend";
import i18next from "i18next";
import {DeleteOutlined} from "@ant-design/icons";
import GraphChart from "./GraphChart";

class GraphListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      graphs: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getGraphs();
  }

  componentDidMount() {
    this.getGraphs();
  }

  fetch = (params = {}) => {
    this.getGraphs();
  };

  getGraphs() {
    this.setState({loading: true});
    GraphBackend.getGraphs(this.props.account?.owner || "admin", this.props.account?.storeName || "")
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            graphs: res.data,
            pagination: {
              ...this.state.pagination,
              total: res.data.length,
            },
          });
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      })
      .catch(error => {
        Setting.showMessage("error", error);
        this.setState({loading: false});
      });
  }

  newGraph() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account?.owner || "admin",
      name: `graph_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account?.owner || "admin",
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

  addGraph() {
    const newGraph = this.newGraph();
    GraphBackend.addGraph(newGraph)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.getGraphs();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return GraphBackend.deleteGraph(this.state.data[i]);
  };

  deleteGraph(record) {
    GraphBackend.deleteGraph(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.getGraphs();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  calculateTotalNodes(graphs) {
    if (!graphs || graphs.length === 0) {return 0;}
    let total = 0;
    graphs.forEach(graph => {
      if (graph.analysis && graph.analysis.trim() !== "") {
        const analysis = JSON.parse(graph.analysis);
        total += analysis.totalNodes || 0;
      }
    });
    return total;
  }

  calculateTotalLinks(graphs) {
    if (!graphs || graphs.length === 0) {return 0;}
    let total = 0;
    graphs.forEach(graph => {
      if (graph.analysis && graph.analysis.trim() !== "") {
        const analysis = JSON.parse(graph.analysis);
        total += analysis.totalLinks || 0;
      }
    });
    return total;
  }

  renderTable(graphs) {
    const columns = [
      {
        title: i18next.t("general:Updated time"),
        dataIndex: "updatedTime",
        key: "updatedTime",
        width: "120px",
        defaultSortOrder: "descend",
        sorter: (a, b) => a.updatedTime.localeCompare(b.updatedTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Graph Name"),
        dataIndex: "displayName",
        key: "graph",
        width: "150px",
        sorter: (a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/graphs/${record.owner}/${record.name}`}>
              {record.displayName || record.name}
            </Link>
          );
        },
      },

      {
        title: i18next.t("general:Store"),
        dataIndex: "store",
        key: "store",
        width: "120px",
        sorter: (a, b) => a.store.localeCompare(b.store),
        render: (text, record, index) => {
          return text || "-";
        },
      },
      {
        title: i18next.t("general:Chats"),
        dataIndex: "chats",
        key: "chats",
        width: "120px",
        render: (text, record, index) => {
          return record.chats?.length || 0;
        },
      },
      {
        title: i18next.t("general:Users"),
        dataIndex: "users",
        key: "users",
        width: "120px",
        render: (text, record, index) => {
          return record.users?.length || 0;
        },
      },
      {
        title: i18next.t("general:Nodes"),
        key: "totalNodes",
        width: "80px",
        sorter: (a, b) => {
          let aNodes = 0;
          let bNodes = 0;
          if (a.analysis && a.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(a.analysis);
              aNodes = analysis.totalNodes || 0;
            } catch (e) {
              aNodes = 0;
            }
          }
          if (b.analysis && b.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(b.analysis);
              bNodes = analysis.totalNodes || 0;
            } catch (e) {
              bNodes = 0;
            }
          }
          return aNodes - bNodes;
        },
        render: (text, record, index) => {
          if (record.analysis && record.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(record.analysis);
              return analysis.totalNodes || 0;
            } catch (e) {
              return "-";
            }
          }
          return "-";
        },
      },
      {
        title: i18next.t("general:Connections"),
        key: "totalLinks",
        width: "100px",
        sorter: (a, b) => {
          let aLinks = 0;
          let bLinks = 0;
          if (a.analysis && a.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(a.analysis);
              aLinks = analysis.totalLinks || 0;
            } catch (e) {
              aLinks = 0;
            }
          }
          if (b.analysis && b.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(b.analysis);
              bLinks = analysis.totalLinks || 0;
            } catch (e) {
              bLinks = 0;
            }
          }
          return aLinks - bLinks;
        },
        render: (text, record, index) => {
          if (record.analysis && record.analysis.trim() !== "") {
            try {
              const analysis = JSON.parse(record.analysis);
              return analysis.totalLinks || 0;
            } catch (e) {
              return "-";
            }
          }
          return "-";
        },
      },
      {
        title: i18next.t("general:Graph"),
        dataIndex: "graphData",
        key: "graphData",
        width: "500px",
        render: (text, record, index) => {
          if (!record.graphData || record.graphData === "") {
            return (
              <div style={{color: "#999", fontStyle: "italic"}}>
                {i18next.t("knowledge:No graph data available")}
              </div>
            );
          }

          let graphData;
          try {
            graphData = JSON.parse(record.graphData);
          } catch (e) {
            return (
              <div style={{color: "#ff4d4f", fontStyle: "italic"}}>
                {i18next.t("knowledge:Invalid graph data format")}
              </div>
            );
          }

          if (!graphData.nodes || graphData.nodes.length === 0) {
            return (
              <div style={{color: "#999", fontStyle: "italic"}}>
                {i18next.t("knowledge:No graph data available")}
              </div>
            );
          }

          return (
            <div style={{
              width: "480px",
              height: "300px",
              border: "1px solid #d9d9d9",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <GraphChart
                data={graphData}
                layout={record.graphType || "force"}
                onNodeClick={() => {}}
                i18n={(key) => i18next.t(key) || key}
                style={{width: "100%", height: "100%"}}
              />
            </div>
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "200px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/graphs/${record.owner}/${record.name}`)}>
                {i18next.t("general:Edit")}
              </Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteGraph(record)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>
                  {i18next.t("general:Delete")}
                </Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table
          scroll={{x: "max-content"}}
          columns={columns}
          dataSource={graphs}
          rowKey="name"
          rowSelection={this.getRowSelection()}
          size="middle"
          bordered
          pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Graphs")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addGraph.bind(this)}>
                {i18next.t("general:Add")}
              </Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              &nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Graphs")}:
              &nbsp;
              {Setting.getDisplayTag(this.state.pagination.total)}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Stores")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(graphs, "store"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Nodes")}:
              &nbsp;
              {Setting.getDisplayTag(this.calculateTotalNodes(graphs))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Connections")}:
              &nbsp;
              {Setting.getDisplayTag(this.calculateTotalLinks(graphs))}
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderTable(this.state.data)}
      </div>
    );
  }
}

export default GraphListPage;
