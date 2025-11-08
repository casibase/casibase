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
import {Card, Table} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as Conf from "./Conf";

class GraphChatTable extends React.Component {
  render() {
    const {chats} = this.props;

    if (!chats || chats.length === 0) {
      return null;
    }

    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "150px",
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={`/chats/${text}`}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        width: "200px",
        render: (text, record, index) => {
          return (
            <a target="_blank" rel="noreferrer" href={`/chats/${record.name}`}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:User"),
        dataIndex: "user",
        key: "user",
        width: "120px",
        render: (text, record, index) => {
          if (text.startsWith("u-")) {
            return text;
          }

          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${Conf.AuthConfig.organizationName}/${text}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "180px",
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Updated time"),
        dataIndex: "updatedTime",
        key: "updatedTime",
        width: "180px",
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("store:Message count"),
        dataIndex: "messageCount",
        key: "messageCount",
        width: "100px",
      },
      {
        title: i18next.t("chat:Token count"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "120px",
      },
    ];

    return (
      <Card size="small" title={i18next.t("general:Chats")} style={{marginTop: "20px", marginLeft: "5px"}} type="inner">
        <Table
          columns={columns}
          dataSource={chats}
          rowKey="name"
          size="middle"
          pagination={{pageSize: 10}}
        />
      </Card>
    );
  }
}

export default GraphChatTable;
