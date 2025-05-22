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
import * as StoreBackend from "./backend/StoreBackend";
import i18next from "i18next";
import {ThemeDefault} from "./Conf";
import * as StorageProviderBackend from "./backend/StorageProviderBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import {DeleteOutlined} from "@ant-design/icons";

const defaultPrompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems.";

class StoreListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      generating: false,
      providers: {},
    };
  }

  UNSAFE_componentWillMount() {
    super.UNSAFE_componentWillMount();
    this.getAllProviders();
  }

  getAllProviders() {
    this.setState({loading: true});
    Promise.all([
      StorageProviderBackend.getStorageProviders(this.props.account.name),
      ProviderBackend.getProviders(this.props.account.name),
    ]).then(([res1, res2]) => {
      if (res1.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res1.msg}`);
        this.setState({loading: false});
        return;
      }

      if (res2.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res2.msg}`);
        this.setState({loading: false});
        return;
      }

      const newProviders = {};
      res1.data.forEach(provider => {
        newProviders[provider.name] = provider;
      });
      res2.data.forEach(provider => {
        newProviders[provider.name] = provider;
      });

      this.setState({
        providers: newProviders,
        loading: false,
      });
    }).catch(error => {
      Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${error}`);
      this.setState({loading: false});
    });
  }

  renderProviderInfo(text) {
    const provider = this.state.providers[text];
    if (!provider) {
      return (<a> {text} </a>);
    }

    const providerLogo = (
      <img width={20} height={20} src={Setting.getProviderLogoURL(provider)} alt={provider.name} />
    );

    const isLocalStorage = provider.type === "Local File System";
    const providerType = provider.category;

    if (providerType === "Image" || (providerType === "Storage" && !isLocalStorage)) {
      return (
        <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/providers/admin/${provider.name}`)}>
          {provider.name && providerLogo} {provider.name}
          {Setting.renderExternalLink()}
        </a>
      );
    } else {
      return (
        <Link to={`/providers/${provider.name}`}>
          {provider.name && providerLogo} {provider.name}
        </Link>
      );
    }
  }

  newStore() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `store_${randomName}`,
      displayName: `New Store - ${randomName}`,
      createdTime: moment().format(),
      title: `Title - ${randomName}`,
      avatar: Setting.AiAvatar,
      storageProvider: "provider-storage-built-in",
      imageProvider: "",
      splitProvider: "Default",
      modelProvider: "",
      embeddingProvider: "",
      textToSpeechProvider: "Browser Built-In",
      speechToTextProvider: "Browser Built-In",
      agentProvider: "",
      memoryLimit: 5,
      frequency: 10000,
      limitMinutes: 10,
      welcome: "Hello",
      welcomeTitle: i18next.t("chat:Hello, I'm Casibase AI Assistant"),
      welcomeText: i18next.t("chat:I'm here to help answer your questions"),
      prompt: defaultPrompt,
      themeColor: ThemeDefault.colorPrimary,
      propertiesMap: {},
      knowledgeCount: 5,
      suggestionCount: 3,
      isDefault: false,
      state: "Active",
    };
  }

  addStore() {
    const newStore = this.newStore();
    StoreBackend.addStore(newStore)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newStore),
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
    return StoreBackend.deleteStore(this.state.data[i]);
  };

  deleteStore(record) {
    StoreBackend.deleteStore(record)
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

  refreshStoreVectors(i) {
    this.setState({generating: true});
    StoreBackend.refreshStoreVectors(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Vectors generated successfully"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Vectors failed to generate")}: ${res.msg}`);
        }
        this.setState({generating: false});
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Vectors failed to generate")}: ${error}`);
        this.setState({generating: false});
      });
  }

  renderTable(stores) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "120px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/stores/${record.owner}/${text}/view`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        // width: "600px",
        sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      },
      {
        title: i18next.t("store:Storage provider"),
        dataIndex: "storageProvider",
        key: "storageProvider",
        width: "250px",
        sorter: (a, b) => a.storageProvider.localeCompare(b.storageProvider),
        render: (text, record, index) => {
          if (text === "") {
            return null;
          }
          return this.renderProviderInfo(text);
        },
      },
      // {
      //   title: i18next.t("store:Split provider"),
      //   dataIndex: "splitProvider",
      //   key: "splitProvider",
      //   width: "200px",
      //   sorter: (a, b) => a.splitProvider.localeCompare(b.splitProvider),
      // },
      {
        title: i18next.t("store:Image provider"),
        dataIndex: "imageProvider",
        key: "imageProvider",
        width: "300px",
        sorter: (a, b) => a.imageProvider.localeCompare(b.imageProvider),
        render: (text, record, index) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Model provider"),
        dataIndex: "modelProvider",
        key: "modelProvider",
        width: "330px",
        sorter: (a, b) => a.modelProvider.localeCompare(b.modelProvider),
        render: (text, record, index) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Embedding provider"),
        dataIndex: "embeddingProvider",
        key: "embeddingProvider",
        width: "300px",
        sorter: (a, b) => a.embeddingProvider.localeCompare(b.embeddingProvider),
        render: (text, record, index) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Text-to-Speech provider"),
        dataIndex: "textToSpeechProvider",
        key: "textToSpeechProvider",
        width: "300px",
        sorter: (a, b) => a.textToSpeechProvider.localeCompare(b.textToSpeechProvider),
        render: (text, record, index) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Speech-to-Text provider"),
        dataIndex: "speechToTextProvider",
        key: "speechToTextProvider",
        width: "200px",
        sorter: (a, b) => a.speechToTextProvider.localeCompare(b.speechToTextProvider),
        render: (text) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Agent provider"),
        dataIndex: "agentProvider",
        key: "agentProvider",
        width: "250px",
        sorter: (a, b) => a.agentProvider.localeCompare(b.agentProvider),
        render: (text) => {
          return this.renderProviderInfo(text);
        },
      },
      {
        title: i18next.t("store:Memory limit"),
        dataIndex: "memoryLimit",
        key: "memoryLimit",
        width: "120px",
        sorter: (a, b) => a.memoryLimit - b.memoryLimit,
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
        width: "380px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} onClick={() => this.props.history.push(`/stores/${record.owner}/${record.name}/view`)}>{i18next.t("general:View")}</Button>
              {
                !Setting.isLocalAdminUser(this.props.account) ? null : (
                  <React.Fragment>
                    <Button style={{marginBottom: "10px", marginRight: "10px"}} disabled={this.state.generating} onClick={() => this.refreshStoreVectors(index)}>{i18next.t("store:Refresh Vectors")}</Button>
                    <Button style={{marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/stores/${record.owner}/${record.name}`)}>{i18next.t("general:Edit")}</Button>
                    <Popconfirm
                      title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                      onConfirm={() => this.deleteStore(record)}
                      okText={i18next.t("general:OK")}
                      cancelText={i18next.t("general:Cancel")}
                    >
                      <Button style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
                    </Popconfirm>
                  </React.Fragment>
                )
              }
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={stores} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Stores")}&nbsp;&nbsp;&nbsp;&nbsp;
              {
                !Setting.isLocalAdminUser(this.props.account) ? null : (
                  <>
                    <Button type="primary" size="small" onClick={this.addStore.bind(this)}>{i18next.t("general:Add")}</Button>
                    {this.state.selectedRowKeys.length > 0 && (
                      <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                        <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                          {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                        </Button>
                      </Popconfirm>
                    )}
                  </>
                )
              }
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
    StoreBackend.getGlobalStores(params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default StoreListPage;
