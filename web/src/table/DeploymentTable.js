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
import {Card, Table, Tag, Typography} from "antd";
import i18next from "i18next";

const {Text} = Typography;

class DeploymentTable extends React.Component {
  getColumns = () => {
    return [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        render: (text) => <Text>{text}</Text>,
      },
      {
        title: i18next.t("application:Replicas"),
        dataIndex: "replicas",
        key: "replicas",
        width: "80px",
        render: (text, record) => <Text>{record.readyReplicas}/{text}</Text>,
      },
      {
        title: i18next.t("general:Status"),
        dataIndex: "status",
        key: "status",
        width: "120px",
        render: (text) => {
          let color = "default";
          if (text === "Running") {
            color = "green";
          } else if (text === "Partially Ready") {
            color = "orange";
          } else if (text === "Not Ready") {
            color = "red";
          }
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: i18next.t("general:Containers"),
        dataIndex: "containers",
        key: "containers",
        width: "280px",
        render: (containers) => (
          <div>
            {containers.map((container, index) => (
              <div key={index} style={{marginBottom: 4}}>
                <Text style={{fontSize: "12px"}}>{container.image}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "160px",
        render: (text) => <Text style={{fontSize: "12px"}}>{text}</Text>,
      },
    ];
  };

  render() {
    const {deployments} = this.props;

    if (!deployments || deployments.length === 0) {
      return null;
    }

    return (
      <Card size="small" title={i18next.t("application:Deploy")} style={{marginBottom: 16}}>
        <Table
          dataSource={deployments}
          columns={this.getColumns()}
          pagination={false}
          size="small"
          rowKey="name"
        />
      </Card>
    );
  }
}

export default DeploymentTable;
