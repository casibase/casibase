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
import {Button, Popconfirm, Space, Table, Tag} from "antd";
import BaseListPage from "./BaseListPage";
import moment from "moment";
import * as Setting from "./Setting";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as TemplateBackend from "./backend/TemplateBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class ApplicationListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      templates: [],
    };
  }

  UNSAFE_componentWillMount() {
    this.fetch();
    this.getTemplates();
  }

  getTemplates() {
    TemplateBackend.getTemplates(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            templates: res.data || [],
          });
        }
      });
  }

  newApplication() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.owner,
      name: `app-${randomName}`,
      createdTime: moment().format(),
      displayName: `New Application - ${randomName}`,
      template: this.state.templates[0].name || "",
      parameters: "",
      status: "Not Deployed",
    };
  }

  addApplication = () => {
    // Ensure we have templates available
    if (this.state.templates.length === 0) {
      Setting.showMessage("error", "No templates available. Please create a template first.");
      return;
    }

    const newApp = this.newApplication();

    ApplicationBackend.addApplication(newApp)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.fetch();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  };

  deleteItem = async(i) => {
    return ApplicationBackend.deleteApplication(this.state.data[i]);
  };

  deleteApplication(i) {
    ApplicationBackend.deleteApplication(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
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

  deployApplication = (application) => {
    ApplicationBackend.deployApplication({
      owner: application.owner,
      name: application.name,
      template: application.template,
      parameters: application.parameters,
    })
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deployed"));
          // Update the application status locally
          const updatedData = this.state.data.map(app =>
            app.owner === application.owner && app.name === application.name
              ? {...app, status: "Pending", message: "Deployment in progress..."}
              : app
          );
          this.setState({data: updatedData});

          // Refresh status after a delay
          setTimeout(() => {
            this.refreshApplicationStatus(application);
          }, 2000);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${error}`);
      });
  };

  deleteDeployment = (application) => {
    ApplicationBackend.undeployApplication({
      owner: application.owner,
      name: application.name,
    })
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          // Update the application status locally
          const updatedData = this.state.data.map(app =>
            app.owner === application.owner && app.name === application.name
              ? {...app, status: "Not Deployed", message: "Deployment deleted"}
              : app
          );
          this.setState({data: updatedData});
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  };

  refreshApplicationStatus = (application) => {
    ApplicationBackend.getApplicationStatus(`${application.owner}/${application.name}`)
      .then((res) => {
        if (res.status === "ok") {
          const updatedData = this.state.data.map(app =>
            app.owner === application.owner && app.name === application.name
              ? {...app, status: res.data.status, message: res.data.message}
              : app
          );
          this.setState({data: updatedData});
        }
      });
  };

  renderStatusTag = (status) => {
    const colorMap = {
      "Running": "success",
      "Pending": "processing",
      "Failed": "error",
      "Not Deployed": "default",
      "Unknown": "warning",
    };

    return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
  };

  renderTable(applications) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, application, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/applications/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "180px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: "Template",
        dataIndex: "template",
        key: "template",
        width: "120px",
        sorter: (a, b) => a.template.localeCompare(b.template),
        render: (text, record, index) => {
          return (
            <Link to={`/templates/${text}`}>{text}</Link>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: "120px",
        sorter: (a, b) => a.status.localeCompare(b.status),
        render: (text, record, index) => {
          return (
            <Space>
              {this.renderStatusTag(text)}
            </Space>
          );
        },
      },
      {
        title: "Message",
        dataIndex: "message",
        key: "message",
        ellipsis: true,
        render: (text, record, index) => {
          return text ? <span title={text}>{text}</span> : "-";
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, application, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "280px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, application, index) => {
          const isDeployed = application.status !== "Not Deployed" && application.status !== "Unknown";
          return (
            <Space>
              <Button onClick={() => this.props.history.push(`/applications/${application.name}`)}>
                {i18next.t("general:Edit")}
              </Button>

              {!isDeployed ? (
                <Button type="primary" onClick={() => this.deployApplication(application)} disabled={!application.template}>
                  {i18next.t("general:Deploy")}
                </Button>
              ) : (
                <Space>
                  <Button type="primary" onClick={() => this.deployApplication(application)}>
                    {i18next.t("general:Redeploy")}
                  </Button>
                  <Button danger onClick={() => this.deleteDeployment(application)}>
                    {i18next.t("general:Stop")}
                  </Button>
                </Space>
              )}

              <PopconfirmModal disabled={application.owner !== this.props.account.owner} title={i18next.t("general:Sure to delete") + `: ${application.name} ?`} onConfirm={() => this.deleteApplication(index)} />
            </Space>
          );
        },
      },
    ];

    const paginationProps = {
      pageSize: this.state.pagination.pageSize,
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={applications} rowKey={(application) => `${application.owner}/${application.name}`} rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps} title={() => (
          <div>
                    Applications&nbsp;&nbsp;&nbsp;&nbsp;
            <Button type="primary" size="small" onClick={this.addApplication}>
                      Add
            </Button>
            {this.state.selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`}
                onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button type="primary" danger size="small" style={{marginLeft: 8}}>
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
    this.setState({loading: true});
    ApplicationBackend.getApplications(this.props.account.owner)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2 || res.data.length,
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
