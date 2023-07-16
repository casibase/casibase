// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import {Link} from "react-router-dom";
import {Button, Col, Popconfirm, Row, Table} from "antd";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import moment from "moment";
import i18next from "i18next";

class ChatListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      chats: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getChats();
  }

  getChats() {
    ChatBackend.getChats(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chats: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get chats: ${res.msg}`);
        }
      });
  }

  newChat() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Chat - ${randomName}`,
      category: "Chat Category - 1",
      type: "Single",
      user1: `${this.props.account.owner}/${this.props.account.name}`,
      user2: "",
      users: [`${this.props.account.owner}/${this.props.account.name}`],
      messageCount: 0,
    };
  }

  addChat() {
    const newChat = this.newChat();
    ChatBackend.addChat(newChat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Chat added successfully");
          this.setState({
            chats: Setting.prependRow(this.state.chats, newChat),
          });
        } else {
          Setting.showMessage("error", `Failed to add Chat: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Chat failed to add: ${error}`);
      });
  }

  deleteChat(i) {
    ChatBackend.deleteChat(this.state.chats[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Chat deleted successfully");
          this.setState({
            chats: Setting.deleteRow(this.state.chats, i),
          });
        } else {
          Setting.showMessage("error", `Failed to delete Chat: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Chat failed to delete: ${error}`);
      });
  }

  renderTable(chats) {
    const columns = [
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "140px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`chats/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "150px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Updated time"),
        dataIndex: "updatedTime",
        key: "updatedTime",
        width: "15  0px",
        sorter: true,
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:Display name"),
        dataIndex: "displayName",
        key: "displayName",
        // width: '100px',
        sorter: true,
        // ...this.getColumnSearchProps("displayName"),
      },
      {
        title: i18next.t("chat:Type"),
        dataIndex: "type",
        key: "type",
        width: "110px",
        sorter: true,
        filterMultiple: false,
        filters: [
          {text: "Single", value: "Single"},
          {text: "Group", value: "Group"},
          {text: "AI", value: "AI"},
        ],
        render: (text, record, index) => {
          return i18next.t(`chat:${text}`);
        },
      },
      {
        title: i18next.t("chat:Category"),
        dataIndex: "category",
        key: "category",
        // width: '100px',
        sorter: true,
        // ...this.getColumnSearchProps("category"),
      },
      {
        title: i18next.t("chat:User1"),
        dataIndex: "user1",
        key: "user1",
        width: "120px",
        sorter: true,
        // ...this.getColumnSearchProps("user1"),
        render: (text, record, index) => {
          return (
            <Link to={`/users/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("chat:User2"),
        dataIndex: "user2",
        key: "user2",
        width: "120px",
        sorter: true,
        // ...this.getColumnSearchProps("user2"),
        render: (text, record, index) => {
          return (
            <Link to={`/users/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Users"),
        dataIndex: "users",
        key: "users",
        // width: '100px',
        sorter: true,
        // ...this.getColumnSearchProps("users"),
        render: (text, record, index) => {
          return Setting.getTags(text, "users");
        },
      },
      {
        title: i18next.t("chat:Message count"),
        dataIndex: "messageCount",
        key: "messageCount",
        // width: '100px',
        sorter: true,
        // ...this.getColumnSearchProps("messageCount"),
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "180px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/chats/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`Sure to delete chat: ${record.name} ?`}
                onConfirm={() => this.deleteChat(index)}
                okText="OK"
                cancelText="Cancel"
              >
                <Button style={{marginBottom: "10px"}} type="danger">{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table columns={columns} dataSource={chats} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("chat:Chats")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addChat.bind(this)}>{i18next.t("general:Add")}</Button>
            </div>
          )}
          loading={chats === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <Row style={{width: "100%"}}>
          <Col span={1}>
          </Col>
          <Col span={22}>
            {
              this.renderTable(this.state.chats)
            }
          </Col>
          <Col span={1}>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ChatListPage;
