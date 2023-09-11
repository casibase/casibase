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
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as TaskBackend from "./backend/TaskBackend";
import i18next from "i18next";

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
      owner: "admin",
      name: `task_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Task - ${randomName}`,
      provider: "provider_openai",
      application: "Docs-Polish",
      path: "F:/github_repos/casdoor-website",
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
    const columns = [
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
        title: i18next.t("task:Application"),
        dataIndex: "application",
        key: "application",
        width: "180px",
        sorter: (a, b) => a.application.localeCompare(b.application),
      },
      {
        title: i18next.t("task:Path"),
        dataIndex: "path",
        key: "path",
        // width: "160px",
        sorter: (a, b) => a.path.localeCompare(b.path),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/tasks/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete task: ${record.name} ?`}
                onConfirm={() => this.deleteTask(index)}
                okText="OK"
                cancelText="Cancel"
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={tasks} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Tasks")}&nbsp;&nbsp;&nbsp;&nbsp;
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
