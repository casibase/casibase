// Copyright 2024 The casbin Authors. All Rights Reserved.
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
import {Table} from "antd";

const UsageTable = ({data}) => {
  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: "12%",
    },
    {
      title: "Chats",
      dataIndex: "chats",
      key: "chats",
      width: "15%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.chats - b.chats,
    },
    {
      title: "Messages",
      dataIndex: "messageCount",
      key: "message",
      width: "15%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.messageCount - b.messageCount,
    },
    {
      title: "Tokens",
      dataIndex: "tokenCount",
      key: "token",
      width: "15%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.tokenCount - b.tokenCount,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: "15%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.price - b.price,
    },
  ];

  return (
    <div style={{margin: "20px", width: "78%", marginLeft: "11%"}}>
      <span style={{display: "block", fontSize: "20px", marginBottom: "10px"}}>
        UserTable
      </span>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{pageSize: 5}}
        showSorterTooltip={{target: "sorter-icon"}}
      />
    </div>
  );
};

export default UsageTable;
