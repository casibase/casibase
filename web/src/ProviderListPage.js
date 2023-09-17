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
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";

class ProviderListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      providers: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getProviders();
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            providers: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get providers: ${res.msg}`);
        }
      });
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
      temperature: 1,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      providerUrl: "https://platform.openai.com/account/api-keys",
    };
  }

  addProvider() {
    const newProvider = this.newProvider();
    ProviderBackend.addProvider(newProvider)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Provider added successfully");
          this.setState({
            providers: Setting.prependRow(this.state.providers, newProvider),
          });
        } else {
          Setting.showMessage("error", `Failed to add provider: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Provider failed to add: ${error}`);
      });
  }

  deleteProvider(i) {
    ProviderBackend.deleteProvider(this.state.providers[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Provider deleted successfully");
          this.setState({
            providers: Setting.deleteRow(this.state.providers, i),
          });
        } else {
          Setting.showMessage("error", `Provider failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Provider failed to delete: ${error}`);
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
        title: i18next.t("provider:Type"),
        dataIndex: "type",
        key: "type",
        width: "150px",
        sorter: (a, b) => a.type.localeCompare(b.type),
      },
      {
        title: i18next.t("provider:Sub type"),
        dataIndex: "subType",
        key: "subType",
        width: "180px",
        sorter: (a, b) => a.subType.localeCompare(b.subType),
      },
      {
        title: i18next.t("provider:API key"),
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
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/providers/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete provider: ${record.name} ?`}
                onConfirm={() => this.deleteProvider(index)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={providers} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("general:Providers")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addProvider.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={providers === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.providers)
        }
      </div>
    );
  }
}

export default ProviderListPage;
