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
import {Button, Input, Modal, Result, Space} from "antd";
import {ExclamationCircleOutlined, SearchOutlined} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import i18next from "i18next";
import * as Setting from "./Setting";

const {confirm} = Modal;

class BaseListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      data: [],
      pagination: {
        current: 1,
        pageSize: 10,
      },
      loading: false,
      searchText: "",
      searchedColumn: "",
      isAuthorized: true,
      selectedRowKeys: [],
      selectedRows: [],
    };
  }

  UNSAFE_componentWillMount() {
    const {pagination} = this.state;
    this.fetch({pagination});
  }

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
      <div style={{padding: 8}}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{marginBottom: 8, display: "block"}}
        />

        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{width: 90}}
          >
              Search
          </Button>
          <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{width: 90}}>
              Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({closeDropdown: false});
              this.setState({
                searchText: selectedKeys[0],
                searchedColumn: dataIndex,
              });
            }}
          >
              Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{color: filtered ? "#1890ff" : undefined}} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
    onFilterDropdownOpenChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100);
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{backgroundColor: "#ffc069", padding: 0}}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  getRowSelection = () => ({
    selectedRowKeys: this.state.selectedRowKeys,
    onChange: this.onSelectChange,
    onSelectAll: this.onSelectAll,
  });

  onSelectChange = (selectedRowKeys, selectedRows) => {
    this.setState({
      selectedRowKeys,
      selectedRows,
    });
  };

  onSelectAll = (selected, selectedRows) => {
    const keys = selectedRows.map(row => this.getRowKey(row));
    this.setState({
      selectedRowKeys: keys,
      selectedRows: selectedRows,
    });
  };

  getRowKey = (record) => {
    return record.key || record.id || record.name;
  };

  clearSelection = () => {
    this.setState({
      selectedRowKeys: [],
      selectedRows: [],
    });
  };

  handleBulkDelete = () => {
    const {selectedRows, selectedRowKeys} = this.state;

    confirm({
      title: `${i18next.t("general:Sure to delete")}: ${selectedRowKeys.length} ${i18next.t("general:items")} ?`,
      icon: <ExclamationCircleOutlined />,
      okText: i18next.t("general:OK"),
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
      onOk: () => {
        this.performBulkDelete(selectedRows, selectedRowKeys);
      },
    });
  };

  performBulkDelete = async(selectedRows, selectedRowKeys) => {
    try {
      this.setState({loading: true});

      const sortedSelectedRows = [...selectedRows].sort((a, b) => {
        const indexA = this.state.data.findIndex(item => this.getRowKey(item) === this.getRowKey(a));
        const indexB = this.state.data.findIndex(item => this.getRowKey(item) === this.getRowKey(b));
        return indexB - indexA; // Sort in descending order of index
      });

      const deletePromises = sortedSelectedRows.map(selectedRow => {
        const index = this.state.data.findIndex(item => this.getRowKey(item) === this.getRowKey(selectedRow));
        return this.deleteItem(index);
      });

      const results = await Promise.allSettled(deletePromises);

      // Check results and handle partial failures
      const failureCount = results.filter(result =>
        result.status === "rejected" || result.value.status !== "ok"
      ).length;

      if (failureCount > 0) {
        Setting.showMessage("error", `${failureCount} ${i18next.t("general:Failed to delete")}`);
      }

      this.clearSelection();

      // Refresh the data to ensure consistency
      const {pagination} = this.state;
      this.fetch({pagination});

    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
    } finally {
      this.setState({loading: false});
    }
  };

  // Default deleteItem method - should be overridden by subclasses
  deleteItem = async(item) => {
    throw new Error("deleteItem method must be implemented by subclass");
  };

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    this.fetch({searchText: selectedKeys[0], searchedColumn: dataIndex, pagination: this.state.pagination});
  };

  handleReset = clearFilters => {
    clearFilters();
    const {pagination} = this.state;
    this.fetch({pagination});
  };

  handleTableChange = (pagination, filters, sorter) => {
    this.fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      searchText: this.state.searchText,
      searchedColumn: this.state.searchedColumn,
    });
  };

  render() {
    if (!this.state.isAuthorized) {
      return (
        <Result
          status="403"
          title="403 Unauthorized"
          subTitle={i18next.t("general:Sorry, you do not have permission to access this page or logged in status invalid.")}
          extra={<a href="/"><Button type="primary">{i18next.t("general:Back Home")}</Button></a>}
        />
      );
    }

    return (
      <div>
        {this.renderTable(this.state.data)}
      </div>
    );
  }
}

export default BaseListPage;
