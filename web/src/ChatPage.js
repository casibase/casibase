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
import ChatMenu from "./ChatMenu";
import ChatBox from "./ChatBox";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import ChatGroupInfo from "./ChatGroupInfo";

class ChatPage extends BaseListPage {
  constructor(props) {
    super(props);

    this.menu = React.createRef();
  }

  state = {
    loading: true,
    chatName: "",
    displayName: "",
    chats: [],
    chatMembers: [],
    messages: [],
  };

  UNSAFE_componentWillMount() {
    this.fetch();
  }

  addChat(userName, chatType) {
    ChatBackend.userAddChat(chatType, userName)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
        this.getChats(this.props.account.name);
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getChats(userName) {
    ChatBackend.getChatsByUser(userName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({chats: res.data});
          this.state.displayName = res.data[0].displayName;
          this.state.chatName = res.data[0].chatName;
          this.getChatMembers(this.state.chatName);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getChatMembers(chatName) {
    ChatBackend.getChatMembers(chatName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({chatMembers: res.data});
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      }).catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  sendMessage(text) {
    MessageBackend.sendMessage(this.state.chatName, text)
      .then((res) => {
        // eslint-disable-next-line no-empty
        if (res.status === "ok") {
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  addChatMember(chatName, userName) {
    ChatBackend.addChatMember(chatName, userName)
      .then((res) => {
        if (res.status === "ok") {
          // eslint-disable-next-line no-console
          console.log(res.data);
          this.getChatMembers(this.state.chatName);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    const onAddChat = (userName, chatType) => {
      this.addChat(userName, chatType);
    };

    const onSelect = (index) => {
      // eslint-disable-next-line no-console
      const cn = this.state.chats[index].chatName;
      const dn = this.state.chats[index].displayName;
      this.setState({
        chatName: cn,
        displayName: dn,
      });
      this.getChatMembers(cn);
    };

    const onAddChatMember = (chatName, userName) => {
      this.addChatMember(chatName, userName);
    };

    const onSendMessage = (text) => {
      this.sendMessage(text);
    };

    return (
      <div style={{display: "flex", height: "calc(100vh - 136px)"}}>
        <div style={{width: "250px", height: "100%", backgroundColor: "white", borderRight: "1px solid rgb(245,245,245)", borderBottom: "1px solid rgb(245,245,245)"}}>
          <ChatMenu chats={this.state.chats} account={this.props.account} addChat={onAddChat} selectChat={onSelect} />
        </div>
        <ChatBox chats={this.state.chats} chatName={this.state.chatName} displayName={this.state.displayName} displ messages={this.state.messages} sendMessage={onSendMessage} account={this.props.account} />
        <ChatGroupInfo chatName={this.state.chatName} members={this.state.chatMembers} addChatMember={onAddChatMember} />
      </div>
    );
  }

  fetch = () => {
    this.getChats(this.props.account.name);
    MessageBackend.subscribeMessage(this.props.account.name, (e) => {
      const msg = JSON.parse(e);
      // eslint-disable-next-line no-console
      console.log(msg);
      if (msg.author === this.props.account.name) {
        msg.position = "tr";
        msg.direction = "outgoing";
      } else {
        msg.position = "tl";
        msg.direction = "incoming";
      }
      if (msg.chatName === this.state.chatName) {
        this.state.messages.push(msg);
        this.setState({});
      }
    });
  };
}

export default ChatPage;
