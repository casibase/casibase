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
import {Button, Table, Tag} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as ScanBackend from "./backend/ScanBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import PopconfirmModal from "./modal/PopconfirmModal";

class ScanListPage extends BaseListPage {
  newScan() {
    return {
      owner: this.props.account.owner,
      name: `scan_${Setting.getRandomName()}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Scan - ${Setting.getRandomName()}`,
      asset: "",
      provider: "",
      state: "Pending",
      command: "",
      resultText: "",
    };
  }

  addScan() {
    const newScan = this.newScan();
    ScanBackend.addScan(newScan)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({pathname: `/scans/${newScan.owner}/${newScan.name}`, mode: "add"});
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
    return ScanBackend.deleteScan(this.state.data[i]);
  };

  deleteScan(i) {
    ScanBackend.deleteScan(this.state.data[i])
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

  renderTable(scans) {
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
            <Link to={`/scans/${text}/${record.name}`}>{text}</Link>
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
            <Link to={`/scans/${record.owner}/${text}`}>{text}</Link>
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
        title: i18next.t("general:Asset"),
        dataIndex: "asset",
        key: "asset",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("asset"),
        render: (text, record, index) => {
          return (
            <Link to={`/assets/${text}`}>{text}</Link>
          );
        },
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
            <Link to={`/providers/admin/${text}`}>{text}</Link>
          );
        },
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("state"),
        render: (text, record, index) => {
          let color = "default";
          if (text === "Completed") {
            color = "success";
          } else if (text === "Running") {
            color = "processing";
          } else if (text === "Failed") {
            color = "error";
          } else if (text === "Pending") {
            color = "default";
          }
          return <Tag color={color}>{text}</Tag>;
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/scans/${record.owner}/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <PopconfirmModal
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteItem(index).then(() => {
                  this.fetch({pagination: this.state.pagination});
                })}
              >
              </PopconfirmModal>
            </div>
          );
        },
      },
    ];

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={scans} rowKey={(record) => `${record.owner}/${record.name}`} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Scans")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addScan.bind(this)}>{i18next.t("general:Add")}</Button>
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
    ScanBackend.getScans(this.props.account.owner, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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
              loading: false,
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      });
  };
}

export default ScanListPage;
