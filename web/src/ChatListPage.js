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
import {Button, Popconfirm, Table} from "antd";
import moment from "moment";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import i18next from "i18next";
import * as Conf from "./Conf";
import * as MessageBackend from "./backend/MessageBackend";
import ChatBox from "./ChatBox";

class ChatListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      chats: null,
      messagesMap: {},
      filterSingleChat: Setting.getBoolValue("filterSingleChat", false),
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

          res.data.forEach((chat) => {
            if (chat.messageCount > 1) {
              this.getMessages(chat.name);
            }
          });
        } else {
          Setting.showMessage("error", `Failed to get chats: ${res.msg}`);
        }
      });
  }

  getMessages(chatName) {
    MessageBackend.getChatMessages("admin", chatName)
      .then((res) => {
        const messagesMap = this.state.messagesMap;
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
      users: [this.props.account.name],
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

  renderUserAgent(record) {
    if (record.userAgentDesc === "") {
      return record.userAgent;
    } else {
      return record.userAgentDesc.split("|").map(text => {
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
      //   title: i18next.t("chat:Type"),
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
      //   title: i18next.t("chat:Category"),
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
                <ChatBox disableInput={true} hideInput={true} messages={messages} sendMessage={null} account={this.props.account} />
              </div>
            </div>

          );
        },
      },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "110px",
        render: (text, record, index) => {
          return (
            <div>
              <Button style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}} type="primary" onClick={() => this.props.history.push(`/chats/${record.name}`)}>{i18next.t("general:Edit")}</Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteChat(index)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>{i18next.t("general:Delete")}</Button>
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
      columns = columns.filter(column => column.key !== "price");
    }

    const sumFields = (chats, field) => {
      if (!chats) {
        return 0;
      }

      if (field === "count") {
        return chats.reduce((sum, chat) => sum + 1, 0);
      } else {
        return chats.reduce((sum, chat) => sum + chat[field], 0);
      }
    };

    function uniqueFields(chats, field) {
      if (!chats) {
        return 0;
      }

      const res = new Set(chats.map(chat => chat[field]));
      return res.size;
    }

    return (
      <div>
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={chats} rowKey="name" size="middle" bordered pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("chat:Chats")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addChat.bind(this)}>{i18next.t("general:Add")}</Button>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {/* {i18next.t("chat:Filter single chat")}*/}
              {/* &nbsp;&nbsp;&nbsp;&nbsp;*/}
              {/* <Switch checked={this.state.filterSingleChat} onChange={(checked, e) => {*/}
              {/*  this.setState({*/}
              {/*    filterSingleChat: checked,*/}
              {/*  });*/}
              {/*  Setting.setBoolValue("filterSingleChat", checked);*/}
              {/*  this.UNSAFE_componentWillMount();*/}
              {/* }} />*/}
              {
                (!this.props.account || this.props.account.name !== "admin") ? null : (
                  <React.Fragment>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Users")}:
                    &nbsp;
                    {Setting.getDisplayTag(uniqueFields(chats, "user"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Chats")}:
                    &nbsp;
                    {Setting.getDisplayTag(sumFields(chats, "count"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Messages")}:
                    &nbsp;
                    {Setting.getDisplayTag(sumFields(chats, "messageCount"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Tokens")}:
                    &nbsp;
                    {Setting.getDisplayTag(sumFields(chats, "tokenCount"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("chat:Price")}:
                    &nbsp;
                    {Setting.getDisplayPrice(sumFields(chats, "price"))}
                  </React.Fragment>
                )
              }
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
        {
          this.renderTable(this.state.chats)
        }
      </div>
    );
  }
}

export default ChatListPage;
