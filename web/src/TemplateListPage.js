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
import BaseListPage from "./BaseListPage";
import moment from "moment";
import * as Setting from "./Setting";
import * as TemplateBackend from "./backend/TemplateBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";
import {DeleteOutlined} from "@ant-design/icons";

class TemplateListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newTemplate() {
    return {
      owner: this.props.account.owner,
      name: `app-template-${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Template - ${Setting.getRandomName()}`,
      description: "",
      version: "1.0.0",
      icon: "",
      manifests: "",
    };
  }

  addTemplate() {
    const newTemplate = this.newTemplate();
    TemplateBackend.addTemplate(newTemplate)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newTemplate),
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
    return TemplateBackend.deleteTemplate(this.state.data[i]);
  };

  deleteTemplate(i) {
    TemplateBackend.deleteTemplate(this.state.data[i])
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

  renderTable(templates) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, template, index) => {
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
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/templates/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "150px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, template, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Description"),
        dataIndex: "description",
        key: "description",
        sorter: (a, b) => a.description.localeCompare(b.description),
      },
      {
        title: i18next.t("general:Version"),
        dataIndex: "version",
        key: "version",
        width: "80px",
        sorter: (a, b) => a.version.localeCompare(b.version),
      },
      {
        title: i18next.t("general:Icon"),
        dataIndex: "icon",
        key: "icon",
        width: "80px",
        render: (text, record, index) => {
          return text ? (
            <img src={text} alt="icon" style={{width: "20px", height: "20px"}} />
          ) : (
            <span>-</span>
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "200px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, template, index) => {
          return (
            <div>
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/templates/${template.name}`)}
              >{i18next.t("general:Edit")}
              </Button>
              <PopconfirmModal
                disabled={template.owner !== this.props.account.owner}
                title={i18next.t("general:Sure to delete") + `: ${template.name} ?`}
                onConfirm={() => this.deleteTemplate(index)}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      pageSize: this.state.pagination.pageSize,
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={templates} rowKey={(template) => `${template.owner}/${template.name}`} rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Templates")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addTemplate.bind(this)}>{i18next.t("general:Add")}</Button>
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
    this.setState({loading: true});
    TemplateBackend.getTemplates(this.props.account.owner)
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

export default TemplateListPage;
