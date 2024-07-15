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
import ChatMenu from "./ChatMenu";
import ChatPage from "./ChatPage";
import LiveChatBox from "./LiveChatBox";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import i18next from "i18next";

class ListChatPage extends ChatPage {
  constructor(props) {
    super(props);
  }

  UNSAFE_componentWillMount() {
    this.setState({
      loading: true,
      disableInput: false,
      isModalOpen: false,
      dots: "",
    });

    this.fetch();
    this.timer = null;
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

  addChat(chat) {
    const newChat = this.newChat(chat);
    this.goToLinkSoft(`/livechat/${newChat.name}`);
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
            this.goToLinkSoft("/livechat");
          } else {
            const focusedChat = data[j];
            this.setState({
              chat: focusedChat,
              messages: null,
              data: data,
            });
            this.getMessages(focusedChat);
            this.goToLinkSoft(`/livechat/${focusedChat.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  renderTable(chats) {
    const onSelectChat = (i) => {
      const chat = chats[i];
      this.setState({
        chat: chat,
        messages: null,
      });
      this.getMessages(chat);
      this.goToLinkSoft(`/livechat/${chat.name}`);
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
      <div style={{display: "flex", backgroundColor: "white", height: (Setting.getUrlParam("isRaw") !== null) ? "calc(100vh)" : ((window.location.pathname.startsWith("/chat")) || (window.location.pathname.startsWith("/livechat"))) ? "calc(100vh - 135px)" : "calc(100vh - 186px)"}}>
        {
          this.renderModal()
        }
        {
          this.renderUnsafePasswordModal()
        }
        <div style={{width: (Setting.isMobile() || Setting.isAnonymousUser(this.props.account) || Setting.getUrlParam("isRaw") !== null) ? "0px" : "250px", height: "100%", backgroundColor: "white", marginRight: "2px"}}>
          <ChatMenu ref={this.menu} chats={chats} chatName={this.getChat()} onSelectChat={onSelectChat} onAddChat={onAddChat} onDeleteChat={onDeleteChat} onUpdateChatName={onUpdateChatName} />
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
          <LiveChatBox disableInput={this.state.disableInput} messages={this.state.messages} sendMessage={(text, fileName, regenerate = false) => {this.sendMessage(text, fileName, false, regenerate);}} account={this.props.account} dots={this.state.dots} />
        </div>
      </div>
    );
  }

  fetch = (params = {}, setLoading = true) => {
    const field = "user";
    const value = this.props.account.name;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    const chatName = this.getChat();

    if (setLoading) {
      this.setState({loading: true});
    }
    ChatBackend.getChats(value, -1, -1, field, value, sortField, sortOrder)
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
          if (chatName !== undefined && chats.length > 0) {
            const chat = chats.find(chat => chat.name === chatName);
            this.getMessages(chat);
            this.setState({
              chat: chat,
            });
          } else if (this.state.chat?.name === undefined && chats.length > 0) {
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

export default ListChatPage;
