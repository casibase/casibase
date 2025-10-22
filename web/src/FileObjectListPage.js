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
import {Button, Table} from "antd";
import BaseListPage from "./BaseListPage";
import moment from "moment";
import * as Setting from "./Setting";
import * as FileObjectBackend from "./backend/FileObjectBackend";
import i18next from "i18next";
import PopconfirmModal from "./modal/PopconfirmModal";

class FileObjectListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newFileObject() {
    const randomName = Setting.getRandomName();
    const storeName = Setting.isDefaultStoreSelected(this.props.account) ? "store-built-in" : Setting.getRequestStore(this.props.account);
    return {
      owner: this.props.account.owner,
      name: `file_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New File - ${randomName}`,
      filename: "",
      path: "",
      size: 0,
      store: storeName,
      storageProvider: "",
      tokenCount: 0,
      status: "Active",
    };
  }

  addFileObject() {
    const newFileObject = this.newFileObject();
    FileObjectBackend.addFileObject(newFileObject)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push({
            pathname: `/file-objects/${newFileObject.name}`,
            mode: "add",
          });
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteFileObject(i) {
    FileObjectBackend.deleteFileObject(this.state.data[i])
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
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderTable(fileObjects) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("name"),
        render: (text, record, index) => {
          return (
            <Link to={`/file-objects/${record.name}`}>{text}</Link>
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
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("fileObject:Filename"),
        dataIndex: "filename",
        key: "filename",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("filename"),
      },
      {
        title: i18next.t("fileObject:Path"),
        dataIndex: "path",
        key: "path",
        width: "200px",
        sorter: true,
        ...this.getColumnSearchProps("path"),
      },
      {
        title: i18next.t("fileObject:Size"),
        dataIndex: "size",
        key: "size",
        width: "100px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFriendlyFileSize(text);
        },
      },
      {
        title: i18next.t("fileObject:Store"),
        dataIndex: "store",
        key: "store",
        width: "120px",
        sorter: true,
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
        title: i18next.t("fileObject:Storage provider"),
        dataIndex: "storageProvider",
        key: "storageProvider",
        width: "150px",
        sorter: true,
        ...this.getColumnSearchProps("storageProvider"),
      },
      {
        title: i18next.t("fileObject:Token count"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "120px",
        sorter: true,
      },
      {
        title: i18next.t("fileObject:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        sorter: true,
        ...this.getColumnSearchProps("status"),
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
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/file-objects/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <PopconfirmModal
                title={i18next.t("general:Sure to delete") + `: ${record.name} ?`}
                onConfirm={() => this.deleteFileObject(index)}
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={fileObjects} rowKey="name" size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:File Objects")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addFileObject.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch(params = {}) {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    FileObjectBackend.getFileObjects(this.props.account.owner, params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
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
            Setting.showMessage("error", res.msg);
          }
        }
      });
  }
}

export default FileObjectListPage;
