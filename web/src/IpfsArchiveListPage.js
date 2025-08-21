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
import {Button, Modal, Popconfirm, Space, Table, Tooltip} from "antd";
import {DeleteOutlined, EditOutlined, EyeOutlined, ExclamationCircleOutlined} from "@ant-design/icons";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as IpfsArchiveBackend from "./backend/IpfsArchiveBackend";

class IpfsArchiveListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: i18next.t("ipfsArchive:Ipfs Archive List"),
    };
  }

  fetch = async(params) => {
    const {page, pageSize, sortField, sortOrder, searchText, searchedColumn} = params;
    this.setState({loading: true});

    try {
      const response = await IpfsArchiveBackend.getIpfsArchives(
        page || this.state.pagination.current,
        pageSize || this.state.pagination.pageSize,
        searchedColumn || "",
        searchText || "",
        sortField || "",
        sortOrder || ""
      );

      if (response.status === "ok") {
        this.setState({
          data: response.data || [],
          pagination: {
            ...this.state.pagination,
            current: page || this.state.pagination.current,
            pageSize: pageSize || this.state.pagination.pageSize,
            total: response.total || 0,
          },
          loading: false,
        });
      } else {
        Setting.showMessage("error", response.message || i18next.t("general:Failed to fetch data"));
        this.setState({loading: false});
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({loading: false});
    }
  };

  deleteItem = async(index) => {
    const record = this.state.data[index];
    try {
      const response = await IpfsArchiveBackend.deleteIpfsArchive(record);
      if (response.status === "ok") {
        Setting.showMessage("success", i18next.t("general:Deleted successfully"));
        return {status: "ok"};
      } else {
        Setting.showMessage("error", response.message || i18next.t("general:Failed to delete"));
        return {status: "error"};
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      return {status: "error"};
    }
  };

  viewItem = (record) => {
    // 查看详情的实现，可以导航到详情页或显示模态框
    Setting.goToLink(`/ipfs-archive/view/${encodeURIComponent(record.correlation_id)}`);
  };

  editItem = (record) => {
    // 编辑记录的实现，可以导航到编辑页
    Setting.goToLink(`/ipfs-archive/edit/${encodeURIComponent(record.correlation_id)}`);
  };

  getColumns = () => [
    {
      title: i18next.t("ipfsArchive:Correlation ID"),
      dataIndex: "correlation_id",
      key: "correlation_id",
      width: "25%",
      ...this.getColumnSearchProps("correlation_id"),
    },
    {
      title: i18next.t("ipfsArchive:IPFS Address"),
      dataIndex: "ipfs_address",
      key: "ipfs_address",
      width: "30%",
      ...this.getColumnSearchProps("ipfs_address"),
      render: (text) => (
        <Tooltip title={text} placement="topLeft" arrow>
          <div style={{wordBreak: "break-all", maxWidth: "100%"}}>{text}</div>
        </Tooltip>
      ),
    },
    {
      title: i18next.t("ipfsArchive:Update Time"),
      dataIndex: "update_time",
      key: "update_time",
      width: "20%",
      sorter: true,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: i18next.t("ipfsArchive:Data Type"),
      dataIndex: "data_type",
      key: "data_type",
      width: "10%",
      ...this.getColumnSearchProps("data_type"),
      render: (text) => {
        // 根据实际数据类型定义显示的文本
        const typeMap = {
          1: i18next.t("ipfsArchive:Record Data"),
          2: i18next.t("ipfsArchive:Other Data"),
        };
        return typeMap[text] || text;
      },
    },
    {
      title: i18next.t("general:Actions"),
      key: "actions",
      width: "15%",
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={i18next.t("general:View")}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => this.viewItem(record)}
            />
          </Tooltip>
          <Tooltip title={i18next.t("general:Edit")}>
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => this.editItem(record)}
            />
          </Tooltip>
          <Tooltip title={i18next.t("general:Delete")}>
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => this.handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  handleDelete = (record) => {
    const {confirm} = Modal;
    confirm({
      title: `${i18next.t("general:Sure to delete")}: ${record.correlation_id} ?`,
      icon: <ExclamationCircleOutlined />,
      okText: i18next.t("general:OK"),
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
      onOk: () => {
        const index = this.state.data.findIndex(item => item.correlation_id === record.correlation_id);
        if (index !== -1) {
          this.deleteItem(index);
        }
      },
    });
  };

  renderTable = (data) => {
    const columns = this.getColumns();

    return (
      <div>
        <div style={{ color: 'red', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
          页面灰度测试中！请勿进行操作！
        </div>
        <Table
          scroll={{x: "max-content"}}
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.correlation_id}
          rowSelection={this.getRowSelection()}
          size="middle"
          bordered
          pagination={this.state.pagination}
          title={() => (
            <div>
              {this.state.title}
              <div style={{float: 'right'}}>
                <Button
                  type="primary"
                  onClick={() => this.fetch({pagination: this.state.pagination})}
                >
                  {i18next.t("general:Refresh")}
                </Button>
              </div>
            </div>
          )}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  };
}

export default IpfsArchiveListPage;