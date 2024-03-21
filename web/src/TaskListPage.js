// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import * as Setting from "./Setting";
import * as TaskBackend from "./backend/TaskBackend";
import i18next from "i18next";
import * as ConfTask from "./ConfTask";

class TaskListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      tasks: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTasks();
  }

  getTasks() {
    TaskBackend.getTasks(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            tasks: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get tasks: ${res.msg}`);
        }
      });
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
      text: "",
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
          Setting.showMessage("success", "Task added successfully");
          this.setState({
            tasks: Setting.prependRow(this.state.tasks, newTask),
          });
        } else {
          Setting.showMessage("error", `Failed to add task: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Task failed to add: ${error}`);
      });
  }

  deleteTask(i) {
    TaskBackend.deleteTask(this.state.tasks[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Task deleted successfully");
          this.setState({
            tasks: Setting.deleteRow(this.state.tasks, i),
          });
        } else {
          Setting.showMessage("error", `Task failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Task failed to delete: ${error}`);
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
        title: i18next.t("chat:Type"),
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
      //   title: i18next.t("task:Path"),
      //   dataIndex: "path",
      //   key: "path",
      //   // width: "160px",
      //   sorter: (a, b) => a.path.localeCompare(b.path),
      // },
      {
        title: i18next.t("task:Text"),
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
                onConfirm={() => this.deleteTask(index)}
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

    if (ConfTask.TaskMode !== "Labeling") {
      columns = columns.filter(column => column.key !== "displayName" && column.key !== "provider" && column.key !== "labels" && column.key !== "example");
    }

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={tasks} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Frameworks")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addTask.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={tasks === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.tasks)
        }
      </div>
    );
  }
}

export default TaskListPage;
