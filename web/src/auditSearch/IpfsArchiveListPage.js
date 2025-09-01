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
import { Button, Card, Col, Row, Modal, Popconfirm, Space, Table, Tag, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, ExclamationCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import i18next from "i18next";
import BaseListPage from "../BaseListPage";
import * as Setting from "../Setting";
import * as IpfsArchiveBackend from "../backend/IpfsArchiveBackend";
import DataTypeConverter from "../common/DataTypeConverter";
import QueueDetailModal from "./QueueDetailModal";

class IpfsArchiveListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: i18next.t("ipfsArchive:Ipfs Archive List"),
      queueData: {},
      loadingQueue: false,
      selectedRowKeys: []
    };
    this.queueDetailModal = React.createRef();
    this.refreshIntervalId = null;
  }

  componentDidMount() {
    super.componentDidMount();
    this.fetchQueueData();
    // 设置每30秒自动刷新
    this.refreshIntervalId = setInterval(() => {
      this.fetch({ pagination: this.state.pagination });
      this.fetchQueueData();
    }, 30000);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    // 清除定时器
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  fetchQueueData = async () => {
    this.setState({ loadingQueue: true });
    try {
      const response = await IpfsArchiveBackend.getAllQueueData();
      if (response.status === "ok") {
        this.setState({
          queueData: response.data || {},
          loadingQueue: false
        });
      } else {
        Setting.showMessage("error", response.message || i18next.t("general:Failed to fetch queue data"));
        this.setState({ loadingQueue: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loadingQueue: false });
    }
  };

  showQueueDetail = () => {
    if (this.queueDetailModal.current) {
      this.queueDetailModal.current.showModal();
    }
  };

  /**
   * 按类型显示队列详情
   * @param {string} type - 数据类型
   */
  showQueueDetailByType = (type) => {
    if (this.queueDetailModal.current) {
      this.queueDetailModal.current.showModalByType(type);
    }
  };

  fetch = async (params) => {
    const { page, pageSize, sortField, sortOrder, searchText, searchedColumn } = params;
    this.setState({ loading: true });

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
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  };

  deleteItem = async (index) => {
    const record = this.state.data[index];
    try {
      console.log(record);
      const response = await IpfsArchiveBackend.deleteIpfsArchiveById(record);
      if (response.status === "ok") {
        Setting.showMessage("success", i18next.t("general:Deleted successfully"));
        // 刷新一下
        this.fetch({ pagination: this.state.pagination });
        return { status: "ok" };
      } else {
        Setting.showMessage("error", response.message || i18next.t("general:Failed to delete"));
        return { status: "error" };
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      return { status: "error" };
    }
  };

  viewItem = (record) => {
    // 查看详情的实现，可以导航到详情页或显示模态框
    this.props.history.push({
      pathname: `/ipfs-archive/view/${encodeURIComponent(record.id)}`,
      mode: "view"
    });
  };

  editItem = (record) => {
    // 编辑记录的实现，可以导航到编辑页。
    this.props.history.push({
      pathname: `/ipfs-archive/edit/${encodeURIComponent(record.id)}`,
      mode: "edit"
    });
  };

  getColumns = () => [
    {
      title: i18next.t("ipfsArchive:Record ID"),
      dataIndex: "recordId",
      key: "recordId",
      width: "250px",
      ...this.getColumnSearchProps("recordId"),
    },
    {
      title: i18next.t("ipfsArchive:Correlation ID"),
      dataIndex: "correlationId",
      key: "correlationId",
      width: "250px",
      ...this.getColumnSearchProps("correlationId"),
    },
    {
      title: i18next.t("ipfsArchive:Data Type"),
      dataIndex: "dataType",
      key: "dataType",
      width: "200px",
      ...this.getColumnSearchProps("dataType"),
      render: (text) => {
        // 使用DataTypeConverter工具类将dataType转换为中文
        return DataTypeConverter.convertToChinese(text);
      },
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
      title: i18next.t("ipfsArchive:IPFS Address"),
      dataIndex: "ipfsAddress",
      key: "ipfsAddress",
      width: "300px",
      ...this.getColumnSearchProps("ipfsAddress"),
      render: (text) => (
        <Tooltip title={text} placement="topLeft" arrow>
          <div style={{ wordBreak: "break-all", maxWidth: "100%" }}>{text}</div>
        </Tooltip>
      ),
    },
    {
      title: i18next.t("ipfsArchive:Update Time"),
      dataIndex: "updateTime",
      key: "updateTime",
      width: "150px",
      sorter: true,
      sortDirections: ["descend", "ascend"],
      render: (text) => text == null || text === "0000-00-00 00:00:00" ? "---" : text,

    },
    {
      title: i18next.t("ipfsArchive:Create Time"),
      dataIndex: "createTime",
      key: "createTime",
      width: "150px",
      sorter: true,
      sortDirections: ["descend", "ascend"],
      render: (text) => text == null || text === "0000-00-00 00:00:00" ? "---" : text,

    },
    {
      title: i18next.t("ipfsArchive:Upload Time"),
      dataIndex: "uploadTime",
      key: "uploadTime",
      width: "150px",
      sorter: true,
      sortDirections: ["descend", "ascend"],
      render: (text) => text == null || text === "0000-00-00 00:00:00" ? "---" : text,


    },
    {
      title: i18next.t("general:Actions"),
      key: "actions",
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
          <Tooltip title={i18next.t("ipfsArchive:Open in Records")}>
            <Button
              type="default"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => {
                const org = this.props.account && this.props.account.owner ? this.props.account.owner : Setting.getRequestOrganization(this.props.account);
                const rid = record.recordId;
                this.props.history.push(`records/${org}/${encodeURIComponent(rid)}`);
              }}
            />
          </Tooltip>
          {/* <Tooltip title={i18next.t("general:Delete")}>
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => this.handleDelete(record)}
            />
          </Tooltip> */}
        </Space>
      ),
    },
  ];

  handleDelete = (record) => {
    const { confirm } = Modal;
    confirm({
      title: `${i18next.t("general:Sure to delete")}: ${record.correlationId} ?`,
      icon: <ExclamationCircleOutlined />,
      okText: i18next.t("general:OK"),
      okType: "danger",
      cancelText: i18next.t("general:Cancel"),
      onOk: () => {
        const index = this.state.data.findIndex(item => item.correlationId === record.correlationId);
        if (index !== -1) {
          this.deleteItem(index);
        }
      },
    });
  };

  getRowSelection = () => {
    return {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
      },
    };
  };

  // 弹出确认框，确认后执行将未上传数据加入队列
  showConfirmAddUnUploadQueueData = () => {
    Modal.confirm({
      title: i18next.t('ipfsArchive:Confirm Add Unuploaded Data Title'),
      content: i18next.t('ipfsArchive:Confirm Add Unuploaded Data Content'),
      okText: i18next.t('general:OK'),
      cancelText: i18next.t('general:Cancel'),
      onOk: async () => {
        await this.handleAddUnUploadQueueData();
      }
    });
  };

  handleAddUnUploadQueueData = async () => {
    try {
      this.setState({ loading: true });
      const response = await IpfsArchiveBackend.addUnUploadIpfsDataToQueue();
      if (response.status === 'ok') {
        Setting.showMessage('success', i18next.t('ipfsArchive:Successfully added unuploaded data to queue'));
        this.fetchQueueData(); // 刷新队列数据
      } else {
        Setting.showMessage('error', response.message || i18next.t('ipfsArchive:Failed to add unuploaded data to queue'));
      }
    } catch (error) {
      Setting.showMessage('error', `${i18next.t('general:Failed to connect to server')}: ${error}`);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleAddSelectedRecordsToQueue = async () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length === 0) {
      Setting.showMessage('warning', i18next.t('ipfsArchive:Please select records first'));
      return;
    }

    try {
      this.setState({ loading: true });
      // 获取选中的记录
      const selectedRecords = this.state.data.filter(record =>
        selectedRowKeys.includes(record.id)
      );

      // 验证selectedRecords是数组且不为空
      if (!Array.isArray(selectedRecords) || selectedRecords.length === 0) {
        console.error('Error: No records selected or selectedRecords is not an array');
        Setting.showMessage('error', i18next.t('ipfsArchive:Failed to process selected records'));
        this.setState({ loading: false });
        return;
      }

      // 构建recordIds和dataTypes逗号分隔字符串
      const recordIds = selectedRecords.map(record => record.recordId).join(',');
      const dataTypes = selectedRecords.map(record => record.dataType).join(',');

      console.log('recordIds:', recordIds);
      console.log('dataTypes:', dataTypes);

      const response = await IpfsArchiveBackend.addRecordsWithDataTypesToQueue(recordIds, dataTypes);
      if (response.status === 'ok') {
        Setting.showMessage('success', i18next.t('ipfsArchive:Successfully added selected records to queue'));
        this.fetchQueueData(); // 刷新队列数据
        this.setState({ selectedRowKeys: [] }); // 清空选中状态
      } else {
        Setting.showMessage('error', response.message || i18next.t('ipfsArchive:Failed to add selected records to queue'));
      }
    } catch (error) {
      Setting.showMessage('error', `${i18next.t('general:Failed to connect to server')}: ${error}`);
    } finally {
      this.setState({ loading: false });
    }
  };

  renderTable = (data) => {
    const columns = this.getColumns();
    const { queueData, loadingQueue } = this.state;
    // 获取所有可能的数据类型
    const allDataTypes = DataTypeConverter.getAllDataTypes();
    const allDataTypeKeys = Object.keys(allDataTypes);
    // 计算总数
    const totalCount = allDataTypeKeys.reduce((total, type) => {
      const records = queueData[type] || [];
      return total + (Array.isArray(records) ? records.length : 0);
    }, 0);

    return (
      <div>


        {/* 队列信息卡片 */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{i18next.t("ipfsArchive:Current Queue Status")}</span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Tag color="geekblue">{i18next.t("ipfsArchive:Total")}: {totalCount}</Tag>
                <Button
                  variant="dashed"
                  size="small"
                  style={{ marginRight: '8px' }}
                  onClick={this.showConfirmAddUnUploadQueueData}
                >
                  {i18next.t("ipfsArchive:Add Unupload Data to Queue")}
                </Button>
              </div>
            </div>
          }
          variant="outlined"
          style={{ marginBottom: '24px' }}
        // loading={loadingQueue}
        >
          <Row gutter={[16, 16]}>
            {allDataTypeKeys.map((type) => (
              <Col xs={24} sm={12} md={8} lg={6} key={type}>
                <Card
                  size="small"
                  bordered
                  style={{ height: "100%", cursor: "pointer" }}
                  onClick={() => this.showQueueDetailByType(type)}
                  hoverable
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{DataTypeConverter.convertToChinese(type)}</span>
                    <Tag color={Array.isArray(queueData[type]) && queueData[type].length > 0 ? "blue" : "default"}>
                      {Array.isArray(queueData[type]) ? queueData[type].length : 0}
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 按钮区域 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={() => this.props.history.push({
              pathname: '/ipfs-archive/add',
              mode: 'add'
            })
            }>
            {i18next.t("general:Add")}
          </Button>

          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={this.handleAddSelectedRecordsToQueue}
            disabled={this.state.selectedRowKeys.length === 0}
          >
            {i18next.t("ipfsArchive:Add Selected to Queue")}
          </Button>
          <Button
            onClick={async () => {
              this.fetch({ pagination: this.state.pagination });
              this.fetchQueueData();
            }}
          >
            {i18next.t("ipfsArchive:Refresh")}
          </Button>
        </div>
        <Table
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id}
          rowSelection={this.getRowSelection()}
          size="middle"
          bordered
          pagination={this.state.pagination}
          title={() => this.state.title}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />

        <QueueDetailModal ref={this.queueDetailModal} />
      </div>
    )
  };
}

export default IpfsArchiveListPage;