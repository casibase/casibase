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
import {Button, Input, Popconfirm, Popover, Switch, Table, Tag} from "antd";
import {DeleteOutlined, FilePdfOutlined, FileWordOutlined} from "@ant-design/icons";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as TaskBackend from "./backend/TaskBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import * as ConfTask from "./ConfTask";
import * as Conf from "./Conf";
import TaskAnalysisReport from "./TaskAnalysisReport";
import * as Provider from "./Provider";

const {TextArea} = Input;

function formatTaskListScoreNumber(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) {
    return "";
  }
  if (Number.isInteger(n)) {
    return String(n);
  }
  return String(Math.round(n * 100) / 100);
}

function getTaskScoreTagColor(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) {
    return "default";
  }
  if (n >= 80) {
    return "success";
  }
  if (n >= 60) {
    return "warning";
  }
  return "error";
}

class TaskListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      modelProviders: [],
      pagination: {
        ...this.state.pagination,
        pageSize: 100,
      },
    };
  }

  UNSAFE_componentWillMount() {
    super.UNSAFE_componentWillMount?.();
    if (Setting.isAdminUser(this.props.account)) {
      ProviderBackend.getProviders(this.props.account.name).then((res) => {
        if (res.status === "ok" && res.data) {
          this.setState({modelProviders: (res.data || []).filter((p) => p.category === "Model")});
        }
      });
    }
  }

  getNextTaskIndex() {
    const username = this.props.account?.name || "admin";
    const prefix = `task_${username}_`;
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d{3})$`);
    let maxNum = 0;
    (this.state.data || []).forEach((task) => {
      if (task.owner !== username || !task.name?.startsWith(prefix)) {
        return;
      }
      const m = task.name.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) {
          maxNum = n;
        }
      }
    });
    return Math.min(999, maxNum + 1);
  }

  newTask() {
    const username = this.props.account?.name || "admin";
    const nextIndex = String(this.getNextTaskIndex()).padStart(3, "0");
    const taskName = `task_${username}_${nextIndex}`;
    return {
      owner: this.props.account.name,
      name: taskName,
      createdTime: moment().format(),
      displayName: `New Task - ${taskName}`,
      provider: "provider_model_azure_gpt4",
      type: ConfTask.TaskMode === "Labeling" ? "Labeling" : "PBL",
      path: "F:/github_repos/casdoor-website",
      template: "admin/template",
      scale: "",
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
          this.props.history.push({
            pathname: `/tasks/${newTask.owner}/${newTask.name}`,
            state: {isNewTask: true},
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

  parseReportResult(result) {
    if (!result) {
      return null;
    }
    if (typeof result === "object") {
      return result;
    }
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  renderTable(tasks) {
    let columns = [
      {
        title: i18next.t("general:User"),
        dataIndex: "owner",
        key: "owner",
        width: "90px",
        sorter: (a, b) => (a.owner || "").localeCompare(b.owner || ""),
        ...this.getColumnSearchProps("owner"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${Conf.AuthConfig.organizationName}/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "180px",
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/tasks/${record.owner}/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "220px",
        sorter: (a, b) => (a.displayName || "").localeCompare(b.displayName || ""),
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("provider:Model provider"),
        dataIndex: "provider",
        key: "provider",
        width: "200px",
        sorter: (a, b) => (a.provider || "").localeCompare(b.provider || ""),
        ...this.getColumnSearchProps("provider"),
        render: (text, record, index) => {
          if (!text) {
            return null;
          }
          const provider = this.state.modelProviders.find((p) => p.name === text);
          return (
            <span style={{display: "inline-flex", alignItems: "center", gap: 8}}>
              {provider ? <Provider.ProviderLogo provider={provider} width={20} height={20} /> : null}
              <Link to={`/providers/${text}`}>{text}</Link>
            </span>
          );
        },
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "90px",
        sorter: (a, b) => (a.type || "").localeCompare(b.type || ""),
        ...this.getColumnSearchProps("type"),
      },
      {
        title: i18next.t("task:Is template"),
        dataIndex: "isTemplate",
        key: "isTemplate",
        width: "110px",
        sorter: (a, b) => Number(!!b.isTemplate) - Number(!!a.isTemplate),
        render: (text, record) => {
          return <Switch checked={!!record.isTemplate} disabled />;
        },
      },
      {
        title: i18next.t("general:Template"),
        dataIndex: "template",
        key: "template",
        width: "140px",
        sorter: (a, b) => (a.template || "").localeCompare(b.template || ""),
        ...this.getColumnSearchProps("template"),
        render: (text, record, index) => {
          if (!text) {
            return null;
          }
          return (
            <Link to={`/tasks/${text}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("task:Scale"),
        dataIndex: "scale",
        key: "scale",
        width: "200px",
        sorter: (a, b) => (a.scale || "").localeCompare(b.scale || ""),
        ...this.getColumnSearchProps("scale"),
        render: (text, record, index) => {
          if (text === null || text === "") {
            return null;
          }
          return (
            <Popover
              trigger="hover"
              placement="left"
              content={
                <div style={{width: "50vw", height: "50vh", overflow: "auto"}}>
                  <TextArea readOnly value={text} style={{width: "100%", minHeight: "50vh", boxSizing: "border-box", whiteSpace: "pre-wrap"}} />
                </div>
              }
            >
              <div style={{maxWidth: "200px", cursor: "pointer"}}>{Setting.getShortText(text, 80)}</div>
            </Popover>
          );
        },
      },
      {
        title: i18next.t("task:Score"),
        dataIndex: "score",
        key: "score",
        width: "90px",
        sorter: (a, b) => (Number(a.score) || 0) - (Number(b.score) || 0),
        render: (text, record) => {
          if (record.isTemplate) {
            return null;
          }
          if (!this.parseReportResult(record.result)) {
            return null;
          }
          const s = record.score;
          if (s === null || s === undefined || Number.isNaN(Number(s))) {
            return null;
          }
          const label = formatTaskListScoreNumber(s);
          if (!label) {
            return null;
          }
          return (
            <Tag
              color={getTaskScoreTagColor(s)}
              bordered={false}
              style={{marginInlineEnd: 0, fontWeight: 600, minWidth: 36, textAlign: "center"}}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: i18next.t("store:File"),
        dataIndex: "documentUrl",
        key: "documentUrl",
        // width: "100px",
        sorter: (a, b) => (a.documentUrl || "").localeCompare(b.documentUrl || ""),
        ...this.getColumnSearchProps("documentUrl"),
        render: (text, record, index) => {
          if (!text) {
            return null;
          }
          const isPdf = text.endsWith(".pdf");
          const fileName = text.split("/").filter(Boolean).pop() || text;
          return (
            <a href={text} target="_blank" rel="noopener noreferrer" download style={{display: "inline-flex", alignItems: "center", gap: "6px"}}>
              {isPdf ? <FilePdfOutlined style={{fontSize: "20px"}} /> : <FileWordOutlined style={{fontSize: "20px"}} />}
              <span style={{cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis"}} title={fileName}>{fileName}</span>
            </a>
          );
        },
      },
      {
        title: i18next.t("task:Report"),
        dataIndex: "result",
        key: "result",
        width: "100px",
        render: (text, record, index) => {
          const parsed = this.parseReportResult(record.result);
          if (!parsed) {
            return null;
          }
          return (
            <Popover
              trigger="hover"
              placement="left"
              content={
                <div style={{width: "50vw", height: "50vh", overflow: "auto"}}>
                  <TaskAnalysisReport result={parsed} />
                </div>
              }
            >
              <span style={{cursor: "pointer"}}>{parsed.score !== null && parsed.score !== undefined ? `${parsed.score}${i18next.t("task:Score Unit")}` : i18next.t("task:Report")}</span>
            </Popover>
          );
        },
      },
      {
        title: i18next.t("task:Example"),
        dataIndex: "example",
        key: "example",
        width: "160px",
        sorter: (a, b) => (a.example || "").localeCompare(b.example || ""),
        ...this.getColumnSearchProps("example"),
        render: (text, record, index) => {
          if (text !== null && text !== undefined && text !== "") {
            return (
              <div style={{maxWidth: "140px"}}>{Setting.getShortText(text, 40)}</div>
            );
          }
          return null;
        },
      },
      {
        title: i18next.t("task:Labels"),
        dataIndex: "labels",
        key: "labels",
        width: "200px",
        render: (text, record, index) => {
          if (record.labels?.length) {
            return record.labels.map(label => {
              return (
                <Tag key={label} color="processing">
                  {label}
                </Tag>
              );
            });
          }
          return null;
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                type="primary"
                onClick={() => this.props.history.push(`/tasks/${record.owner}/${record.name}`)}
              >
                {i18next.t("general:Edit")}
              </Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteTask(record)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button
                  style={{marginBottom: "10px"}}
                  type="primary"
                  danger
                >
                  {i18next.t("general:Delete")}
                </Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    columns = Setting.filterTableColumns(columns, this.props.formItems ?? this.state.formItems);

    if (!this.props.account || !Setting.isAdminUser(this.props.account)) {
      columns = columns.filter(column => !["provider", "type", "isTemplate", "template", "scale"].includes(column.key));
    }

    if (ConfTask.TaskMode !== "Labeling") {
      columns = columns.filter(column => !["displayName", "example", "labels"].includes(column.key));
    }

    const paginationProps = {
      current: this.state.pagination.current,
      pageSize: this.state.pagination.pageSize,
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
