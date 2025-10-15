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
import {Button, Popconfirm, Select, Spin, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as AssetBackend from "./backend/AssetBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./modal/PopconfirmModal";
import {DeleteOutlined, ReloadOutlined} from "@ant-design/icons";

const {Option} = Select;

class AssetListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      providers: [],
      selectedProvider: null,
      scanning: false,
    };
  }

  componentDidMount() {
    this.getProviders();
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          const cloudProviders = res.data.filter(provider => 
            provider.category === "Public Cloud" || provider.category === "Private Cloud"
          );
          this.setState({
            providers: cloudProviders,
            selectedProvider: cloudProviders.length > 0 ? cloudProviders[0].name : null,
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  newAsset() {
    return {
      owner: this.props.account.owner,
      name: `asset_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      provider: this.state.selectedProvider || "",
      displayName: `New Asset - ${Setting.getRandomName()}`,
      type: "ECS",
      resourceId: "",
      region: "",
      zone: "",
      status: "Active",
      ipAddress: "",
      size: "",
      metadata: "",
    };
  }

  addAsset() {
    const newAsset = this.newAsset();
    AssetBackend.addAsset(newAsset)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/assets/${newAsset.owner}/${newAsset.name}`, mode: "add"});
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return AssetBackend.deleteAsset(this.state.data[i]);
  };

  deleteAsset(i) {
    AssetBackend.deleteAsset(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
            pagination: {total: this.state.pagination.total - 1},
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  scanAssets() {
    if (!this.state.selectedProvider) {
      Setting.showMessage("error", i18next.t("asset:Please select a provider"));
      return;
    }

    this.setState({scanning: true});
    AssetBackend.scanAssets(this.props.account.owner, this.state.selectedProvider)
      .then((res) => {
        this.setState({scanning: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("asset:Successfully scanned {count} assets", {count: res.data?.length || 0}));
          // Refresh the list
          this.fetch({
            pagination: this.state.pagination,
            searchedColumn: this.state.searchedColumn,
            searchText: this.state.searchText,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("asset:Failed to scan assets")}: ${res.msg}`);
        }
      })
      .catch(error => {
        this.setState({scanning: false});
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getProviderLogo(provider) {
    const providerObj = this.state.providers.find(p => p.name === provider);
    if (!providerObj) {
      return null;
    }

    let logoUrl = "";
    if (providerObj.type === "Aliyun" || providerObj.type === "AlibabaCloud") {
      logoUrl = `${Setting.StaticBaseUrl}/img/social_aliyun.png`;
    } else if (providerObj.type === "AWS") {
      logoUrl = `${Setting.StaticBaseUrl}/img/social_aws.png`;
    } else if (providerObj.type === "Azure") {
      logoUrl = `${Setting.StaticBaseUrl}/img/social_azure.png`;
    } else if (providerObj.type === "GCP") {
      logoUrl = `${Setting.StaticBaseUrl}/img/social_google.png`;
    }

    if (logoUrl) {
      return <img src={logoUrl} alt={providerObj.type} width={20} height={20} style={{marginRight: 8}} />;
    }
    return null;
  }

  renderTable(assets) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "owner",
        key: "owner",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("owner"),
        render: (text, record, index) => {
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
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/assets/${record.owner}/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "120px",
        sorter: true,
        filterMultiple: false,
        filters: [
          {text: "ECS", value: "ECS"},
          {text: "Disk", value: "Disk"},
          {text: "Database", value: "Database"},
          {text: "Network", value: "Network"},
        ],
      },
      {
        title: i18next.t("general:Resource ID"),
        dataIndex: "resourceId",
        key: "resourceId",
        width: "180px",
        sorter: true,
        ...this.getColumnSearchProps("resourceId"),
      },
      {
        title: i18next.t("general:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("provider"),
        render: (text, record, index) => {
          return (
            <div style={{display: "flex", alignItems: "center"}}>
              {this.getProviderLogo(text)}
              <Link to={`/providers/${text}`}>
                {Setting.getShortText(text, 20)}
              </Link>
            </div>
          );
        },
      },
      {
        title: i18next.t("general:Region"),
        dataIndex: "region",
        key: "region",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("region"),
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        sorter: true,
        filterMultiple: false,
        filters: [
          {text: "Running", value: "Running"},
          {text: "Stopped", value: "Stopped"},
          {text: "Active", value: "Active"},
          {text: "Available", value: "Available"},
        ],
      },
      {
        title: i18next.t("general:IP Address"),
        dataIndex: "ipAddress",
        key: "ipAddress",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("ipAddress"),
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "",
        key: "op",
        width: "170px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/assets/${record.owner}/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <PopconfirmModal
                disabled={!Setting.isAdminUser(this.props.account) && (record.owner !== this.props.account.owner)}
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteAsset(index)}
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
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={assets} rowKey={(record) => `${record.owner}/${record.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap"}}>
              <div style={{display: "flex", alignItems: "center", marginBottom: "10px"}}>
                <span style={{marginRight: 10}}>{i18next.t("asset:Select Provider")}:</span>
                <Select
                  style={{width: 250}}
                  value={this.state.selectedProvider}
                  onChange={(value) => this.setState({selectedProvider: value})}
                >
                  {this.state.providers.map(provider => (
                    <Option key={provider.name} value={provider.name}>
                      <div style={{display: "flex", alignItems: "center"}}>
                        {this.getProviderLogo(provider.name)}
                        {provider.displayName || provider.name}
                      </div>
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => this.scanAssets()}
                  loading={this.state.scanning}
                  style={{marginLeft: 10}}
                >
                  {i18next.t("asset:Scan")}
                </Button>
              </div>
              <div>
                <Button type="primary" size="small" onClick={this.addAsset.bind(this)}>{i18next.t("general:Add")}</Button>
              </div>
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
    AssetBackend.getAssets(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default AssetListPage;
