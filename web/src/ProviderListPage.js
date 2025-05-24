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
import {Button, Popconfirm, Switch, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import * as Provider from "./Provider";
import {DeleteOutlined} from "@ant-design/icons";

class ProviderListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newProvider() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `provider_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Provider - ${randomName}`,
      category: "Model",
      type: "OpenAI",
      subType: "text-davinci-003",
      clientId: "",
      clientSecret: "",
      mcpTools: [],
      temperature: 1,
      topP: 1,
      topK: 4,
      frequencyPenalty: 0,
      presencePenalty: 0,
      inputPricePerThousandTokens: 0.0,
      outputPricePerThousandTokens: 0.0,
      currency: "USD",
      providerUrl: "https://platform.openai.com/account/api-keys",
      apiVersion: "",
      apiKey: "",
      state: "Active",
    };
  }

  newStorageProvider() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `provider_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Provider - ${randomName}`,
      category: "Storage",
      type: "Local File System",
      subType: "",
      clientId: "C:/storage_casibase",
      providerUrl: "",
      state: "Active",
    };
  }

  addProvider(needStorage = false) {
    let newProvider = this.newProvider();
    if (needStorage) {
      newProvider = this.newStorageProvider();
    }
    ProviderBackend.addProvider(newProvider)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newProvider),
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
    return ProviderBackend.deleteProvider(this.state.data[i]);
  };

  deleteProvider(record) {
    ProviderBackend.deleteProvider(record)
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

  renderTable(providers) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "180px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${text}`}>
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
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("provider:Category"),
        dataIndex: "category",
        key: "category",
        width: "110px",
        sorter: (a, b) => a.category.localeCompare(b.category),
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "150px",
        align: "center",
        filterMultiple: false,
        sorter: (a, b) => a.type.localeCompare(b.type),
        render: (text, record, index) => {
          return Provider.getProviderLogoWidget(record);
        },
      },
      {
        title: i18next.t("provider:Sub type"),
        dataIndex: "subType",
        key: "subType",
        width: "180px",
        sorter: (a, b) => a.subType.localeCompare(b.subType),
      },
      {
        title: i18next.t("provider:Client ID"),
        dataIndex: "clientId",
        key: "clientId",
        width: "240px",
        sorter: (a, b) => a.clientId.localeCompare(b.clientId),
      },
      {
        title: i18next.t("provider:Secret key"),
        dataIndex: "clientSecret",
        key: "clientSecret",
        width: "120px",
        sorter: (a, b) => a.clientSecret.localeCompare(b.clientSecret),
      },
      {
        title: i18next.t("general:Region"),
        dataIndex: "region",
        key: "region",
        width: "120px",
        sorter: (a, b) => a.region.localeCompare(b.region),
      },
      {
        title: i18next.t("provider:API key"),
        dataIndex: "apiKey",
        key: "apiKey",
        width: "240px",
        sorter: (a, b) => a.apiKey.localeCompare(b.apiKey),
      },
      {
        title: i18next.t("provider:Provider URL"),
        dataIndex: "providerUrl",
        key: "providerUrl",
        // width: "250px",
        sorter: (a, b) => a.providerUrl.localeCompare(b.providerUrl),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={text}>
              {
                Setting.getShortText(text, 80)
              }
            </a>
          );
        },
      },
      {
        title: i18next.t("store:Is default"),
        dataIndex: "isDefault",
        key: "isDefault",
        width: "120px",
        sorter: (a, b) => a.isDefault - b.isDefault,
        // ...this.getColumnSearchProps("isDefault"),
        render: (text, record, index) => {
          return (
            <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" checked={text} />
          );
        },
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: "90px",
        sorter: (a, b) => a.state.localeCompare(b.state),
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/providers/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteProvider(record)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={providers} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Providers")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={() => this.addProvider()}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Button size="small" onClick={() => this.addProvider(true)}>{i18next.t("provider:Add Storage Provider")}</Button>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    ProviderBackend.getProviders(this.props.account.name, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default ProviderListPage;
