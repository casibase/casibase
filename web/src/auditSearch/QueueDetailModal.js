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

import React, { useState, useEffect } from "react";
import { Modal, Tabs, Table, Tag, Tooltip, Typography, Popover, message,Alert  } from "antd";
import i18next from "i18next";
import * as Setting from "../Setting";
import * as IpfsArchiveBackend from "../backend/IpfsArchiveBackend";
import DataTypeConverter from "../common/DataTypeConverter";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";

class QueueDetailModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      queueData: {},
      loading: false,
      dataSource: [],
      dataType: 0,
    };
    this.timer = null;
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startAutoRefresh = (type) => {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.fetchQueueDataByType(type);
    }, 30000); // 每30秒刷新一次
  };

  stopAutoRefresh = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  fetchQueueDataByType = async (type) => {
    this.setState({ loading: true });
    try {
      const queueResponse = await IpfsArchiveBackend.getAllQueueData();
      if (queueResponse.status === "ok") {
        const queueData = queueResponse.data || {};
        this.setState({
          queueData,
          dataType: type,
          loading: false,
          dataSource: queueData[type] || []
        });
      } else {
        Setting.showMessage("error", queueResponse.message || i18next.t("general:Failed to fetch queue data"));
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  };

  // showModal = async () => {
  //   this.setState({ loading: true });
  //   try {
  //     const response = await IpfsArchiveBackend.getAllQueueData();
  //     if (response.status === "ok") {
  //       const queueData = response.data || {};
  //       const dataTypes = Object.keys(queueData);
  //       this.setState({
  //         visible: true,
  //         queueData,
  //         loading: false
  //       });
  //       if (dataTypes.length > 0) {
  //         this.fetchQueueDataByType(dataTypes[0]);
  //       }
  //     } else {
  //       Setting.showMessage("error", response.message || i18next.t("general:Failed to fetch queue data"));
  //       this.setState({ loading: false });
  //     }
  //   } catch (error) {
  //     Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
  //     this.setState({ loading: false });
  //   }
  // };

  /**
   * 按类型显示队列详情
   * @param {string} type - 数据类型
   */
  showModalByType = async (type) => {
    this.setState({ loading: true });
    try {
      const queueResponse = await IpfsArchiveBackend.getAllQueueData();
      if (queueResponse.status === "ok") {
        const queueData = queueResponse.data || {};
        this.setState({
          visible: true,
          queueData,
          dataType: type,
          loading: false,
          dataSource: queueData[type] || []
        });
        this.startAutoRefresh(type);
      } else {
        Setting.showMessage("error", queueResponse.message || i18next.t("general:Failed to fetch queue data"));
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  };

  handleCancel = () => {
    this.setState({
      visible: false,
      queueData: {},
      dataSource: []
    });
    this.stopAutoRefresh();
  };


  /**
   * 移除队列中的记录
   * @param {Object} record - 要移除的记录
   */
  handleRemoveRecord = async (record) => {
    try {
      this.setState({ loading: true });
      const response = await IpfsArchiveBackend.removeRecordFromQueueByRecordIdAndDataType(
        record.id,
        this.state.dataType
      );
      if (response.status === "ok") {
        Setting.showMessage("success", i18next.t("ipfsArchive:Remove record successfully"));
        // 刷新当前队列数据
        this.setState(prevState => ({
          dataSource: prevState.dataSource.filter(item => item.id !== record.id),
          loading: false
        }));
      } else {
        Setting.showMessage("error", response.message || i18next.t("ipfsArchive:Failed to remove record"));
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  };

  /**
   * 上传当前类型的队列数据到IPFS
   */
  handleUploadToIPFS = async () => {
    try {
      this.setState({ loading: true });
      const response = await IpfsArchiveBackend.archiveToIPFS(this.state.dataType);
      if (response.status === "ok") {
        message.info(i18next.t("ipfsArchive:Upload to IPFS successfully"));
        this.setState({
          // dataSource: [],
          loading: false
        });
      } else {
        Setting.showMessage("error", response.message || i18next.t("ipfsArchive:Failed to upload to IPFS"));
        this.setState({ loading: false });
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      this.setState({ loading: false });
    }
  };

  getColumns = () => [
    {
      title: i18next.t("ipfsArchive:Record ID"),
      dataIndex: "id",
      key: "id",
      width: "100px"
    },
    // {
    //   title: i18next.t("ipfsArchive:Correlation ID"),
    //   dataIndex: "correlationId",
    //   key: "correlationId",
    //   width: "200px"
    // },
    {
      title: i18next.t("ipfsArchive:Object"),
      dataIndex: "object",
      key: "object",
      width: "200px",
      render: (text, record, index) => {
        if (!text || text === "") {
          return (
            <div style={{ maxWidth: "200px" }}>
              {Setting.getShortText(text, 50)}
            </div>
          );
        }

        let formattedText;
        let isValidJson = false;
        let errorMessage;

        try {
          // Try to parse and format JSON
          const parsedJson = JSON.parse(text);
          formattedText = JSON.stringify(parsedJson, null, 2);
          isValidJson = true;
        } catch (error) {
          // If parsing fails, use original text
          formattedText = text;
          isValidJson = false;
          errorMessage = error.message;
        }

        return (
          <Popover
            placement="right"
            content={
              <div style={{ width: "600px", height: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {!isValidJson && (
                  <Alert type="error" showIcon message={
                    <Typography.Paragraph ellipsis={{ expandable: "collapsible" }} style={{ margin: 0 }}>{errorMessage}</Typography.Paragraph>}
                  />)}
                <CodeMirror
                  value={formattedText}
                  options={{
                    mode: isValidJson ? "application/json" : "text/plain",
                    theme: "material-darker",
                    readOnly: true,
                    lineNumbers: true,
                  }}
                  editorDidMount={(editor) => {
                    if (window.ResizeObserver) {
                      const resizeObserver = new ResizeObserver(() => {
                        editor.refresh();
                      });
                      resizeObserver.observe(editor.getWrapperElement().parentNode);
                    }
                  }}
                />
              </div>
            }
            trigger="hover"
          >
            <div style={{ maxWidth: "200px", cursor: "pointer" }}>
              {Setting.getShortText(text, 50)}
            </div>
          </Popover>
        );
      },
    },
    {
      title: i18next.t("ipfsArchive:Action"),
      key: "action",
      width: "100px",
      render: (_, record) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            this.handleRemoveRecord(record);
          }}
          style={{ color: '#ff4d4f' }}
        >
          {i18next.t("ipfsArchive:Remove")}
        </a>
      )
    }
  ];

  render() {
    const { visible, queueData, loading, dataSource, dataType } = this.state;
    const typeCn = DataTypeConverter.convertToChinese(dataType);

    // 计算总队列元素数量
    const totalCount = dataSource.length;

    return (
      <React.Fragment>
        <Modal
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginRight: "20px" }}>
              <span>{i18next.t("ipfsArchive:Queue Detail")}</span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={this.handleUploadToIPFS}
                  disabled={totalCount === 0 || loading}
                  style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 15px',
                    marginRight: '10px',
                    cursor: totalCount === 0 || loading ? 'not-allowed' : 'pointer',
                    opacity: totalCount === 0 || loading ? 0.6 : 1
                  }}
                >
                  {i18next.t("ipfsArchive:Upload to IPFS")}
                </button>
                <Tag color="blue">
                  类型：{typeCn} &nbsp;&nbsp;
                  {i18next.t("ipfsArchive:Total")}：{totalCount}
                </Tag>
              </div>
            </div>
          }
          visible={visible}
          onCancel={this.handleCancel}
          width={1000}
          footer={null}
        >
          <Table
            columns={this.getColumns()}
            dataSource={dataSource}
            rowKey={(record) => record.correlationId}
            size="middle"
            bordered
            loading={loading}
            pagination={{ pageSize: 10 }}
            style={{ marginTop: "16px" }}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ textAlign: "right", color: "#888", fontSize: 12, marginTop: 8 }}>
            {i18next.t("ipfsArchive:Auto refresh tip in queue modal")}
          </div>
        </Modal>

      </React.Fragment>
    );
  }
}

export default QueueDetailModal;