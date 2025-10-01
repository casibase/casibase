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
import {Button, Card, Table, Typography} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import * as Setting from "../Setting";

const {Text} = Typography;

class CredentialsTable extends React.Component {
  copyToClipboard = (text) => {
    copy(text);
    Setting.showMessage("success", i18next.t("general:Successfully copied"));
  };

  getColumns = () => {
    return [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "200px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => <Text>{text}</Text>,
      },
      {
        title: i18next.t("general:Data"),
        dataIndex: "value",
        key: "value",
        width: "300px",
        render: (text) => (
          <Text style={{wordBreak: "break-all"}}>{text}</Text>
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
            disabled={!record.value}
            onClick={() => this.copyToClipboard(record.value)}
          >
            {i18next.t("general:Copy")}
          </Button>
        ),
      },
    ];
  };

  render() {
    const {credentials} = this.props;

    if (!credentials || credentials.length === 0) {
      return null;
    }

    return (
      <Card size="small" title={i18next.t("general:Resources")} style={{marginBottom: 16}}>
        <Table
          dataSource={credentials}
          columns={this.getColumns()}
          pagination={false}
          size="small"
          rowKey="name"
        />
      </Card>
    );
  }
}

export default CredentialsTable;
