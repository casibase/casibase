import React from "react";
import {Link} from "react-router-dom";
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as KnowledgeGraphBackend from "./backend/KnowledgeGraphBackend";
import i18next from "i18next";
import {DeleteOutlined} from "@ant-design/icons";
import KnowledgeGraphChart from "./KnowledgeGraphChart";

class KnowledgeGraphListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      knowledgeGraphs: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getKnowledgeGraphs();
  }

  fetch = (params = {}) => {
    this.getKnowledgeGraphs();
  };

  getKnowledgeGraphs() {
    this.setState({loading: true});
    KnowledgeGraphBackend.getKnowledgeGraphs(this.props.account?.owner || "admin", this.props.account?.storeName || "")
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            knowledgeGraphs: res.data,
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

  newKnowledgeGraph() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account?.owner || "admin",
      name: `knowledgegraph_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account?.owner || "admin",
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

  addKnowledgeGraph() {
    const newKnowledgeGraph = this.newKnowledgeGraph();
    KnowledgeGraphBackend.addKnowledgeGraph(newKnowledgeGraph)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.getKnowledgeGraphs();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return KnowledgeGraphBackend.deleteKnowledgeGraph(this.state.data[i]);
  };

  deleteKnowledgeGraph(record) {
    KnowledgeGraphBackend.deleteKnowledgeGraph(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.getKnowledgeGraphs();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderTable(knowledgeGraphs) {
    const columns = [
      {
        title: i18next.t("general:Updated Time"),
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
        title: i18next.t("general:Graph"),
        dataIndex: "displayName",
        key: "graph",
        width: "150px",
        sorter: (a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/knowledgegraphs/${record.owner}/${record.name}`}>
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
        dataIndex: "analysis.totalNodes",
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
        dataIndex: "analysis.totalLinks",
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
        title: i18next.t("knowledge:Graph Data"),
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
              <KnowledgeGraphChart
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/knowledgegraphs/${record.owner}/${record.name}`)}>
                {i18next.t("general:Edit")}
              </Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteKnowledgeGraph(record)}
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
          dataSource={knowledgeGraphs}
          rowKey="name"
          rowSelection={this.getRowSelection()}
          size="middle"
          bordered
          pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Knowledge Graphs")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addKnowledgeGraph.bind(this)}>
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
              {i18next.t("general:Knowledge Graphs")}:
              &nbsp;
              {Setting.getDisplayTag(this.state.pagination.total)}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Stores")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(knowledgeGraphs, "store"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Total Nodes")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.sumFields(knowledgeGraphs, "totalNodes"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Total Connections")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.sumFields(knowledgeGraphs, "totalLinks"))}
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

export default KnowledgeGraphListPage;
