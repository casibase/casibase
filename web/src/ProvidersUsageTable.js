// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

import {Table, Tag} from "antd";
import i18next from "i18next";
import React from "react";

class ProvidersUsageTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const dataSource = this.props.usageMap && Object.keys(this.props.usageMap).length > 0
      ? Object.keys(this.props.usageMap).map(key => ({
        key,
        ...this.props.usageMap[key],
      }))
      : [];

    const providersUsageColumn = [
      {
        title: i18next.t("provider:Provider"),
        dataIndex: "key",
        key: "key",
        width: "50%",
      },
      {
        title: i18next.t("provider:Usage (tokens/min)"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "50%",
        render: (text, record) => (
          <Tag
            color={"geekblue"}
          >
            {text}
          </Tag>
        ),
        sorter: (a, b) => a.tokenCount - b.tokenCount,
      },
    ];

    return (
      <div style={{
        marginTop: "20px",
      }}>
        <Table rowKey="key" columns={providersUsageColumn} dataSource={dataSource} size="middle" bordered
          pagination={false} />
      </div>
    );
  }
}

export default ProvidersUsageTable;
