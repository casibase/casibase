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
import {Alert, Card, Descriptions, Space, Table, Tag, Typography} from "antd";
import i18next from "i18next";

const {Text} = Typography;

class NmapResultRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scanResult: null,
      error: null,
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

  parseResult() {
    const {result} = this.props;
    if (!result) {
      this.setState({scanResult: null, error: null});
      return;
    }

    try {
      const parsed = JSON.parse(result);
      this.setState({scanResult: parsed, error: null});
    } catch (e) {
      this.setState({scanResult: null, error: "Failed to parse scan result: " + e.message});
    }
  }

  renderHostStatus(status) {
    const color = status === "up" ? "green" : "red";
    return <Tag color={color}>{status}</Tag>;
  }

  renderPortState(state) {
    const colorMap = {
      open: "green",
      closed: "red",
      filtered: "orange",
    };
    return <Tag color={colorMap[state] || "default"}>{state}</Tag>;
  }

  renderHostCard(host, index) {
    const portColumns = [
      {
        title: i18next.t("machine:Port"),
        dataIndex: "port",
        key: "port",
        width: "20%",
      },
      {
        title: i18next.t("general:State"),
        dataIndex: "state",
        key: "state",
        width: "20%",
        render: (state) => this.renderPortState(state),
      },
      {
        title: i18next.t("scan:Service"),
        dataIndex: "service",
        key: "service",
        width: "30%",
      },
      {
        title: i18next.t("general:Version"),
        dataIndex: "version",
        key: "version",
        width: "30%",
      },
    ];

    return (
      <Card
        key={index}
        type="inner"
        title={
          <Space>
            <Text strong>{host.ip}</Text>
            {host.hostname && <Text type="secondary">({host.hostname})</Text>}
            {this.renderHostStatus(host.status)}
          </Space>
        }
        style={{marginBottom: "16px"}}
      >
        <Descriptions column={2} size="small">
          {host.latency && (
            <Descriptions.Item label={i18next.t("scan:Latency")}>
              {host.latency}
            </Descriptions.Item>
          )}
          {host.macAddr && (
            <Descriptions.Item label={i18next.t("scan:MAC Address")}>
              {host.macAddr}
            </Descriptions.Item>
          )}
          {host.vendor && (
            <Descriptions.Item label={i18next.t("scan:Vendor")}>
              {host.vendor}
            </Descriptions.Item>
          )}
          {host.os && (
            <Descriptions.Item label={i18next.t("node:OS")}>
              {host.os}
            </Descriptions.Item>
          )}
        </Descriptions>

        {host.ports && host.ports.length > 0 && (
          <div style={{marginTop: "16px"}}>
            <Text strong>{i18next.t("scan:Open Ports")}:</Text>
            <Table
              columns={portColumns}
              dataSource={host.ports}
              pagination={false}
              size="small"
              style={{marginTop: "8px"}}
              rowKey={(record, idx) => `${host.ip}-${record.port}-${idx}`}
            />
          </div>
        )}
      </Card>
    );
  }

  render() {
    const {scanResult, error} = this.state;

    if (error) {
      return <Alert message={i18next.t("general:Error")} description={error} type="error" showIcon />;
    }

    if (!scanResult) {
      return null;
    }

    return (
      <div>
        <Card size="small" style={{marginBottom: "16px"}}>
          <Descriptions column={1} size="small">
            {scanResult.startTime && (
              <Descriptions.Item label={i18next.t("scan:Start Time")}>
                {scanResult.startTime}
              </Descriptions.Item>
            )}
            {scanResult.endTime && (
              <Descriptions.Item label={i18next.t("scan:End Time")}>
                {scanResult.endTime}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={i18next.t("scan:Summary")}>
              {scanResult.summary}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {scanResult.hosts && scanResult.hosts.length > 0 ? (
          scanResult.hosts.map((host, index) => this.renderHostCard(host, index))
        ) : (
          <Alert message={i18next.t("scan:No hosts found")} type="info" />
        )}
      </div>
    );
  }
}

export default NmapResultRenderer;
