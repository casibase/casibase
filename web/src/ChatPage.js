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
import {Modal, Spin} from "antd";
import moment from "moment";
import ChatMenu from "./ChatMenu";
import ChatBox from "./ChatBox";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import * as Conf from "./Conf";

class ChatPage extends BaseListPage {
  constructor(props) {
    super(props);

    this.menu = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.setState({
      loading: true,
      disableInput: false,
      isModalOpen: false,
    });

    this.fetch();
  }

  componentDidMount() {
    window.addEventListener("message", event => {
      if ((event.data.source !== undefined && event.data.source.includes("react-devtools")) || event.data.wappalyzer !== undefined) {
        return;
      }

      if (event.data === "close") {
        this.setState({
          isModalOpen: false,
        });
      }
    });

    if (this.props.onCreateChatPage) {
      this.props.onCreateChatPage(this);
    }
  }

  getNextChatIndex(name) {
    if (!name) {
      return 1;
    }
    const prefix = `${i18next.t("chat:New Chat")} - `;
    if (name.startsWith(prefix)) {
      const numberPart = name.slice(prefix.length);
      if (!isNaN(numberPart)) {
        return parseInt(numberPart) + 1;
      }
    }
    return 1;
  }

  newChat(chat) {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account.owner,
      displayName: `${i18next.t("chat:New Chat")} - ${this.getNextChatIndex(chat?.displayName) ?? randomName}`,
      type: "AI",
      user: this.props.account.name,
      category: chat !== undefined ? chat.category : i18next.t("chat:Default Category"),
      user1: "",
      user2: "",
      users: [this.props.account.name],
      clientIp: this.props.account.createdIp,
      userAgent: this.props.account.education,
      messageCount: 0,
    };
  }

  newMessage(text, fileName, isHidden) {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin",
      name: `message_${randomName}`,
      createdTime: moment().format(),
      organization: this.props.account.owner,
      user: this.props.account.name,
      chat: this.state.chat?.name,
      replyTo: "",
      author: this.props.account.name,
      text: text,
      isHidden: isHidden,
      fileName: fileName,
    };
  }

  sendMessage(text, fileName, isHidden) {
    const newMessage = this.newMessage(text, fileName, isHidden);
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          let chat;
          if (this.state.chat) {
            chat = this.state.chat;
          } else {
            chat = res.data;
            this.setState({
              chat: chat,
              messages: null,
            });

            const field = "user";
            const value = this.props.account.name;
            const sortField = "", sortOrder = "";
            ChatBackend.getChats("admin", -1, -1, field, value, sortField, sortOrder)
              .then((res) => {
                if (res.status === "ok") {
                  this.setState({
                    data: res.data,
                  });

                  const chats = res.data;
                  this.menu.current.setSelectedKeyToNewChat(chats);
                }
              });
          }

          this.getMessages(chat);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getMessages(chat) {
    MessageBackend.getChatMessages("admin", chat.name)
      .then((res) => {
        this.setState({
          messages: res.data,
        });

        if (Conf.IframeUrl !== "" && Setting.isAnonymousUser(this.props.account) && res.data.filter(message => message.author === "AI").length >= 3) {
          this.setState({
            isModalOpen: true,
          });
        }

        if (res.data.length > 0) {
          const lastMessage = res.data[res.data.length - 1];
          if (lastMessage.author === "AI" && lastMessage.replyTo !== "" && lastMessage.text === "") {
            let text = "";
            this.setState({
              disableInput: true,
            });
            MessageBackend.getMessageAnswer(lastMessage.owner, lastMessage.name, (data) => {
              const jsonData = JSON.parse(data);

              if (jsonData.text === "") {
                jsonData.text = "\n";
              }

              const lastMessage2 = Setting.deepCopy(lastMessage);
              text += jsonData.text;
              lastMessage2.text = text;
              res.data[res.data.length - 1] = lastMessage2;
              this.setState({
                messages: res.data,
                disableInput: false,
              });
            }, (error) => {
              Setting.showMessage("error", error);

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
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            chat: newChat,
            messages: null,
          });
          this.getMessages(newChat);

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
              chat: undefined,
              messages: [],
              data: data,
            });
          } else {
            const focusedChat = data[j];
            this.setState({
              chat: focusedChat,
              messages: null,
              data: data,
            });
            this.getMessages(focusedChat);
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
    ChatBackend.updateChat("admin", name, chat)
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
    return this.state.data.filter(chat => chat.name === this.state.chat?.name)[0];
  }

  renderModal() {
    if (Conf.IframeUrl === "" || this.state.messages === null) {
      return null;
    }

    const aiMessages = this.state.messages.filter(message => message.author === "AI");
    const lastMessage = aiMessages[aiMessages.length - 1];
    const json = (lastMessage === undefined) ? "" : Setting.parseJsonFromText(lastMessage.text);

    return (
      <Modal
        width={850}
        height={550}
        bodyStyle={{width: "800px", height: "500px"}}
        title={""}
        closable={false}
        open={this.state.isModalOpen}
        okButtonProps={{style: {display: "none"}}}
        cancelButtonProps={{style: {display: "none"}}}
        onOk={null}
        onCancel={() => {
          this.setState({
            isModalOpen: false,
          });
        }}
      >
        {/* eslint-disable-next-line react/no-unknown-property */}
        <iframe key={"provider"} title={"provider"} src={`${Conf.IframeUrl}&json=${encodeURIComponent(json)}`} width={"100%"} height={"100%"} frameBorder={0} seamless="seamless" scrolling="no" allowtransparency="true" />
      </Modal>
    );
  }

  renderTable(chats) {
    const onSelectChat = (i) => {
      const chat = chats[i];
      this.setState({
        chat: chat,
        messages: null,
      });
      this.getMessages(chat);
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
      <div style={{display: "flex", backgroundColor: "white", height: (Setting.getUrlParam("isRaw") !== null) ? "calc(100vh)" : (window.location.pathname === "/chat") ? "calc(100vh - 135px)" : "calc(100vh - 186px)"}}>
        {
          this.renderModal()
        }
        <div style={{width: (Setting.isMobile() || Setting.isAnonymousUser(this.props.account) || Setting.getUrlParam("isRaw") !== null) ? "0px" : "250px", height: "100%", backgroundColor: "white", marginRight: "2px"}}>
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
          <ChatBox disableInput={this.state.disableInput} messages={this.state.messages} sendMessage={(text, fileName) => {this.sendMessage(text, fileName, false);}} account={this.props.account} />
        </div>
      </div>
    );
  }

  fetch = (params = {}, setLoading = true) => {
    const field = "user";
    const value = this.props.account.name;
    const sortField = params.sortField, sortOrder = params.sortOrder;

    if (setLoading) {
      this.setState({loading: true});
    }
    ChatBackend.getChats("admin", -1, -1, field, value, sortField, sortOrder)
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
          if (this.state.chat?.name === undefined && chats.length > 0) {
            const chat = chats[0];
            this.getMessages(chat);
            this.setState({
              chat: chat,
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
