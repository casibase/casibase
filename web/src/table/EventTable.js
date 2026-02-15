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
import {Button, Card, Table, Tag, Tooltip, Typography} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import * as Setting from "../Setting";

const {Text} = Typography;

class EventTable extends React.Component {
  copyEventDetails = (event) => {
    const details = [
      `${i18next.t("general:Type")}: ${event.type}`,
      `${i18next.t("general:Status")}: ${event.reason}`,
      `${i18next.t("general:Object")}: ${event.involvedObject}`,
      `${i18next.t("general:Message")}: ${event.message}`,
      `${i18next.t("message:Author")}: ${event.source}`,
      `${i18next.t("general:Count")}: ${event.count}`,
      `${i18next.t("general:Created time")}: ${event.firstTime}`,
      `${i18next.t("general:Updated time")}: ${event.lastTime}`,
    ].join("\n");

    copy(details);
    Setting.showMessage("success", i18next.t("general:Successfully copied"));
  };

  // Get table column definitions
  getColumns = () => {
    return [
      {
        title: i18next.t("general:Type"),
        dataIndex: "type",
        key: "type",
        width: "80px",
        render: (text) => {
          const color = text === "Warning" ? "orange" : text === "Normal" ? "green" : "default";
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "reason",
        key: "reason",
        width: "120px",
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: i18next.t("general:Object"),
        dataIndex: "involvedObject",
        key: "involvedObject",
        width: "150px",
        render: (text) => (
          <Text style={{fontSize: "12px", fontFamily: "monospace"}}>
            {text}
          </Text>
        ),
      },
      {
        title: i18next.t("general:Message"),
        dataIndex: "message",
        key: "message",
        width: "300px",
        render: (text) => (
          <div>
            <Text style={{fontSize: "12px"}}>
              {text.length > 80 ? (
                <Tooltip title={text} placement="topLeft">
                  {text.substring(0, 80)}...
                </Tooltip>
              ) : (
                text
              )}
            </Text>
          </div>
        ),
      },
      {
        title: i18next.t("general:Count"),
        dataIndex: "count",
        key: "count",
        width: "60px",
        render: (text) => (
          <Tag color={text > 1 ? "red" : "default"}>
            {text}
          </Tag>
        ),
      },
      {
        title: i18next.t("general:Updated time"),
        dataIndex: "lastTime",
        key: "lastTime",
        width: "140px",
        render: (text) => (
          <Text style={{fontSize: "11px", color: "#666"}}>
            {text}
          </Text>
        ),
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        width: "80px",
        render: (text, record) => (
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => this.copyEventDetails(record)}
            title={i18next.t("general:Copy")}
          />
        ),
      },
    ];
  };

  render() {
    const {events} = this.props;

    if (!events || events.length === 0) {
      return null;
    }

    return (
      <Card
        size="small"
        title={
          <span>
            {i18next.t("general:Records")}
            <Text type="secondary" style={{marginLeft: 8, fontSize: "12px"}}>
              ({events.length})
            </Text>
          </span>
        }
        style={{marginBottom: 16}}
      >
        <Table
          dataSource={events}
          columns={this.getColumns()}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => i18next.t("general:{total} in total").replace("{total}", total),
          }}
          size="small"
          rowKey="name"
          scroll={{x: 900}}
        />
      </Card>
    );
  }
}

export default EventTable;
