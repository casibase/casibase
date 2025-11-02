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
import {Alert, Button, Modal, Progress, Space, Table, Tag, Typography} from "antd";
import i18next from "i18next";
import * as ScanBackend from "../backend/ScanBackend";
import * as Setting from "../Setting";

const {Text} = Typography;

class OsPatchResultRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patches: null,
      error: null,
      pageSize: 10,
      installingKB: null,
      installModalVisible: false,
      installProgress: null,
      monitorInterval: null,
    };
  }

  componentDidMount() {
    this.parseResult();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.result !== this.props.result) {
      this.parseResult();
    }
  }

  componentWillUnmount() {
    // Clean up monitoring interval when component unmounts
    if (this.state.monitorInterval) {
      clearInterval(this.state.monitorInterval);
    }
  }

  parseResult() {
    const {result} = this.props;
    if (!result) {
      this.setState({patches: null, error: null});
      return;
    }

    try {
      const parsed = JSON.parse(result);
      this.setState({patches: Array.isArray(parsed) ? parsed : [parsed], error: null});
    } catch (e) {
      this.setState({patches: null, error: "Failed to parse scan result: " + e.message});
    }
  }

  renderStatus(status) {
    const colorMap = {
      "Available": "blue",
      "Downloaded": "cyan",
      "Installed": "green",
      "Pending Restart": "orange",
      "Succeeded": "green",
      "Failed": "red",
    };
    return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
  }

  renderBooleanTag(value, trueText, falseText) {
    if (value === true) {
      return <Tag color="orange">{trueText || "Yes"}</Tag>;
    } else if (value === false) {
      return <Tag color="green">{falseText || "No"}</Tag>;
    }
    return null;
  }

  getProviderFromContext() {
    // Get provider from either provider prop or scan's provider
    if (this.props.provider) {
      return `${this.props.provider.owner}/${this.props.provider.name}`;
    }
    if (this.props.scan && this.props.scan.provider) {
      return this.props.scan.provider;
    }
    return null;
  }

  handleInstallPatch(kb) {
    const provider = this.getProviderFromContext();
    if (!provider) {
      Setting.showMessage("error", i18next.t("scan:Provider not found"));
      return;
    }

    this.setState({
      installingKB: kb,
      installModalVisible: true,
      installProgress: {
        kb: kb,
        status: "Starting",
        percentComplete: 0,
        isComplete: false,
        startTime: new Date().toISOString(),
      },
    });

    // Call install API
    ScanBackend.installPatch(provider, kb)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            installProgress: res.data,
          });

          // If installation is complete, stop monitoring
          if (res.data.isComplete) {
            if (res.data.status === "Succeeded" || res.data.status === "Completed") {
              Setting.showMessage("success", i18next.t("scan:Patch installed successfully"));
              // Trigger a refresh if callback is provided
              if (this.props.onRefresh) {
                this.props.onRefresh();
              }
            } else {
              Setting.showMessage("error", `${i18next.t("scan:Installation failed")}: ${res.data.error || res.data.status}`);
            }
          } else {
            // Start monitoring progress
            this.startMonitoring(provider, kb);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("scan:Failed to install patch")}: ${res.msg}`);
          this.setState({
            installProgress: {
              ...this.state.installProgress,
              status: "Failed",
              error: res.msg,
              isComplete: true,
            },
          });
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("scan:Failed to install patch")}: ${error}`);
        this.setState({
          installProgress: {
            ...this.state.installProgress,
            status: "Failed",
            error: error.toString(),
            isComplete: true,
          },
        });
      });
  }

  startMonitoring(provider, kb) {
    const interval = setInterval(() => {
      ScanBackend.monitorPatchProgress(provider, kb)
        .then((res) => {
          if (res.status === "ok") {
            this.setState({
              installProgress: res.data,
            });

            // If installation is complete, stop monitoring
            if (res.data.isComplete) {
              clearInterval(this.state.monitorInterval);
              this.setState({monitorInterval: null});

              if (res.data.status === "Succeeded" || res.data.status === "Completed") {
                Setting.showMessage("success", i18next.t("scan:Patch installed successfully"));
                // Trigger a refresh if callback is provided
                if (this.props.onRefresh) {
                  this.props.onRefresh();
                }
              } else {
                Setting.showMessage("error", `${i18next.t("scan:Installation failed")}: ${res.data.error || res.data.status}`);
              }
            }
          }
        })
        .catch((error) => {
          // Failed to monitor progress, stop monitoring
          clearInterval(this.state.monitorInterval);
          this.setState({
            monitorInterval: null,
            installProgress: {
              ...this.state.installProgress,
              status: "Error",
              error: error.toString(),
              isComplete: true,
            },
          });
        });
    }, 5000); // Poll every 5 seconds

    this.setState({monitorInterval: interval});
  }

  handleCloseModal() {
    // Clean up monitoring interval when modal is closed
    if (this.state.monitorInterval) {
      clearInterval(this.state.monitorInterval);
    }

    this.setState({
      installingKB: null,
      installModalVisible: false,
      installProgress: null,
      monitorInterval: null,
    });
  }

  renderInstallModal() {
    const {installProgress} = this.state;

    if (!installProgress) {
      return null;
    }

    const isComplete = installProgress.isComplete;
    const isSuccess = isComplete && (installProgress.status === "Succeeded" || installProgress.status === "Completed");
    const isFailed = isComplete && !isSuccess;

    return (
      <Modal
        title={i18next.t("scan:Installing Patch")}
        visible={this.state.installModalVisible}
        onCancel={() => this.handleCloseModal()}
        footer={
          isComplete ? [
            <Button key="close" type="primary" onClick={() => this.handleCloseModal()}>
              {i18next.t("general:Close")}
            </Button>,
          ] : null
        }
        closable={isComplete}
        maskClosable={false}
      >
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
          <div>
            <Text strong>{i18next.t("scan:KB")}:</Text> <Text code>{installProgress.kb}</Text>
          </div>
          <div>
            <Text strong>{i18next.t("scan:Status")}:</Text> {this.renderStatus(installProgress.status)}
          </div>
          <div>
            <Text strong>{i18next.t("scan:Progress")}:</Text>
            <Progress
              percent={installProgress.percentComplete}
              status={isFailed ? "exception" : isSuccess ? "success" : "active"}
            />
          </div>
          {installProgress.rebootRequired && (
            <Alert
              message={i18next.t("scan:Reboot Required")}
              description={i18next.t("scan:A system reboot is required to complete the installation")}
              type="warning"
              showIcon
            />
          )}
          {installProgress.error && (
            <Alert
              message={i18next.t("general:Error")}
              description={installProgress.error}
              type="error"
              showIcon
            />
          )}
        </Space>
      </Modal>
    );
  }

  render() {
    const {patches, error} = this.state;

    if (error) {
      return <Alert message={i18next.t("general:Error")} description={error} type="error" showIcon />;
    }

    if (!patches || patches.length === 0) {
      return <Alert message={i18next.t("scan:No patches found")} type="info" />;
    }

    const columns = [
      {
        title: i18next.t("scan:Title"),
        dataIndex: "title",
        key: "title",
        width: "25%",
        ellipsis: true,
      },
      {
        title: i18next.t("scan:KB"),
        dataIndex: "kb",
        key: "kb",
        width: "8%",
        render: (kb) => kb ? <Text code>{kb}</Text> : null,
      },
      {
        title: i18next.t("scan:Status"),
        dataIndex: "status",
        key: "status",
        width: "10%",
        render: (status) => this.renderStatus(status),
      },
      {
        title: i18next.t("scan:Size"),
        dataIndex: "size",
        key: "size",
        width: "8%",
      },
      {
        title: i18next.t("scan:Reboot Required"),
        dataIndex: "rebootRequired",
        key: "rebootRequired",
        width: "10%",
        render: (value) => this.renderBooleanTag(value, i18next.t("scan:Required"), i18next.t("scan:Not Required")),
      },
      {
        title: i18next.t("scan:Mandatory"),
        dataIndex: "isMandatory",
        key: "isMandatory",
        width: "8%",
        render: (value) => this.renderBooleanTag(value, i18next.t("scan:Yes"), i18next.t("scan:No")),
      },
      {
        title: i18next.t("scan:Installed On"),
        dataIndex: "installedOn",
        key: "installedOn",
        width: "13%",
        render: (date) => {
          if (!date) {return null;}
          try {
            const dateObj = new Date(date);
            return dateObj.toLocaleString();
          } catch (e) {
            return date;
          }
        },
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "10%",
        render: (text, record) => {
          // Only show install button for available patches (not already installed)
          const canInstall = record.status === "Available" || record.status === "Downloaded";
          if (!canInstall) {
            return null;
          }

          return (
            <Button
              type="primary"
              size="small"
              onClick={() => this.handleInstallPatch(record.kb)}
              disabled={!record.kb || this.state.installingKB === record.kb}
              loading={this.state.installingKB === record.kb}
            >
              {i18next.t("scan:Install")}
            </Button>
          );
        },
      },
    ];

    return (
      <div>
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
          <Table
            columns={columns}
            dataSource={patches}
            pagination={{
              pageSize: this.state.pageSize,
              showSizeChanger: true,
              showTotal: (total) => `${i18next.t("general:Total")}: ${total}`,
              onChange: (page, pageSize) => {
                this.setState({pageSize});
              },
            }}
            size="small"
            rowKey={(record, index) => `patch-${index}-${record.kb || ""}`}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{margin: 0}}>
                  <Text strong>{i18next.t("scan:Description")}:</Text>
                  <p style={{marginTop: "8px"}}>{record.description || i18next.t("scan:No description available")}</p>
                  {record.categories && (
                    <p style={{marginTop: "8px"}}>
                      <Text strong>{i18next.t("scan:Categories")}:</Text> {record.categories}
                    </p>
                  )}
                </div>
              ),
              rowExpandable: (record) => record.description || record.categories,
            }}
          />
        </Space>
        {this.renderInstallModal()}
      </div>
    );
  }
}

export default OsPatchResultRenderer;
