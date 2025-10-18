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
import {Button, Popconfirm, Popover, Table} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as GraphBackend from "./backend/GraphBackend";
import i18next from "i18next";
import {Controlled as CodeMirror} from "react-codemirror2";
import GraphDataPage from "./GraphDataPage";

class GraphListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newGraph() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `graph_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Graph - ${randomName}`,
      text: "",
    };
  }

  addGraph() {
    const newGraph = this.newGraph();
    GraphBackend.addGraph(newGraph)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newGraph),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total + 1,
            },
          });
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
          this.setState({
            data: this.state.data.filter((item) => item.name !== record.name),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderTable(graphs) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "160px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/graphs/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "200px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        width: "200px",
        render: (text, record, index) => {
          return (
            <Popover
              placement="left"
              trigger="hover"
              title={i18next.t("general:Text")}
              content={
                <div style={{width: "800px", height: "400px", display: "flex"}}>
                  <CodeMirror
                    value={text}
                    options={{
                      mode: "application/json",
                      theme: "material-darker",
                      lineNumbers: true,
                      readOnly: true,
                    }}
                    editorDidMount={(editor) => {
                      if (window.ResizeObserver) {
                        const resizeObserver = new ResizeObserver(() => {
                          editor.refresh();
                        });
                        resizeObserver.observe(editor.getWrapperElement().parentNode);
                      }
                    }}
                  />
                </div>
              }>
              <div style={{maxWidth: "300px"}}>
                {Setting.getShortText(text, 200)}
              </div>
            </Popover>
          );
        },
      },
      {
        title: i18next.t("general:Graphs"),
        dataIndex: "text",
        key: "graph",
        width: "240px",
        render: (text, record, index) => {
          return (
            <div style={{height: "240px", width: "100%"}}>
              <GraphDataPage
                account={this.props.account}
                owner={record.owner}
                graphName={record.name}
                graphText={text}
                showLegend={false}
              />
            </div>
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/graphs/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteGraph(record)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];
    const filteredColumns = Setting.filterTableColumns(columns, this.props.formItems ?? this.state.formItems);
    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: 1600}} tableLayout="fixed" columns={filteredColumns} dataSource={graphs} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Graphs")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addGraph.bind(this)}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.pergraphBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    const field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    this.setState({loading: true});
    GraphBackend.getGraphs(this.props.account.name, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
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
      });
  };
}

export default GraphListPage;
