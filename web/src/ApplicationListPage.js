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
import {Button, Popconfirm, Table, Tag, Tooltip} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import i18next from "i18next";
import * as TemplateBackend from "./backend/TemplateBackend";

class ApplicationListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      templates: [],
      k8sStatus: null,
      deploying: {},
    };
  }

  componentDidMount() {
    this.getTemplates();
    this.getK8sStatus();
  }

  getTemplates() {
    TemplateBackend.getTemplates(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            templates: res.data || [],
          });
        }
      });
  }

  getK8sStatus() {
    TemplateBackend.getK8sStatus()
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            k8sStatus: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${error}`);
      });
  }

  updateApplicationStatus(record) {
    ApplicationBackend.getApplicationStatus(`${record.owner}/${record.name}`)
      .then((statusRes) => {
        // eslint-disable-next-line no-console
        console.log(`Application status for ${record.name}:`, statusRes);
        if (statusRes && statusRes.status === "ok") {
          this.setState(prevState => ({
            data: prevState.data.map(item =>
              item.name === record.name ? {...item, status: statusRes.data} : item
            ),
          }));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${statusRes?.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${error}`);
      });
  }

  deployApplication(record, index) {
    this.setState(prevState => ({
      deploying: {
        ...prevState.deploying,
        [index]: true,
      },
    }));

    ApplicationBackend.deployApplication(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deployed"));
          this.updateApplicationStatus(record);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${res.msg}`);
        }
        this.setState(prevState => ({
          deploying: {
            ...prevState.deploying,
            [index]: false,
          },
        }));
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${error}`);
        this.setState(prevState => ({
          deploying: {
            ...prevState.deploying,
            [index]: false,
          },
        }));
      });
  }

  undeployApplication(record, index) {
    this.setState(prevState => ({
      deploying: {
        ...prevState.deploying,
        [index]: true,
      },
    }));

    ApplicationBackend.undeployApplication(record.owner, record.name)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully undeployed"));
          this.updateApplicationStatus(record);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to undeploy")}: ${res.msg}`);
        }
        this.setState(prevState => ({
          deploying: {
            ...prevState.deploying,
            [index]: false,
          },
        }));
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to undeploy")}: ${error}`);
        this.setState(prevState => ({
          deploying: {
            ...prevState.deploying,
            [index]: false,
          },
        }));
      });
  }

  newApplication() {
    const randomName = Setting.getRandomName();
    const defaultParameters = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3`;

    return {
      owner: this.props.account.name,
      name: `application_${randomName}`,
      createdTime: moment().format(),
      displayName: `${i18next.t("application:New Application")} - ${randomName}`,
      description: "",
      template: this.state.templates[0]?.name || "",
      parameters: defaultParameters,
      status: "Not Deployed",
    };
  }

  addApplication() {
    const newApplication = this.newApplication();
    ApplicationBackend.addApplication(newApplication)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newApplication),
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
    return ApplicationBackend.deleteApplication(this.state.data[i]);
  };

  deleteApplication(record) {
    ApplicationBackend.deleteApplication(record)
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

  renderStatus(status) {
    let color;
    switch (status) {
    case "Running":
      color = "green";
      break;
    case "Pending":
      color = "orange";
      break;
    case "Terminating":
      color = "orange";
      break;
    case "Failed":
      color = "red";
      break;
    case "Not Deployed":
      color = "default";
      break;
    default:
      color = "default";
    }

    return (
      <Tag color={color}>
        {i18next.t(`application:${status}`)}
      </Tag>
    );
  }

  renderTable(applications) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "160px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/applications/${text}`}>
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
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Description"),
        dataIndex: "description",
        key: "description",
        width: "250px",
        sorter: (a, b) => a.description.localeCompare(b.description),
        render: (text, record, index) => {
          return (
            <Tooltip placement="left" title={Setting.getShortText(text, 1000)}>
              <div style={{maxWidth: "250px"}}>
                {Setting.getShortText(text, 100)}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: i18next.t("general:Template"),
        dataIndex: "template",
        key: "template",
        width: "150px",
        sorter: (a, b) => a.template.localeCompare(b.template),
        render: (text, record, index) => {
          if (text === "") {
            return null;
          }
          return (
            <Link to={`/templates/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        sorter: (a, b) => a.status.localeCompare(b.status),
        render: (text, record, index) => {
          return this.renderStatus(text);
        },
      },
      {
        title: i18next.t("general:Namespace"),
        dataIndex: "namespace",
        key: "namespace",
        width: "150px",
        sorter: (a, b) => a.namespace.localeCompare(b.namespace),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "280px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/applications/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              {
                record.status === "Not Deployed" ? (
                  <Button style={{marginBottom: "10px", marginRight: "10px"}} loading={this.state.deploying[index]} onClick={() => this.deployApplication(record, index)}>
                    {i18next.t("application:Deploy")}
                  </Button>
                ) : (
                  <Popconfirm title={`${i18next.t("general:Sure to undeploy")}: ${record.name} ?`} onConfirm={() => this.undeployApplication(record, index)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                    <Button style={{marginBottom: "10px", marginRight: "10px"}} loading={this.state.deploying[index]} danger>
                      {i18next.t("application:Undeploy")}
                    </Button>
                  </Popconfirm>
                )
              }
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteApplication(record)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={applications} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Applications")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addApplication.bind(this)}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
                       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Status")}:
                       &nbsp;
              {Setting.getDisplayTag(this.state.k8sStatus === "Connected" ? i18next.t("general:Active") : i18next.t("general:Inactive"))}
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
    ApplicationBackend.getApplications(this.props.account.name, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default ApplicationListPage;
