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
import {Button, Select, Table, Tooltip} from "antd";
import {ReloadOutlined} from "@ant-design/icons";
import moment from "moment";
import * as Setting from "./Setting";
import * as AssetBackend from "./backend/AssetBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./modal/PopconfirmModal";

const {Option} = Select;

class AssetListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      providers: [],
      selectedProvider: "",
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
            selectedProvider: cloudProviders.length > 0 ? cloudProviders[0].name : "",
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
      displayName: `New Asset - ${Setting.getRandomName()}`,
      provider: "",
      resourceId: "",
      resourceType: "ECS Instance",
      region: "",
      zone: "",
      state: "Active",
      tag: "",
      properties: "{}",
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
          Setting.showMessage("success", i18next.t("asset:Successfully scanned assets"));
          this.fetch();
        } else {
          Setting.showMessage("error", `${i18next.t("asset:Failed to scan assets")}: ${res.msg}`);
        }
      })
      .catch(error => {
        this.setState({scanning: false});
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getProviderLogo(providerName) {
    const provider = this.state.providers.find(p => p.name === providerName);
    if (!provider) {
      return null;
    }

    const logoMap = {
      "Aliyun": "https://cdn.casbin.org/img/social_aliyun.png",
      "AWS": "https://cdn.casbin.org/img/social_aws.png",
      "Azure": "https://cdn.casbin.org/img/social_azure.png",
      "GCP": "https://cdn.casbin.org/img/social_gcp.png",
    };

    return logoMap[provider.type] || null;
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
            <Link to={`/assets/${text}/${record.name}`}>{text}</Link>
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
            <Link to={`/assets/${record.owner}/${text}`}>{text}</Link>
          );
        },
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
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("asset:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("provider"),
        render: (text, record, index) => {
          const logo = this.getProviderLogo(text);
          return (
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              {logo && <img src={logo} alt={text} style={{width: "20px", height: "20px"}} />}
              <span>{text}</span>
            </div>
          );
        },
      },
      {
        title: i18next.t("asset:Resource type"),
        dataIndex: "resourceType",
        key: "resourceType",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("resourceType"),
      },
      {
        title: i18next.t("asset:Resource ID"),
        dataIndex: "resourceId",
        key: "resourceId",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("resourceId"),
        render: (text, record, index) => {
          return (
            <Tooltip title={text}>
              <span>{Setting.getShortText(text, 25)}</span>
            </Tooltip>
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
        title: i18next.t("general:Zone"),
        dataIndex: "zone",
        key: "zone",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("zone"),
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("state"),
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
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteAsset(index)}
                disabled={!Setting.isAdminUser(this.props.account)}
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
            <div>
              {i18next.t("general:Assets")}
              <span style={{marginLeft: 32}}>
                {i18next.t("asset:Provider")}:
                <Select
                  style={{width: 200, marginLeft: 8, marginRight: 16}}
                  value={this.state.selectedProvider}
                  onChange={(value) => this.setState({selectedProvider: value})}
                >
                  {this.state.providers.map((provider) => {
                    const logo = this.getProviderLogo(provider.name);
                    return (
                      <Option key={provider.name} value={provider.name}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          {logo && <img src={logo} alt={provider.name} style={{width: "16px", height: "16px"}} />}
                          <span>{provider.name}</span>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={this.state.scanning}
                  onClick={() => this.scanAssets()}
                  disabled={!this.state.selectedProvider}
                >
                  {i18next.t("asset:Scan")}
                </Button>
              </span>
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

  render() {
    return (
      <div>
        <div style={{marginTop: 10}}>
          {
            this.renderTable(this.state.data)
          }
        </div>
      </div>
    );
  }
}

export default AssetListPage;
