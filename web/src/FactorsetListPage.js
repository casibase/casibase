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
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as FactorsetBackend from "./backend/FactorsetBackend";
import i18next from "i18next";

class FactorsetListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newFactorset() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `factorset_${randomName}`,
      createdTime: moment().format(),
      displayName: `New Factorset - ${randomName}`,
      url: "https://github.com/Embedding/Chinese-Word-Vectors",
      fileName: "sgns.target.word-word.dynwin5.thr10.neg5.dim300.iter5",
      fileSize: "1.69 GB",
      dimension: 128,
      count: 10000,
      factors: [],
    };
  }

  addFactorset() {
    const newFactorset = this.newFactorset();
    FactorsetBackend.addFactorset(newFactorset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Factorset added successfully");
          this.setState({
            data: Setting.prependRow(this.state.data, newFactorset),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total + 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to add factorset: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Factorset failed to add: ${error}`);
      });
  }

  deleteFactorset(record) {
    FactorsetBackend.deleteFactorset(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Factorset deleted successfully");
          this.setState({
            data: this.state.data.filter((item) => item.name !== record.name),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `Factorset failed to delete: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Factorset failed to delete: ${error}`);
      });
  }

  renderTable(factorsets) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "140px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`/factorsets/${text}`}>
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
        title: i18next.t("general:URL"),
        dataIndex: "url",
        key: "url",
        width: "250px",
        sorter: (a, b) => a.url.localeCompare(b.url),
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={text}>
              {
                Setting.getShortText(text)
              }
            </a>
          );
        },
      },
      {
        title: i18next.t("factorset:File name"),
        dataIndex: "fileName",
        key: "fileName",
        width: "200px",
        sorter: (a, b) => a.fileName.localeCompare(b.fileName),
      },
      {
        title: i18next.t("factorset:File size"),
        dataIndex: "fileSize",
        key: "fileSize",
        width: "120px",
        sorter: (a, b) => a.fileSize.localeCompare(b.fileSize),
      },
      {
        title: i18next.t("vector:Dimension"),
        dataIndex: "dimension",
        key: "dimension",
        width: "110px",
        sorter: (a, b) => a.dimension - b.dimension,
      },
      {
        title: i18next.t("factorset:Example factors"),
        dataIndex: "factors",
        key: "factors",
        width: "120px",
        sorter: (a, b) => a.factors.localeCompare(b.factors),
        render: (text, record, index) => {
          return Setting.getTags(text, "factors");
        },
      },
      {
        title: i18next.t("factorset:Count"),
        dataIndex: "count",
        key: "count",
        width: "110px",
        sorter: (a, b) => a.count - b.count,
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/factorsets/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteFactorset(record)}
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
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={factorsets} rowKey="name" size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Factorsets")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addFactorset.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={factorsets === null}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    const field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    this.setState({loading: true});
    FactorsetBackend.getFactorsets("admin", params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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

export default FactorsetListPage;
