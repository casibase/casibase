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
import {Button, Popconfirm, Switch, Table, Tag} from "antd";
import BaseListPage from "./BaseListPage";
import {ThemeDefault} from "./Conf";
import * as Setting from "./Setting";
import * as MessageBackend from "./backend/MessageBackend";
import moment from "moment";
import i18next from "i18next";
import * as Conf from "./Conf";
import {DeleteOutlined} from "@ant-design/icons";

class MessageListPage extends BaseListPage {
  constructor(props) {
    super(props);
  }

  newMessage() {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `message_${randomName}`,
      createdTime: moment().format(),
      organization: this.props.account.owner,
      user: this.props.account.name,
      chat: "",
      replyTo: "",
      author: this.props.account.name,
      text: "Hello",
      tokenCount: 0,
      textTokenCount: 0,
      price: 0.0,
    };
  }

  addMessage() {
    const newMessage = this.newMessage();
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            data: Setting.prependRow(this.state.data, newMessage),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total + 1,
            },
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteItem = async(i) => {
    return MessageBackend.deleteMessage(this.state.data[i]);
  };

  deleteMessage(record) {
    MessageBackend.deleteMessage(record)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            data: this.state.data.filter((item) => item.name !== record.name),
            pagination: {
              ...this.state.pagination,
              total: this.state.pagination.total - 1,
            },
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderDownloadXlsxButton() {
    return (
      <Button size="small" style={{marginRight: "10px"}} onClick={() => {
        const data = [];
        this.state.data.filter(item => item.author !== "AI").forEach((item, i) => {
          const row = {};
          row[i18next.t("message:Chat")] = item.chat;
          row[i18next.t("general:Message")] = item.name;
          row[i18next.t("general:Created time")] = Setting.getFormattedDate(item.createdTime);
          row[i18next.t("general:User")] = item.user;
          row[i18next.t("general:Text")] = item.text;
          row[i18next.t("message:Error text")] = item.errorText;
          data.push(row);
        });

        const sheet = Setting.json2sheet(data);
        sheet["!cols"] = [
          {wch: 15},
          {wch: 15},
          {wch: 30},
          {wch: 15},
          {wch: 50},
          {wch: 50},
        ];

        Setting.saveSheetToFile(sheet, i18next.t("general:Messages"), `${i18next.t("general:Messages")}-${Setting.getFormattedDate(moment().format())}.xlsx`);
      }}>{i18next.t("general:Download")}</Button>
    );
  }

  renderTable(messages) {
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
            <Link to={`/messages/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("general:Created time"),
        dataIndex: "createdTime",
        key: "createdTime",
        width: "110px",
        sorter: (a, b) => a.createdTime.localeCompare(b.createdTime),
        render: (text, record, index) => {
          return Setting.getFormattedDate(text);
        },
      },
      {
        title: i18next.t("general:User"),
        dataIndex: "user",
        key: "user",
        width: "90px",
        sorter: (a, b) => a.user.localeCompare(b.user),
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
        title: i18next.t("message:Chat"),
        dataIndex: "chat",
        key: "chat",
        width: "90px",
        sorter: (a, b) => a.chat.localeCompare(b.chat),
        render: (text, record, index) => {
          return (
            <Link to={`/chats/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("message:Reply to"),
        dataIndex: "replyTo",
        key: "replyTo",
        width: "90px",
        sorter: (a, b) => a.replyTo.localeCompare(b.replyTo),
        render: (text, record, index) => {
          return (
            <Link to={`/messages/${text}`}>
              {text}
            </Link>
          );
        },
      },
      {
        title: i18next.t("message:Author"),
        dataIndex: "author",
        key: "author",
        width: "90px",
        sorter: (a, b) => a.author.localeCompare(b.author),
        render: (text, record, index) => {
          if (text === "AI") {
            return text;
          }

          if (text.startsWith("u-")) {
            return text;
          }

          let userId = text;
          if (!userId.includes("/")) {
            userId = `${record.organization}/${userId}`;
          }

          return (
            <a target="_blank" rel="noreferrer" href={Setting.getMyProfileUrl(this.props.account).replace("/account", `/users/${userId}`)}>
              {text}
            </a>
          );
        },
      },
      {
        title: i18next.t("chat:Token count"),
        dataIndex: "tokenCount",
        key: "tokenCount",
        width: "90px",
        sorter: (a, b) => a.tokenCount - b.tokenCount,
        // ...this.getColumnSearchProps("tokenCount"),
      },
      {
        title: i18next.t("chat:Text token count"),
        dataIndex: "textTokenCount",
        key: "textTokenCount",
        width: "100px",
        sorter: (a, b) => a.textTokenCount - b.textTokenCount,
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
        title: i18next.t("general:Reasoning text"),
        dataIndex: "reasonText",
        key: "reasonText",
        width: "300px",
        sorter: (a, b) => a.reasonText.localeCompare(b.reasonText),
        render: (text, record, index) => {
          return (
            <div dangerouslySetInnerHTML={{__html: text}} />
          );
        },
      },
      {
        title: i18next.t("general:Text"),
        dataIndex: "text",
        key: "text",
        width: "300px",
        sorter: (a, b) => a.text.localeCompare(b.text),
        render: (text, record, index) => {
          return (
            <div dangerouslySetInnerHTML={{__html: text}} />
          );
        },
      },
      {
        title: i18next.t("message:Knowledge"),
        dataIndex: "knowledge",
        key: "knowledge",
        width: "100px",
        sorter: (a, b) => a.knowledge.localeCompare(b.knowledge),
        render: (text, record, index) => {
          return record.vectorScores?.map(vectorScore => {
            return (
              <a key={vectorScore.vector} target="_blank" rel="noreferrer" href={`/vectors/${vectorScore.vector}`}>
                <Tag style={{marginTop: "5px"}} color={"processing"}>
                  {vectorScore.score}
                </Tag>
              </a>
            );
          });
        },
      },
      {
        title: i18next.t("message:Suggestions"),
        dataIndex: "suggestions",
        key: "suggestions",
        width: "400px",
        render: (text, record, index) => {
          return (
            text?.map(suggestion => {
              return (
                <Tag key={suggestion.text} color={suggestion.isHit ? ThemeDefault.colorPrimary : ""}>{suggestion.text}</Tag>
              );
            })
          );
        },
      },
      {
        title: i18next.t("message:Error text"),
        dataIndex: "errorText",
        key: "errorText",
        width: "200px",
        sorter: (a, b) => a.errorText.localeCompare(b.errorText),
        render: (text, record, index) => {
          return (
            <div dangerouslySetInnerHTML={{__html: text}} />
          );
        },
      },
      {
        title: i18next.t("message:Comment"),
        dataIndex: "comment",
        key: "comment",
        width: "200px",
        sorter: (a, b) => a.comment.localeCompare(b.comment),
        render: (text, record, index) => {
          return (
            <div dangerouslySetInnerHTML={{__html: text}} />
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
        title: i18next.t("general:Is alerted"),
        dataIndex: "isAlerted",
        key: "isAlerted",
        width: "120px",
        sorter: (a, b) => a.isAlerted - b.isAlerted,
        // ...this.getColumnSearchProps("isAlerted"),
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
        width: "90px",
        fixed: "right",
        render: (text, record, index) => {
          return (
            <div>
              <Button
                style={{marginTop: "10px", marginBottom: "10px", marginRight: "10px"}}
                type="primary"
                onClick={() => this.props.history.push(`/messages/${record.name}`)}
              >
                {i18next.t("general:Edit")}
              </Button>
              <Popconfirm
                title={`${i18next.t("general:Sure to delete")}: ${record.name} ?`}
                onConfirm={() => this.deleteMessage(record)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button disabled={!Setting.isLocalAdminUser(this.props.account)} style={{marginBottom: "10px"}} type="primary" danger>
                  {i18next.t("general:Delete")}
                </Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    if (!this.props.account || this.props.account.name !== "admin") {
      columns = columns.filter(column => column.key !== "name" && column.key !== "tokenCount" && column.key !== "price");

      const tokenCountIndex = columns.findIndex(column => column.key === "tokenCount");
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
        <Table scroll={{x: "max-content"}} columns={columns} dataSource={messages} rowKey="name" rowSelection={this.getRowSelection()} size="middle" bordered pagination={paginationProps}
          title={() => (
            <div>
              {i18next.t("general:Messages")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button disabled={!Setting.isLocalAdminUser(this.props.account)} type="primary" size="small" onClick={this.addMessage.bind(this)}>{i18next.t("general:Add")}</Button>
              {this.state.selectedRowKeys.length > 0 && (
                <Popconfirm title={`${i18next.t("general:Sure to delete")}: ${this.state.selectedRowKeys.length} ${i18next.t("general:items")} ?`} onConfirm={() => this.performBulkDelete(this.state.selectedRows, this.state.selectedRowKeys)} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{marginLeft: 8}}>
                    {i18next.t("general:Delete")} ({this.state.selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              &nbsp;&nbsp;&nbsp;&nbsp;
              {
                this.renderDownloadXlsxButton()
              }
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Users")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(messages, "user"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Chats")}:
              &nbsp;
              {Setting.getDisplayTag(Setting.uniqueFields(messages, "chat"))}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {i18next.t("general:Messages")}:
              &nbsp;
              {Setting.getDisplayTag(this.state.pagination.total)}
              {
                (!this.props.account || this.props.account.name !== "admin") ? null : (
                  <React.Fragment>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("general:Tokens")}:
                    &nbsp;
                    {Setting.getDisplayTag(Setting.sumFields(messages, "tokenCount"))}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {i18next.t("chat:Price")}:
                    &nbsp;
                    {Setting.getDisplayPrice(Setting.sumFields(messages, "price"))}
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
    MessageBackend.getGlobalMessages(params.pagination.current, params.pagination.pageSize, field, value, sortField, sortOrder)
      .then((res) => {
        this.setState({
          loading: false,
        });
        if (res.status === "ok") {
          this.setState({
            data: res.data,
            pagination: {
              ...params.pagination,
              total: res.data2,
            },
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
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

export default MessageListPage;
