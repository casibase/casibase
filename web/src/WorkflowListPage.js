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
import {Button, Input, Popconfirm, Table, Tooltip} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as WorkflowBackend from "./backend/WorkflowBackend";
import i18next from "i18next";
import BpmnComponent from "./BpmnComponent";
import {DeleteOutlined} from "@ant-design/icons";
const {TextArea} = Input;
class WorkflowListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }
  newWorkflow() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `workflow_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Workflow - ${randomName}`,
      text: "",
    };
  }

  addWorkflow() {
    const newWorkflow = this.newWorkflow();
    WorkflowBackend.addWorkflow(newWorkflow)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Workflow added successfully");
          this.setState({
            data: Setting.prependRow(this.state.data, newWorkflow),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total + 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to add workflow: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Workflow failed to add: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return WorkflowBackend.deleteWorkflow(this.state.data[i]);
  };

  deleteWorkflow(record) {
    WorkflowBackend.deleteWorkflow(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Workflow deleted successfully");
          this.setState({
            data: this.state.data.filter((item) => item.name !== record.name),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `Workflow failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Workflow failed to delete: ${error}`);
      });
  }

  renderTable(workflows) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "160px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/workflows/${text}`}>
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
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        // width: "160px",
        sorter: (a, b) => a.text.localeCompare(b.text),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" overlayInnerStyle={{width: "515px", height: "615px"}} title={
              <div style={{width: "500px", height: "600px", backgroundColor: "white"}}>
                <BpmnComponent
                  diagramXML={text}
                  onLoading={(info) => {
                    Setting.showMessage("success", info);
                  }}
                  onError={(err) => {
                    Setting.showMessage("error", err);
                  }}
                />
              </div>
            }>
              <div style={{maxWidth: "300px"}}>
                {Setting.getShortText(text, 100)}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("general:Text2"),
        dataIndex: "text2",
        key: "text2",
        // width: "160px",
        sorter: (a, b) => a.text2.localeCompare(b.text2),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" overlayInnerStyle={{width: "515px", height: "615px"}} title={
              <div style={{width: "500px", height: "600px", backgroundColor: "white"}}>
                <BpmnComponent
                  diagramXML={text}
                  onLoading={(info) => {
                    Setting.showMessage("success", info);
                  }}
                  onError={(err) => {
                    Setting.showMessage("error", err);
                  }}
                />
              </div>
            }>
              <div style={{maxWidth: "300px"}}>
                {Setting.getShortText(text, 100)}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("general:Message"),
        dataIndex: "message",
        key: "message",
        // width: "160px",
        sorter: (a, b) => a.text.localeCompare(b.text),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" overlayInnerStyle={{width: "815px", height: "355px"}} title={
              <div style={{width: "800px", height: "600px"}}>
                <TextArea autoSize={{minRows: 1, maxRows: 15}} value={text} onChange={(e) => {}} />
              </div>
            }>
              <div style={{maxWidth: "300px"}}>
                {Setting.getShortText(text, 100)}
              </div>
            </Tooltip>
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/workflows/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteWorkflow(record)}
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

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={workflows} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Workflows")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addWorkflow.bind(this)}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
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
    WorkflowBackend.getWorkflows(this.props.account.name, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default WorkflowListPage;
