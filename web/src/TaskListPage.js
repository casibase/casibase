// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {Button, Popconfirm, Table, Tag, Tooltip} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as TaskBackend from "./backend/TaskBackend";
import i18next from "i18next";
import * as ConfTask from "./ConfTask";
import {DeleteOutlined} from "@ant-design/icons";

class TaskListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }
  newTask() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `task_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Task - ${randomName}`,
      provider: "provider_model_azure_gpt4",
      type: ConfTask.TaskMode === "Labeling" ? "Labeling" : "PBL",
      application: "Docs-Polish",
      path: "F:/github_repos/casdoor-website",
      text: ConfTask.TaskText,
      example: "",
      labels: [],
      log: "",
    };
  }

  addTask() {
    const newTask = this.newTask();
    TaskBackend.addTask(newTask)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newTask),
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
    return TaskBackend.deleteTask(this.state.data[i]);
  };

  deleteTask(record) {
    TaskBackend.deleteTask(record)
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

  renderTable(tasks) {
    let columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "160px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/tasks/${text}`}>
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
        title: i18next.t("store:Model provider"),
        dataIndex: "provider",
        key: "provider",
        width: "250px",
        sorter: (a, b) => a.provider.localeCompare(b.provider),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "90px",
        sorter: (a, b) => a.type.localeCompare(b.type),
      },
      {
        title: i18next.t("store:Subject"),
        dataIndex: "subject",
        key: "subject",
        width: "200px",
        sorter: (a, b) => a.subject.localeCompare(b.subject),
      },
      {
        title: i18next.t("video:Topic"),
        dataIndex: "topic",
        key: "topic",
        width: "200px",
        sorter: (a, b) => a.topic.localeCompare(b.topic),
      },
      {
        title: i18next.t("general:Result"),
        dataIndex: "result",
        key: "result",
        width: "200px",
        sorter: (a, b) => a.result.localeCompare(b.result),
      },
      {
        title: i18next.t("task:Activity"),
        dataIndex: "activity",
        key: "activity",
        width: "200px",
        sorter: (a, b) => a.activity.localeCompare(b.activity),
      },
      {
        title: i18next.t("video:Grade"),
        dataIndex: "grade",
        key: "grade",
        width: "200px",
        sorter: (a, b) => a.grade.localeCompare(b.grade),
      },
      // {
      //   title: i18next.t("task:Application"),
      //   dataIndex: "application",
      //   key: "application",
      //   width: "180px",
      //   sorter: (a, b) => a.application.localeCompare(b.application),
      // },
      // {
      //   title: i18next.t("provider:Path"),
      //   dataIndex: "path",
      //   key: "path",
      //   // width: "160px",
      //   sorter: (a, b) => a.path.localeCompare(b.path),
      // },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        // width: "160px",
        sorter: (a, b) => a.text.localeCompare(b.text),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" title={Setting.getShortText(text, 1000)}>
              <div style={{maxWidth: "300px"}}>
                {Setting.getShortText(text, 100)}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("task:Labels"),
        dataIndex: "labels",
        key: "labels",
        width: "250px",
        sorter: (a, b) => a.labels.localeCompare(b.labels),
        render: (text, record, index) => {
          return record.labels?.map(label => {
            return (
              <Tag key={label} color={"processing"}>
                {label}
              </Tag>
            );
          });
        },
      },
      {
        title: i18next.t("task:Example"),
        dataIndex: "example",
        key: "example",
        // width: "160px",
        sorter: (a, b) => a.example.localeCompare(b.example),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" title={Setting.getShortText(text, 1000)}>
              <div style={{maxWidth: "200px"}}>
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/tasks/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteTask(record)}
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

    if (!this.props.account || this.props.account.name !== "admin") {
      columns = columns.filter(column => column.key !== "provider");
    }

    if (ConfTask.TaskMode !== "Labeling") {
      columns = columns.filter(column => column.key !== "displayName" && column.key !== "labels" && column.key !== "example");
    } else {
      columns = columns.filter(column => column.key !== "subject" && column.key !== "topic" && column.key !== "result" && column.key !== "activity" && column.key !== "grade");
    }

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={tasks} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Tasks")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addTask.bind(this)}>{i18next.t("general:Add")}</Button>
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
    TaskBackend.getTasks(this.props.account.name, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default TaskListPage;
