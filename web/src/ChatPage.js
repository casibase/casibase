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
import {Spin} from "antd";
import moment from "moment";
import ChatMenu from "./ChatMenu";
import ChatBox from "./ChatBox";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";

class ChatPage extends BaseListPage {
  constructor(props) {
    super(props);

    this.menu = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.setState({
      loading: true,
      disableInput: false,
    });

    this.fetch();
  }

  newChat(chat) {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      // organization: this.props.account.owner,
      displayName: `New Chat - ${randomName}`,
      type: "AI",
      category: chat !== undefined ? chat.category : "Chat Category - 1",
      user1: `${this.props.account.owner}/${this.props.account.name}`,
      user2: "",
      users: [`${this.props.account.owner}/${this.props.account.name}`],
      clientIp: this.props.account.createdIp,
      userAgent: this.props.account.education,
      messageCount: 0,
    };
  }

  newMessage(text) {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.name,
      name: `message_${randomName}`,
      createdTime: moment().format(),
      // organization: this.props.account.owner,
      chat: this.state.chatName,
      replyTo: "",
      author: `${this.props.account.owner}/${this.props.account.name}`,
      text: text,
    };
  }

  sendMessage(text) {
    const newMessage = this.newMessage(text);
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          this.getMessages(this.state.chatName);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getMessages(chatName) {
    MessageBackend.getChatMessages(chatName)
      .then((res) => {
        this.setState({
          messages: res.data,
        });

        if (res.data.length > 0) {
          const lastMessage = res.data[res.data.length - 1];
          if (lastMessage.author === "AI" && lastMessage.replyTo !== "" && lastMessage.text === "") {
            let text = "";
            this.setState({
              disableInput: true,
            });
            MessageBackend.getMessageAnswer(lastMessage.owner, lastMessage.name, (data) => {
              if (data === "") {
                data = "\n";
              }

              const lastMessage2 = Setting.deepCopy(lastMessage);
              text += data;
              lastMessage2.text = text;
              res.data[res.data.length - 1] = lastMessage2;
              this.setState({
                messages: res.data,
                disableInput: false,
              });
            }, (error) => {
              Setting.showMessage("error", `${i18next.t("general:Failed to get answer")}: ${error}`);

              const lastMessage2 = Setting.deepCopy(lastMessage);
              lastMessage2.text = error;
              res.data[res.data.length - 1] = lastMessage2;
              this.setState({
                messages: res.data,
                disableInput: true,
              });
            });
          }
        }

        Setting.scrollToDiv(`chatbox-list-item-${res.data.length}`);
      });
  }

  addChat(chat) {
    const newChat = this.newChat(chat);
    ChatBackend.addChat(newChat)
      .then((res) => {
        if (res.status === "ok") {
          // Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            chatName: newChat.name,
            messages: null,
          });
          this.getMessages(newChat.name);

          this.fetch({}, false);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
    return newChat;
  }

  deleteChat(chats, i, chat) {
    ChatBackend.deleteChat(chat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          const data = Setting.deleteRow(this.state.data, i);
          const j = Math.min(i, data.length - 1);
          if (j < 0) {
            this.setState({
              chatName: undefined,
              messages: [],
              data: data,
            });
          } else {
            const focusedChat = data[j];
            this.setState({
              chatName: focusedChat.name,
              messages: null,
              data: data,
            });
            this.getMessages(focusedChat.name);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  updateChatName(chats, i, chat, newName) {
    const name = chat.name;
    chat.displayName = newName;
    ChatBackend.updateChat(this.props.account.name, name, chat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully update"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to update")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getCurrentChat() {
    return this.state.data.filter(chat => chat.name === this.state.chatName)[0];
  }

  renderTable(chats) {
    const onSelectChat = (i) => {
      const chat = chats[i];
      this.setState({
        chatName: chat.name,
        messages: null,
      });
      this.getMessages(chat.name);
    };

    const onAddChat = () => {
      const chat = this.getCurrentChat();
      this.addChat(chat);
    };

    const onDeleteChat = (i) => {
      const chat = chats[i];
      this.deleteChat(chats, i, chat);
    };

    const onUpdateChatName = (i, newName) => {
      const chat = chats[i];
      this.updateChatName(chats, i, chat, newName);
    };

    if (this.state.loading) {
      return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
          <Spin size="large" tip={i18next.t("login:Loading")} style={{paddingTop: "10%"}} />
        </div>
      );
    }

    return (
      <div style={{display: "flex", height: "calc(100vh - 136px)"}}>
        <div style={{width: (Setting.isMobile() || Setting.isAnonymousUser(this.props.account)) ? "0px" : "250px", height: "100%", backgroundColor: "white", borderRight: "1px solid rgb(245,245,245)", borderBottom: "1px solid rgb(245,245,245)"}}>
          <ChatMenu ref={this.menu} chats={chats} onSelectChat={onSelectChat} onAddChat={onAddChat} onDeleteChat={onDeleteChat} onUpdateChatName={onUpdateChatName} />
        </div>
        <div style={{flex: 1, height: "100%", backgroundColor: "white", position: "relative"}}>
          {
            (this.state.messages === undefined || this.state.messages === null) ? null : (
              <div style={{
                position: "absolute",
                top: -50,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: "url(https://cdn.casbin.org/img/casdoor-logo_1185x256.png)",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "200px auto",
                backgroundBlendMode: "luminosity",
                filter: "grayscale(80%) brightness(140%) contrast(90%)",
                opacity: 0.5,
                pointerEvents: "none",
              }}>
              </div>
            )
          }
          <ChatBox disableInput={this.state.disableInput} messages={this.state.messages} sendMessage={(text) => {this.sendMessage(text);}} account={this.props.account} />
        </div>
      </div>
    );
  }

  fetch = (params = {}, setLoading = true) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.category !== undefined && params.category !== null) {
      field = "category";
      value = params.category;
    } else if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    if (setLoading) {
      this.setState({loading: true});
    }
    ChatBackend.getChats(this.props.account.name, -1, field, value, sortField, sortOrder)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            loading: false,
            data: res.data,
            messages: [],
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });

          const chats = res.data;
          if (this.state.chatName === undefined && chats.length > 0) {
            const chat = chats[0];
            this.getMessages(chat.name);
            this.setState({
              chatName: chat.name,
            });
          }

          if (!setLoading) {
            this.menu.current.setSelectedKeyToNewChat(chats);
          }
        }
      });
  };
}

export default ChatPage;
