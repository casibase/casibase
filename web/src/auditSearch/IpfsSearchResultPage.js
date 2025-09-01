// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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
import { Button, Table, Typography, Tabs, Tag, Tooltip, Space, Empty, Badge, message, Alert, Dropdown, Menu } from "antd";
import MultiConditionQueryModal from "./MultiConditionQueryModal";
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import * as IpfsArchiveBackend from "../backend/IpfsArchiveBackend";
import * as Setting from "../Setting";
import i18next from "i18next";
import DataTypeConverter from "../common/DataTypeConverter";
import BaseListPage from "../BaseListPage";
import "./IpfsSearchResultPage.less"

// 禁用查询按钮时去除hover效果
const customButtonStyle = {
  marginLeft: 8,
  ...(window.matchMedia && window.matchMedia('(hover: hover)').matches ? {
    pointerEvents: 'auto',
  } : {}),
};
const { Title } = Typography;

class IPFSSearchResultPage extends BaseListPage {

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      correlationId: props.match.params.correlationId,
      groupedArchives: {},
      allDataTypes: [],
      activeDataType: 1,
      selectedRowKeys: [],
      selectedRows: [],
    };
    this.multiCondModalRef = React.createRef();
  }

  componentDidMount() {
    // 获取所有数据类型
    const dataTypes = Object.keys(DataTypeConverter.getAllDataTypes()).map(Number);
    const initialDataType = dataTypes[0] || 1;

    // 先设置状态
    this.setState({
      allDataTypes: dataTypes,
      activeDataType: initialDataType
    });

    // 再调用基类的componentDidMount
    super.componentDidMount();

    // 首次加载只加载第一个tab的数据
    if (initialDataType !== null) {
      this.fetch({ dataType: initialDataType });
    }
  }

  handleTabChange = (key) => {
    // 点击tab时检索对应dataType的数据，切换tab时清空选择
    const dataType = parseInt(key);
    this.setState({ activeDataType: dataType, selectedRowKeys: [], selectedRows: [] }, () => {
      this.fetch({ dataType, pagination: this.state.pagination });
    });
  }

  onSelectChange = (selectedRowKeys, selectedRows) => {
    this.setState({ selectedRowKeys, selectedRows });
  };

  fetch = async (params) => {
    const { dataType = this.state.activeDataType, page, pageSize } = params;
    const { correlationId } = this.state;
    const currentPage = page || this.state.pagination.current || 1;
    const currentPageSize = pageSize || this.state.pagination.pageSize || 10;

    this.setState({ loading: true });

    try {
      const response = await IpfsArchiveBackend.getIpfsArchivesByCorrelationIdAndDataType(
        currentPage.toString(),
        currentPageSize.toString(),
        dataType,
        correlationId
      );

      if (response.status === "ok") {
        const newGroupedArchives = { ...this.state.groupedArchives };
        if (response.data && response.data.length > 0) {
          newGroupedArchives[dataType] = response.data;
        } else {
          // 清空该dataType的数据，避免显示旧数据
          delete newGroupedArchives[dataType];
        }
        // 存储总数，用于分页
        if (response.total) {
          newGroupedArchives[`${dataType}_total`] = response.total;
        } else {
          delete newGroupedArchives[`${dataType}_total`];
        }

        this.setState({
          groupedArchives: newGroupedArchives,
          pagination: {
            ...this.state.pagination,
            current: currentPage,
            pageSize: currentPageSize,
            total: response.total || 0
          },
          loading: false
        });
      } else {
        Setting.showMessage("error", response.message || i18next.t("general:Failed to fetch data"));
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  }

  renderTable = (data) => {
    const columns = this.getColumns();
    // 自定义checkbox，禁用时加tooltip
    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: (record) => ({
        disabled: !record.ipfsAddress || record.ipfsAddress === "",
      }),
      renderCell: (checked, record, index, originNode) => {
        const disabled = !record.ipfsAddress || record.ipfsAddress === "";
        if (disabled) {
          return (
            <Tooltip title={i18next.t("ipfsArchive:NotArchivedTip", "该数据未归档至ipfs")}>
              <span>{originNode}</span>
            </Tooltip>
          );
        }
        return originNode;
      },
    };
    return (
      <Table
        rowSelection={rowSelection}
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="middle"
        bordered
        pagination={this.state.pagination}
        loading={this.state.loading}
        onChange={this.handleTableChange}
      />
    );
  };

  getColumns = () => [
    {
      title: i18next.t("ipfsArchive:Record ID"),
      dataIndex: "recordId",
      key: "recordId",
      width: "150px",
      ...this.getColumnSearchProps(null),
      render: (text) => text || "---"
    },
    // {
    //   title: i18next.t("ipfsArchive:Correlation ID"),
    //   dataIndex: "correlationId",
    //   key: "correlationId",
    //   width: "200px",
    //   ...this.getColumnSearchProps("correlationId"),
    //   render: (text) => text || "---"
    // },
    {
      title: i18next.t("ipfsArchive:IPFS Address"),
      dataIndex: "ipfsAddress",
      key: "ipfsAddress",
      width: "300px",
      ...this.getColumnSearchProps(null),
      render: (text) => (
        <Tooltip title={text} placement="topLeft" arrow>
          <div style={{ wordBreak: "break-all", maxWidth: "100%" }}>{text}</div>
        </Tooltip>
      )
    },
    {
      title: i18next.t("ipfsArchive:Archive Status"),
      dataIndex: "ipfsAddress",
      key: "archiveStatus",
      width: "100px",
      render: (text) => {
        if (text && text !== "") {
          return <Tag color="success">{i18next.t("ipfsArchive:Archived")}</Tag>;
        } else {
          return <Tag color="error">{i18next.t("ipfsArchive:Not Archived")}</Tag>;
        }
      },
    },
    {
      title: i18next.t("ipfsArchive:Upload Time"),
      dataIndex: "uploadTime",
      key: "uploadTime",
      width: "150px",
      // sorter: true,
      // sortDirections: ["descend", "ascend"],
      render: (text) => text === "0000-00-00 00:00:00" ? "---" : text
    },
    {
      title: i18next.t("general:Action"),
      key: "action",
      fixed: "right",
      render: (_, record) => {
        // 按钮不再禁用
        return (
          <Space size="middle">
            <Tooltip title={i18next.t("general:View")}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => this.viewItem(record)}
              />
            </Tooltip>
            <Tooltip title={i18next.t("ipfsArchive:Open in Records")}>
              <Button
                type="default"
                icon={<FileTextOutlined />}
                size="small"
                onClick={() => {
                  const org = this.props.account && this.props.account.owner ? this.props.account.owner : Setting.getRequestOrganization(this.props.account);
                  const rid = record.recordId;
                  this.props.history.push(`/records/${org}/${encodeURIComponent(rid)}`);
                }}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  viewItem = (record) => {
    this.props.history.push({
      pathname: `/ipfs-archive/edit/${encodeURIComponent(record.id)}`,
      mode: "view"
    });
  };

  handleQueryClick = () => {
    const { correlationId } = this.state;
    const { selectedRows } = this.state;
    // 取所有选中行的ipfsAddress，去重且非空
    const ipfsAddresses = Array.from(new Set(selectedRows.map(row => row.ipfsAddress).filter(addr => !!addr)));
    // 构造queryConditions，始终包含correlationId等于当前correlationId的条件
    const queryCondFixed = [[{
      field: "correlationId",
      pos: ipfsAddresses[0],
      compare: "eq",
      val: correlationId,
      type: "string"
    }]];

    this.handleQueryReq(queryCondFixed);
  }

  handleQueryReq = (queryCondJson) => {
    const { selectedRows } = this.state;
    // 取所有选中行的ipfsAddress，去重且非空
    const ipfsAddresses = Array.from(new Set(selectedRows.map(row => row.ipfsAddress).filter(addr => !!addr)));
    if (ipfsAddresses.length === 0) {
      // 理论不会出现，按钮已禁用
      return;
    }

    // 单表查询
    const queryItemObj = {
      queryConcatType: "single",
      filePos: [ipfsAddresses],
      returnField: [ipfsAddresses[0] + "_*"],
      queryConditions: queryCondJson,
    };

    console.log('单表查询条件:', queryItemObj);
    const queryItem = JSON.stringify(queryItemObj);
    this.props.history.push({
      pathname: '/ipfs-search/query-result',
      state: { queryItem },
    });
  };


  // 多条件查询回调
  handleMultiCondQuery = (queryCond) => {
    const { correlationId } = this.state;
    const { selectedRows } = this.state;
    const ipfsAddresses = Array.from(new Set(selectedRows.map(row => row.ipfsAddress).filter(addr => !!addr)));
    if (ipfsAddresses.length === 0) {
      // 理论不会出现，按钮已禁用
      return;
    }
    // 每个一维数组（条件组）为：条件对象数组 + 一个queryCondFixed对象
    const queryCondWithPos = queryCond.map(group => {
      const groupWithPos = group.map(cond => ({ ...cond, pos: ipfsAddresses[0] }));
      const queryCondFixed = {
        field: "correlationId",
        pos: ipfsAddresses[0],
        compare: "eq",
        val: correlationId,
        type: "string"
      };
      return [...groupWithPos, queryCondFixed];
    });
    // 你可以在这里继续组装queryItem、跳转等
    this.handleQueryReq(queryCondWithPos);

  }

  render() {
    const { correlationId, groupedArchives, allDataTypes, activeDataType, selectedRowKeys } = this.state;
    const { TabPane } = Tabs;

    // correlationId 展示省略和 tooltip
    const maxCorrLength = 24; // 超过24字符省略
    const showEllipsis = correlationId && correlationId.length > maxCorrLength;
    const displayCorr = showEllipsis ? correlationId.slice(0, maxCorrLength) + '...' : correlationId;

    const menu = (
      <Menu>
        <Menu.Item key="multi-cond-query" onClick={() => this.multiCondModalRef.current && this.multiCondModalRef.current.show()}>
          多条件查询
        </Menu.Item>
      </Menu>
    );
    return (
      <div className="ipfs-search-result-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0" }}>
          <Title level={2} style={{ margin: 0 }}>
            索引
            <Tooltip title={showEllipsis ? correlationId : undefined} placement="top">
              <span style={{ color: "#1890ff", background: "#e6f7ff", borderRadius: "12px", padding: "3px 14px", fontSize: "24px", margin: '0 6px', maxWidth: 350, display: 'inline-block', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayCorr}
              </span>
            </Tooltip>
            的归档记录：
          </Title>
          <div>
            <Button
              type="default"
              onClick={() => this.fetch({ dataType: this.state.activeDataType, pagination: this.state.pagination })}
              style={{ marginLeft: 16 }}
            >
              {i18next.t("ipfsSearch:Refresh", "刷新")}
            </Button>
            {selectedRowKeys.length > 0 ? (
              <Dropdown overlay={menu} placement="bottomRight">
                <Badge count={selectedRowKeys.length} offset={[0, 0]} style={{ marginLeft: 8 }}>
                  <Button
                    type="primary"
                    style={customButtonStyle}
                    onClick={this.handleQueryClick}
                    className={''}
                  >
                    {i18next.t("ipfsSearch:Query", "查询")}
                  </Button>
                </Badge>
              </Dropdown>
            ) : (
              <Badge count={0} offset={[0, 0]} style={{ marginLeft: 8 }}>
                <Button
                  type="primary"
                  style={{ ...customButtonStyle, background: '#333', color: '#888', borderColor: '#333', cursor: 'not-allowed', boxShadow: 'none' }}
                  disabled
                  className={'no-hover'}
                >
                  {i18next.t("ipfsSearch:Query", "查询")}
                </Button>
              </Badge>
            )}
          </div>
        </div>
        <MultiConditionQueryModal
          ref={this.multiCondModalRef}
          selectedRows={this.state.selectedRows}
          onOk={this.handleMultiCondQuery}
        />
        <div style={{ marginBottom: 16 }}>
          <Alert
            message={i18next.t("ipfsArchive:Please select the records you want to query", "先勾选要查询的记录，随后点击右上角查询")}
            type="info"
            showIcon
          />
        </div>
        <Tabs defaultActiveKey={allDataTypes[0]?.toString() || "1"} type="line" onChange={this.handleTabChange} activeKey={activeDataType?.toString()}>
          {allDataTypes.map((dataType) => (
            <TabPane key={dataType} tab={DataTypeConverter.convertToChinese(dataType)}>
              {groupedArchives[dataType] ? (
                this.renderTable(groupedArchives[dataType])
              ) : (
                <Empty description={i18next.t("ipfsSearch:No results found")} style={{ margin: "40px 0" }} />
              )}
            </TabPane>
          ))}
        </Tabs>
      </div>
    );
  }
}

export default IPFSSearchResultPage;