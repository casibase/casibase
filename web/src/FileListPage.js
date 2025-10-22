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
import {Button, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as FileListBackend from "./backend/FileListBackend";
import i18next from "i18next";

class FileListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newFileList() {
    const randomName = Setting.getRandomName();
    const storeName = Setting.isDefaultStoreSelected(this.props.account) ? "store-built-in" : Setting.getRequestStore(this.props.account);
    return {
      owner: "admin",
      name: `file_${randomName}`,
      createdTime: moment().format(),
      displayName: `New File - ${randomName}`,
      store: storeName,
      fileName: "example.txt",
      fileId: "",
      embeddingProvider: "",
      status: "Pending",
      tokenCount: 0,
      size: 0,
    };
  }

  addFileList() {
    const newFileList = this.newFileList();
    FileListBackend.addFileList(newFileList)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newFileList),
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
    return FileListBackend.deleteFileList(this.state.data[i]);
  };

  deleteFileList(record) {
    FileListBackend.deleteFileList(record)
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

  renderTable(fileLists) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/files/${record.owner}/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("store:File name"),
        dataIndex: "fileName",
        key: "fileName",
        width: "200px",
        sorter: (a, b) => a.fileName.localeCompare(b.fileName),
        ...this.getColumnSearchProps("fileName"),
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("store:File ID"),
        dataIndex: "fileId",
        key: "fileId",
        width: "150px",
        sorter: (a, b) => a.fileId.localeCompare(b.fileId),
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("general:Store"),
        dataIndex: "store",
        key: "store",
        width: "150px",
        sorter: (a, b) => a.store.localeCompare(b.store),
        ...this.getColumnSearchProps("store"),
        render: (text, record, index) => {
          return (
            <Link to={`/stores/${record.owner}/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("store:Embedding provider"),
        dataIndex: "embeddingProvider",
        key: "embeddingProvider",
        width: "180px",
        sorter: (a, b) => a.embeddingProvider.localeCompare(b.embeddingProvider),
        render: (text, record, index) => {
          if (!text) {
            return null;
          }
          return (
            <Link to={`/providers/${record.owner}/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        sorter: (a, b) => a.status.localeCompare(b.status),
        filters: [
          {text: "Pending", value: "Pending"},
          {text: "Processing", value: "Processing"},
          {text: "Completed", value: "Completed"},
          {text: "Failed", value: "Failed"},
        ],
        onFilter: (value, record) => record.status === value,
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("chat:Token count"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "130px",
        sorter: (a, b) => a.tokenCount - b.tokenCount,
        render: (text, record, index) => {
          return text;
        },
      },
      {
        title: i18next.t("general:Size"),
        dataIndex: "size",
        key: "size",
        width: "120px",
        sorter: (a, b) => a.size - b.size,
        render: (text, record, index) => {
          return Setting.getFriendlyFileSize(text);
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "170px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/files/${record.owner}/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              {this.renderDeleteButton(i18next.t("general:Delete"), index, record)}
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
      onChange: (page, pageSize) => {
        this.fetch({pagination: {current: page, pageSize}});
      },
      onShowSizeChange: (current, size) => {
        this.fetch({pagination: {current, pageSize: size}});
      },
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={fileLists} rowKey="name" size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Files")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addFileList.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={this.state.loading}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    const field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    const store = Setting.getRequestStore(this.props.account);
    this.setState({loading: true});
    FileListBackend.getFileLists("admin", store, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            loading: false,
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
            Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
          }
        }
      });
  };

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.data)
        }
      </div>
    );
  }
}

export default FileListPage;
