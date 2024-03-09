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
import * as Setting from "./Setting";
import * as MessageBackend from "./backend/MessageBackend";
import moment from "moment";
import i18next from "i18next";
import * as Conf from "./Conf";

class MessageListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      messages: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getMessages();
  }

  getMessages() {
    MessageBackend.getMessages(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            messages: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get messages: ${res.msg}`);
        }
      });
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
      text: "",
    };
  }

  addMessage() {
    const newMessage = this.newMessage();
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Message added successfully");
          this.setState({
            messages: Setting.prependRow(this.state.messages, newMessage),
          });
        } else {
          Setting.showMessage("error", `Failed to add Message: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Message failed to add: ${error}`);
      });
  }

  deleteMessage(i) {
    MessageBackend.deleteMessage(this.state.messages[i])
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", "Message deleted successfully");
          this.setState({
            messages: Setting.deleteRow(this.state.messages, i),
          });
        } else {
          Setting.showMessage("error", `Failed to delete Message: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `Message failed to delete: ${error}`);
      });
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
        width: "120px",
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
        width: "100px",
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
        width: "100px",
        sorter: (a, b) => a.replyTo.localeCompare(b.replyTo),
        render: (text, record, index) => {
          const textTemp = text.split("/")[1];
          return (
            <Link to={`/messages/${textTemp}`}>
              {textTemp}
            </Link>
          );
        },
      },
      {
        title: i18next.t("message:Author"),
        dataIndex: "author",
        key: "author",
        width: "120px",
        sorter: (a, b) => a.author.localeCompare(b.author),
        render: (text, record, index) => {
          if (text === "AI") {
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
        title: i18next.t("message:Text"),
        dataIndex: "text",
        key: "text",
        width: "250px",
        sorter: (a, b) => a.text.localeCompare(b.text),
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
        width: "250px",
        sorter: (a, b) => a.comment.localeCompare(b.comment),
        render: (text, record, index) => {
          return (
            <div dangerouslySetInnerHTML={{__html: text}} />
          );
        },
      },
      // {
      //   title: i18next.t("message:Knowledge"),
      //   dataIndex: "knowledge",
      //   key: "knowledge",
      //   width: "100px",
      //   sorter: (a, b) => a.knowledge.localeCompare(b.knowledge),
      //   render: (text, record, index) => {
      //     return record.vectorScores?.map(vectorScore => {
      //       return (
      //         <Link key={vectorScore.vector} to={`/vectors/${vectorScore.vector}`}>
      //           <Tag style={{marginTop: "5px"}} color={"processing"}>
      //             {vectorScore.score}
      //           </Tag>
      //         </Link>
      //       );
      //     });
      //   },
      // },
      {
        title: i18next.t("general:Action"),
        dataIndex: "action",
        key: "action",
        width: "110px",
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
                onConfirm={() => this.deleteMessage(index)}
                okText={i18next.t("general:OK")}
                cancelText={i18next.t("general:Cancel")}
              >
                <Button style={{marginBottom: "10px"}} type="primary" danger>
                  {i18next.t("general:Delete")}
                </Button>
              </Popconfirm>
            </div>
          );
        },
      },
    ];

    if (!this.props.account || this.props.account.name !== "admin") {
      columns = columns.filter(column => column.key !== "price");
    }

    return (
      <div>
        <Table
          scroll={{x: "max-content"}}
          columns={columns}
          dataSource={messages}
          rowKey="name"
          size="middle"
          bordered
          pagination={{pageSize: 100}}
          title={() => (
            <div>
              {i18next.t("message:Messages")}&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" size="small" onClick={this.addMessage.bind(this)}>
                {i18next.t("general:Add")}
              </Button>
            </div>
          )}
          loading={messages === null}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {
          this.renderTable(this.state.messages)
        }
      </div>
    );
  }
}

export default MessageListPage;
