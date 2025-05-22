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

import React from "react";
import {Link} from "react-router-dom";
import {Button, Popconfirm, Switch, Table} from "antd";
import moment from "moment";
import BaseListPage from "./BaseListPage";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import i18next from "i18next";
import * as Conf from "./Conf";
import * as MessageBackend from "./backend/MessageBackend";
import ChatBox from "./ChatBox";
import {renderText} from "./ChatMessageRender";
import {DeleteOutlined} from "@ant-design/icons";

class ChatListPage extends BaseListPage {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      messagesMap: {},
      filterSingleChat: Setting.getBoolValue("filterSingleChat", false),
    };
  }

  getMessages(chatName) {
    MessageBackend.getChatMessages("admin", chatName)
      .then((res) => {
        const messagesMap = this.state.messagesMap;
        res.data.map((message) => {
          message.html = renderText(message.text);
        });
        messagesMap[chatName] = res.data;
        this.setState({
          messagesMap: messagesMap,
        });
      });
  }

  newChat() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account.owner,
      displayName: `${i18next.t("chat:New Chat")} - ${randomName}`,
      category: i18next.t("chat:Default Category"),
      type: "AI",
      user: this.props.account.name,
      user1: "",
      user2: "",
      users: [],
      clientIp: "",
      userAgent: "",
      messageCount: 0,
      tokenCount: 0,
      needTitle: true,
    };
  }

  addChat() {
    const newChat = this.newChat();
    ChatBackend.addChat(newChat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Chat added successfully");
          this.setState({
            data: Setting.prependRow(this.state.data, newChat),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total + 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to add Chat: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Chat failed to add: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return ChatBackend.deleteChat(this.state.data[i]);
  };

  deleteChat(record) {
    ChatBackend.deleteChat(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Chat deleted successfully");
          this.setState({
            data: this.state.data.filter((item) => item.name !== record.name),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `Failed to delete Chat: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Chat failed to delete: ${error}`);
      });
  }

  renderUserAgent(record) {
    if (record.userAgentDesc === "") {
      return record.userAgent;
    } else {
      return record.userAgentDesc?.split("|").map(text => {
        if (text.includes("Other") || text.includes("Generic Smartphone")) {
          return null;
        }

        return (
          <div key={text}>{text}</div>
        );
      });
    }
  }

  renderTable(chats) {
    let columns = [
      // {
      //   title: i18next.t("general:Owner"),
      //   dataIndex: "owner",
      //   key: "owner",
      //   width: "90px",
      //   sorter: (a, b) => a.owner.localeCompare(b.owner),
      // },
      {
        title: i18next.t("general:Name"),
        dataIndex: "name",
        key: "name",
        width: "100px",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text, record, index) => {
          return (
            <Link to={`chats/${text}`}>
              {text}
            </Link>
          );
        },
      },
      // {
      //   title: i18next.t("general:Created time"),
      //   dataIndex: "createdTime",
      //   key: "createdTime",
      //   width: "150px",
      //   sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
      //   render: (text, record, index) => {
      //     return Setting.getFormattedDate(text);
      //   },
      // },
      {
        title: i18next.t("general:Updated time"),
        dataIndex: "updatedTime",
        key: "updatedTime",
        width: "130px",
        sorter: (a, b) => a.updatedTime.localeCompare(b.updatedTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      // {
      //   title: i18next.t("general:Display name"),
      //   dataIndex: "displayName",
      //   key: "displayName",
      //   width: "100px",
      //   sorter: (a, b) => a.displayName.localeCompare(b.displayName),
      //   // ...this.getColumnSearchProps("displayName"),
      // },
      // {
      //   title: i18next.t("general:Type"),
      //   dataIndex: "type",
      //   key: "type",
      //   width: "110px",
      //   sorter: (a, b) => a.type.localeCompare(b.type),
      //   filterMultiple: false,
      //   filters: [
      //     {text: "Single", value: "Single"},
      //     {text: "Group", value: "Group"},
      //     {text: "AI", value: "AI"},
      //   ],
      //   render: (text, record, index) => {
      //     return i18next.t(`chat:${text}`);
      //   },
      // },
      // {
      //   title: i18next.t("provider:Category"),
      //   dataIndex: "category",
      //   key: "category",
      //   width: "100px",
      //   sorter: (a, b) => a.category.localeCompare(b.category),
      //   // ...this.getColumnSearchProps("category"),
      // },
      {
        title: i18next.t("general:User"),
        dataIndex: "user",
        key: "user",
        width: "90px",
        sorter: (a, b) => a.user.localeCompare(b.user),
        // ...this.getColumnSearchProps("user"),
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
      // {
      //   title: i18next.t("chat:User1"),
      //   dataIndex: "user1",
      //   key: "user1",
      //   width: "120px",
      //   sorter: (a, b) => a.user1.localeCompare(b.user1),
      //   // ...this.getColumnSearchProps("user1"),
      //   render: (text, record, index) => {
      //     if (text.includes("/u-")) {
      //       return text;
      //     }
      //
      //     return (
      //       <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${text}`)}>
      //         {text}
      //       </a>
      //     );
      //   },
      // },
      // {
      //   title: i18next.t("chat:User2"),
      //   dataIndex: "user2",
      //   key: "user2",
      //   width: "120px",
      //   sorter: (a, b) => a.user2.localeCompare(b.user2),
      //   // ...this.getColumnSearchProps("user2"),
      //   render: (text, record, index) => {
      //     return (
      //       <Link to={`/users/${text}`}>
      //         {text}
      //       </Link>
      //     );
      //   },
      // },
      // {
      //   title: i18next.t("general:Users"),
      //   dataIndex: "users",
      //   key: "users",
      //   width: "100px",
      //   sorter: (a, b) => a.users.localeCompare(b.users),
      //   // ...this.getColumnSearchProps("users"),
      //   render: (text, record, index) => {
      //     return Setting.getTags(text, "users");
      //   },
      // },
      {
        title: i18next.t("general:Client IP"),
        dataIndex: "clientIp",
        key: "clientIp",
        width: "120px",
        sorter: (a, b) => a.clientIp.localeCompare(b.clientIp),
        render: (text, record, index) => {
          if (text === "") {
            return null;
          }

          return (
            <a target="_blank" rel="noreferrer" href={`https://db-ip.com/${text}`}>
              {
                record.clientIpDesc === "" ? text : (
                  <div>
                    {text}
                    <br />
                    {record.clientIpDesc}
                    <br />
                    <br />
                    {
                      this.renderUserAgent(record)
                    }
                  </div>
                )
              }
            </a>
          );
        },
      },
      // {
      //   title: i18next.t("general:User agent"),
      //   dataIndex: "userAgent",
      //   key: "userAgent",
      //   width: "120px",
      //   sorter: (a, b) => a.userAgent.localeCompare(b.userAgent),
      //   render: (text, record, index) => {
      //     return this.renderUserAgent(record);
      //   },
      // },
      {
        title: i18next.t("chat:Count"),
        dataIndex: "messageCount",
        key: "messageCount",
        width: "80px",
        sorter: (a, b) => a.messageCount - b.messageCount,
        // ...this.getColumnSearchProps("messageCount"),
      },
      {
        title: i18next.t("chat:Token count"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "120px",
        sorter: (a, b) => a.tokenCount - b.tokenCount,
        // ...this.getColumnSearchProps("tokenCount"),
      },
      {
        title: i18next.t("chat:Price"),
        dataIndex: "price",
        key: "price",
        width: "120px",
        sorter: (a, b) => a.price - b.price,
        // ...this.getColumnSearchProps("price"),
        render: (text, record, index) => {
          return Setting.getDisplayPrice(text, record.currency);
        },
      },
      {
        title: i18next.t("general:Messages"),
        dataIndex: "messages",
        key: "messages",
        width: "800px",
        render: (text, record, index) => {
          const messages = this.state.messagesMap[record.name];
          if (messages === undefined || messages.length === 0) {
            return null;
          }

          return (
            <div style={{
              padding: "5px",
              margin: "5px",
              background: "rgb(191,191,191)",
              borderRadius: "10px",
              width: "800px",
              // boxSizing: "border-box",
              // boxShadow: "0 0 0 1px inset",
            }}>
              <div style={{
                maxHeight: "500px",
                overflowY: "auto",
                width: "100%",
              }}>
                <ChatBox disableInput={true} hideInput={true} messages={messages} sendMessage={null} account={this.props.account} previewMode={true} />
              </div>
            </div>

          );
        },
      },
      {
        title: i18next.t("general:Is deleted"),
        dataIndex: "isDeleted",
        key: "isDeleted",
        width: "120px",
        sorter: (a, b) => a.isDeleted - b.isDeleted,
        // ...this.getColumnSearchProps("isDeleted"),
        render: (text, record, index) => {
          return (
            <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" checked={text} />
          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "110px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/chats/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteChat(record)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button disabled={!Setting.isLocalAdminUser(this.props.account)} style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    if (this.state.filterSingleChat) {
      chats = chats?.filter(chat => chat.messageCount > 1);
    }

    if (!this.props.account || this.props.account.name !== "admin") {
      columns = columns.filter(column => column.key !== "name" && column.key !== "tokenCount" && column.key !== "price" && column.key !== "clientIp");

      const tokenCountIndex = columns.findIndex(column => column.key === "messageCount");
      if (tokenCountIndex !== -1) {
        const [tokenCountElement] = columns.splice(tokenCountIndex, 1);

        const actionIndex = columns.findIndex(column => column.key === "action");
        const insertIndex = actionIndex !== -1 ? actionIndex : columns.length;
        columns.splice(insertIndex, 0, tokenCountElement);
      }
    }

    const paginationProps = {
      total: this.state.pagination.total,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100", "1000", "10000", "100000"],
      showTotal: () => i18next.t("general:{total} in total").replace("{total}", this.state.pagination.total),
    };

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={chats} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("chat:Chats")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button disabled={!Setting.isLocalAdminUser(this.props.account)} type="primary" size="small" onClick={this.addChat.bind(this)}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Users")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(chats, "user"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Chats")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.sumFields(chats, "count"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Messages")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.sumFields(chats, "messageCount"))}
              {
                (!this.props.account || this.props.account.name !== "admin") ? null : (
                  <React.Fragment>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Tokens")}:
                    &nbsp;
                    {Setting.getDisplayTag(Setting.sumFields(chats, "tokenCount"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("chat:Price")}:
                    &nbsp;
                    {Setting.getDisplayPrice(Setting.sumFields(chats, "price"))}
                  </React.Fragment>
                )
              }
            </div>
          )}
          loading={this.state.loading}
          rowClassName={(record, index) => {
            return record.isDeleted ? "highlight-row" : "";
          }}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }

  fetch = (params = {}) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    this.setState({loading: true});
    ChatBackend.getGlobalChats(params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          let chats = res.data;
          if (this.props.account.name !== "admin") {
            chats = chats.filter(chat => chat.user !== "admin");
          }

          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });

          chats.forEach((chat) => {
            if (chat.messageCount > 1) {
              this.getMessages(chat.name);
            }
          });
        } else {
          if (Setting.isResponseDenied(res)) {
            this.setState({
              isAuthorized: false,
            });
          } else {
            Setting.showMessage("error", res.msg);
          }
        }
      });
  };
}

export default ChatListPage;
