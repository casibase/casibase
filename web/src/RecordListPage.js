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
import {Button, Switch, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as RecordBackend from "./backend/RecordBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./common/modal/PopconfirmModal";

class RecordListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      providerMap: {},
    };
  }

  componentDidMount() {
    this.getProviders();
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          const providerMap = {};
          for (const provider of res.data) {
            providerMap[provider.name] = provider;
          }
          this.setState({
            providerMap: providerMap,
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  newRecord() {
    return {
      owner: this.props.account.owner,
      name: Setting.GenerateId(),
      createdTime: moment().format(),
      provider: "",
      organization: this.props.account.owner,
      clientIp: "::1",
      user: this.props.account.name,
      method: "POST",
      requestUri: "/api/get-account",
      action: "login",
      isTriggered: false,
    };
  }

  addRecord() {
    const newRecord = this.newRecord();
    RecordBackend.addRecord(newRecord)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/records/${newRecord.owner}/${newRecord.name}`, mode: "add"});
          Setting.showMessage("success", "Record added successfully");
        } else {
          Setting.showMessage("error", `Failed to add Record: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Record failed to add: ${error}`);
      });
  }

  deleteRecord(i) {
    RecordBackend.deleteRecord(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Record deleted successfully");
          this.setState({
            data: Setting.deleteRow(this.state.data, i),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to delete Record: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Record failed to delete: ${error}`);
      });
  }

  commitRecord(i) {
    RecordBackend.commitRecord(this.state.data[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Record committed successfully");
          this.fetch({
            pagination: this.state.pagination,
          });
        } else {
          Setting.showMessage("error", `Failed to commit Record: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Record failed to commit: ${error}`);
      });
  }

  queryRecord(record) {
    RecordBackend.queryRecord(record.owner, record.name)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage(res.data.includes("Mismatched") ? "error" : "success", `${res.data}`);
        } else {
          Setting.showMessage("error", `Failed to query record: ${res.msg}`);
        }
      });
  }

  renderTable(records) {
    const columns = [
      {
        title: i18next.t("general:Organization"),
        dataIndex: "organization",
        key: "organization",
        width: "110px",
        sorter: true,
        ...this.getColumnSearchProps("organization"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/organizations/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:ID"),
        dataIndex: "id",
        key: "id",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("id"),
      },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "300px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/records/${record.organization}/${record.name}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:Client IP"),
        dataIndex: "clientIp",
        key: "clientIp",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("clientIp"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={`https://db-ip.com/${text}`}>
              {text}
            </a>
          );
        },
      },
      // {
      //   title: i18next.t("general:User agent"),
      //   dataIndex: "userAgent",
      //   key: "userAgent",
      //   width: "150px",
      //   sorter: true,
      //   ...this.getColumnSearchProps("userAgent"),
      //   render: (text, record, index) => {
      //     return text;
      //   },
      // },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "150px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Provider"),
        dataIndex: "provider",
        key: "provider",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("provider"),
        render: (text, record, index) => {
          return (
            <Link to={`/providers/${record.owner}/${text}`}>
              {
                Setting.getShortText(text, 25)
              }
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:User"),
        dataIndex: "user",
        key: "user",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("user"),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${record.organization}/${record.user}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Method"),
        dataIndex: "method",
        key: "method",
        width: "110px",
        sorter: true,
        filterMultiple: false,
        filters: [
          {text: "GET", value: "GET"},
          {text: "HEAD", value: "HEAD"},
          {text: "POST", value: "POST"},
          {text: "PUT", value: "PUT"},
          {text: "DELETE", value: "DELETE"},
          {text: "CONNECT", value: "CONNECT"},
          {text: "OPTIONS", value: "OPTIONS"},
          {text: "TRACE", value: "TRACE"},
          {text: "PATCH", value: "PATCH"},
        ],
      },
      {
        title: i18next.t("general:Request URI"),
        dataIndex: "requestUri",
        key: "requestUri",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("requestUri"),
      },
      {
        title: i18next.t("user:Language"),
        dataIndex: "language",
        key: "language",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("language"),
      },
      {
        title: i18next.t("record:Response"),
        dataIndex: "response",
        key: "response",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("response"),
      },
      {
        title: i18next.t("record:Object"),
        dataIndex: "object",
        key: "object",
        width: "90px",
        sorter: true,
        ...this.getColumnSearchProps("object"),
      },
      {
        title: i18next.t("general:Is triggered"),
        dataIndex: "isTriggered",
        key: "isTriggered",
        width: "140px",
        sorter: true,
        render: (text, record, index) => {
          if (!["signup", "login", "logout", "update-user"].includes(record.action)) {
            return null;
          }

          return (
            <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" checked={text} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("action"),
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("general:Block"),
        dataIndex: "block",
        key: "block",
        width: "90px",
        sorter: true,
        fixed: (Setting.isMobile()) ? "false" : "right",
        ...this.getColumnSearchProps("block"),
        render: (text, record, index) => {
          return Setting.getBlockBrowserUrl(this.state.providerMap, record.provider, text);
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "270px",
        fixed: (Setting.isMobile()) ? "false" : "right",
        render: (text, record, index) => {
          return (
            <div>
              {
                (record.block === "") ? (
                  <Button
                    disabled={record.block !== ""}
                    style={{marginTop: "10px", marginRight: "10px"}}
                    type="primary" danger
                    onClick={() => this.commitRecord(index)}
                  >{i18next.t("record:Commit")}
                  </Button>
                ) : (
                  <Button
                    disabled={record.block === ""}
                    style={{marginTop: "10px", marginRight: "10px"}}
                    type="primary"
                    onClick={() => this.queryRecord(record)}
                  >{i18next.t("record:Query")}
                  </Button>
                )
              }
              <Button
                // disabled={record.owner !== this.props.account.owner}
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                onClick={() => this.props.history.push(`/records/${record.owner}/${record.name}`)}
              >{i18next.t("general:View")}
              </Button>
              <PopconfirmModal
                // disabled={record.owner !== this.props.account.owner}
                fakeDisabled={true}
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteRecord(index)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={records} rowKey={(record) => `${record.owner}/${record.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Records")}&nbsp;&nbsp;&nbsp;&nbsp;
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
    RecordBackend.getRecords(Setting.getRequestOrganization(this.props.account), params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default RecordListPage;
