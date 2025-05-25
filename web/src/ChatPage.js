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
import {Button, Drawer, Modal, Spin} from "antd";
import {BarsOutlined, CloseCircleFilled} from "@ant-design/icons";
import moment from "moment";
import * as StoreBackend from "./backend/StoreBackend";
import ChatMenu from "./ChatMenu";
import ChatBox from "./ChatBox";
import StoreInfoTitle from "./StoreInfoTitle";
import {renderReason, renderText} from "./ChatMessageRender";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";
import * as Conf from "./Conf";
import {MessageCarrier} from "./chat/MessageCarrier";

class ChatPage extends BaseListPage {
  constructor(props) {
    super(props);

    this.menu = React.createRef();
    this.chatBox = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.setState({
      loading: true,
      disableInput: false,
      isModalOpen: false,
      messageLoading: false,
      messageError: false,
      autoRead: false,
      chatMenuVisible: false,
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

  toggleChatMenu = () => {
    this.setState({
      chatMenuVisible: !this.state.chatMenuVisible,
    });
  };

  closeChatMenu = () => {
    this.setState({
      chatMenuVisible: false,
    });
  };

  getGlobalStores() {
    StoreBackend.getGlobalStores("", "", "", "", "", "").then((res) => {
      if (res.status === "ok") {
        this.setState({
          stores: res?.data,
        });
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
      }
    });
  }

  getChat() {
    if (this.props.match) {
      return this.props.match.params.chatName;
    } else {
      return undefined;
    }
  }

  goToLinkSoft(path) {
    if (this.props.history) {
      this.props.history.push(path);
    } else {
      return "";
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

  newChat(chat, selectStore = {}) {
    const randomName = Setting.getRandomName();
    let store = selectStore.name;
    if (!store) {
      store = "";
    }
    return {
      owner: "admin",
      name: `chat_${randomName}`,
      store: store,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account.owner,
      displayName: `${i18next.t("chat:New Chat")} - ${this.getNextChatIndex(chat?.displayName) ?? randomName}`,
      type: "AI",
      user: this.props.account.name,
      category: chat !== undefined ? chat.category : i18next.t("chat:Default Category"),
      user1: "",
      user2: "",
      users: [],
      clientIp: this.props.account.createdIp,
      userAgent: this.props.account.education,
      messageCount: 0,
      needTitle: true,
    };
  }

  newMessage(text, fileName, isHidden, isRegenerated) {
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
      isDeleted: false,
      isAlerted: false,
      isRegenerated: isRegenerated,
      fileName: fileName,
    };
  }

  cancelMessage = () => {
    if (this.state.messages && this.state.messages.length > 0) {
      const lastMessage = this.state.messages[this.state.messages.length - 1];
      if (lastMessage.author === "AI" && this.state.messageLoading) {
        MessageBackend.closeMessageEventSource(lastMessage.owner, lastMessage.name);

        MessageBackend.updateMessage(lastMessage.owner, lastMessage.name, lastMessage)
          .then((res) => {
            if (res.status === "ok") {
              this.setState({
                messageLoading: false,
              });
            } else {
              Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
            }
          })
          .catch(error => {
            Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
          });
      }
    }
  };

  sendMessage(text, fileName, isHidden, isRegenerated) {
    const newMessage = this.newMessage(text, fileName, isHidden, isRegenerated);
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          const chat = res.data;
          this.setState({
            chat: chat,
          });

          const field = "user";
          const value = this.props.account.name;
          const sortField = "", sortOrder = "";
          ChatBackend.getChats(value, -1, -1, field, value, sortField, sortOrder)
            .then((res) => {
              if (res.status === "ok") {
                this.setState({
                  data: res.data,
                });

                const chats = res.data;
                if (this.menu && this.menu.current) {
                  this.menu.current.setSelectedKeyToNewChat(chats);
                }
              }
            });

          this.getMessages(chat);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getMessageAnswerFromURL(messages) {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("newMessage")) {
      return false;
    }
    const newMessage = params.get("newMessage");
    const hasAsked = messages.some(message => message.text === newMessage);
    if (newMessage !== null && !hasAsked && (!this.props.account.isAdmin || Setting.isAnonymousUser(this.props.account))) {
      if (messages.length > 0 && messages[0].replyTo === "Welcome") {
        MessageBackend.deleteWelcomeMessage(messages[0])
          .then((res) => {
            if (res.status !== "ok") {
              Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
            }
          })
          .catch(error => {
            Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
          });
      }
      this.sendMessage(newMessage);
      return true;
    }
    return false;
  }

  getMessages(chat) {
    MessageBackend.getChatMessages("admin", chat.name)
      .then((res) => {
        if (this.getMessageAnswerFromURL(res.data)) {
          return;
        }
        res.data.map((message) => {
          message.html = renderText(message.text);
        });
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
            let reasonText = "";
            this.setState({
              messageLoading: true,
            });

            if (lastMessage.errorText !== "") {
              this.setState({
                messageLoading: false,
                messageError: true,
              });
              return;
            }
            const mssageCarrier = new MessageCarrier(chat.needTitle);
            MessageBackend.getMessageAnswer(lastMessage.owner, lastMessage.name, (data) => {
              const jsonData = JSON.parse(data);

              if (jsonData.text === "") {
                jsonData.text = "\n";
              }
              const lastMessage2 = Setting.deepCopy(lastMessage);
              text += jsonData.text;
              const parsedResult = mssageCarrier.parseAnswerWithCarriers(text);
              this.updateChatDisplayName(parsedResult.title, chat);
              if (!chat || (this.state.chat.name !== chat.name)) {
                return;
              }
              lastMessage2.text = parsedResult.finalAnswer;

              // Preserve reasoning if it exists
              if (res.data[res.data.length - 1].reasonText) {
                lastMessage2.reasonText = res.data[res.data.length - 1].reasonText;
                lastMessage2.reasonHtml = res.data[res.data.length - 1].reasonHtml;
              }

              res.data[res.data.length - 1] = lastMessage2;
              res.data.map((message, index) => {
                if (index === res.data.length - 1 && message.author === "AI") {
                  message.html = renderText(message.text);
                } else {
                  message.html = renderText(message.text);
                }
              });
              this.setState({
                messages: res.data,
                messageError: false,
              });
            }, (data) => {
              if (!chat || (this.state.chat.name !== chat.name)) {
                return;
              }
              const jsonData = JSON.parse(data);

              if (jsonData.text === "") {
                jsonData.text = "\n";
              }

              reasonText += jsonData.text;

              const lastMessage2 = Setting.deepCopy(lastMessage);
              lastMessage2.reasonText = reasonText;
              lastMessage2.isReasoningPhase = true;

              lastMessage2.text = "";
              res.data[res.data.length - 1] = lastMessage2;

              this.setState({
                messages: res.data,
              });
            }, (error) => {
              Setting.showMessage("error", Setting.getRefinedErrorText(error));

              const lastMessage2 = Setting.deepCopy(lastMessage);
              lastMessage2.errorText = error;
              res.data[res.data.length - 1] = lastMessage2;

              res.data.map((message) => {
                message.html = renderText(message.text);
              });
              this.setState({
                messages: res.data,
                messageLoading: false,
                messageError: true,
              });
            }, (data) => {
              if (!chat || (this.state.chat.name !== chat.name)) {
                return;
              }
              const lastMessage2 = Setting.deepCopy(lastMessage);
              lastMessage2.text = text;

              // Preserve reasoning when finalizing the message
              if (res.data[res.data.length - 1].reasonText) {
                lastMessage2.reasonText = res.data[res.data.length - 1].reasonText;
                lastMessage2.reasonHtml = res.data[res.data.length - 1].reasonHtml;
              }

              // We're no longer in reasoning phase
              lastMessage2.isReasoningPhase = false;
              // If there are suggestions or title , split them from the text
              const parsedResult = mssageCarrier.parseAnswerWithCarriers(text);
              text = parsedResult.finalAnswer;
              if (parsedResult.title !== "") {
                chat.displayName = parsedResult.title;
                chat.needTitle = false;
              }
              lastMessage2.text = parsedResult.finalAnswer;
              lastMessage2.suggestions = parsedResult.suggestionArray;

              res.data[res.data.length - 1] = lastMessage2;
              res.data.map((message, index) => {
                // Ensure the main HTML is rendered properly
                message.html = renderText(message.text);

                // Make sure the reason HTML is still there if we have reason text
                if (message.reasonText) {
                  message.reasonHtml = renderReason(message.reasonText);
                }
              });

              this.setState({
                messages: res.data,
                messageLoading: false,
                messageError: false,
              });

              if (this.state.autoRead) {
                if (this.chatBox?.current?.toggleMessageReadState) {
                  this.chatBox.current.toggleMessageReadState(lastMessage2);
                }
              }
            });
          } else {
            this.setState({
              messageLoading: false,
            });
          }
        }

        Setting.scrollToDiv(`chatbox-list-item-${res.data.length}`);
      });
  }

  updateChatDisplayName(title, chat) {
    if (title !== "") {
      const updatedChats = [...this.state.data];
      const index = updatedChats.findIndex(c => c.name === chat.name);
      if (index !== -1) {
        updatedChats[index].displayName = title;
        this.setState({data: updatedChats});
      }
    }
  }

  addChat(chat, selectStore) {
    const newChat = this.newChat(chat, selectStore);
    this.goToLinkSoft(`/chat/${newChat.name}`);
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
            this.goToLinkSoft("/chat");
          } else {
            const focusedChat = data[j];
            this.setState({
              chat: focusedChat,
              // messages: null,
              data: data,
            });
            this.getMessages(focusedChat);
            this.goToLinkSoft(`/chat/${focusedChat.name}`);
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
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  handleMessageEdit = (chatName) => {
    const chat = this.state.data.find(c => c.name === chatName);
    if (chat) {
      // get new messages
      this.getMessages(chat);
    }
  };

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

  renderUnsafePasswordModal() {
    if (this.props.account.password !== "#NeedToModify#") {
      return null;
    }

    return (
      <Modal
        title={
          <div>
            <CloseCircleFilled style={{color: "rgb(255,77,79)"}} />
            &nbsp;
            {" " + i18next.t("account:Please Modify Your Password")}
          </div>
        }
        closable={false}
        open={true}
        okButtonProps={{style: {display: "none"}}}
        cancelButtonProps={{style: {display: "none"}}}
        onOk={null}
        onCancel={null}
      >
        <div>
          <p>{i18next.t("account:The system has detected that you are using the default password, which is not secure. You need to modify your password immediately. Here are the instructions")}:</p>
          <p>{i18next.t("account:1. Go to your setting page by clicking on the below \"My Account\" button.")}</p>
          <p>{i18next.t("account:2. Click \"Modify password...\" button to change your password. Then close the setting page.")}</p>
          <p>{i18next.t("account:3. Go back to this page and refresh it by pressing F5 key. This alert message should be gone.")}</p>
          <p>{i18next.t("account:4. If you encounter any issues, please contact your administrator.")}</p>
          <div style={{display: "flex", justifyContent: "center", marginTop: "30px"}}>
            <Button type="primary" onClick={() => Setting.openLink(Setting.getMyProfileUrl(this.props.account))}>{i18next.t("account:My Account")}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  renderTable(chats) {
    const onSelectChat = (i) => {
      const chat = chats[i];
      this.setState({
        chat: chat,
        // messages: null,
        chatMenuVisible: false,
      });
      this.getMessages(chat);
      this.goToLinkSoft(`/chat/${chat.name}`);
    };

    const onAddChat = (selectStore = {}) => {
      const chat = this.getCurrentChat();
      this.addChat(chat, selectStore);
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
      <div style={{display: "flex", backgroundColor: "white", height: (Setting.getUrlParam("isRaw") !== null) ? "calc(100vh)" : (window.location.pathname.startsWith("/chat")) ? "calc(100vh - 135px)" : Setting.isMobile() ? "calc(100vh - 136px)" : "calc(100vh - 186px)"}}>
        {
          this.renderModal()
        }
        {
          this.renderUnsafePasswordModal()
        }
        {
          !(Setting.isMobile() || Setting.getUrlParam("isRaw") !== null) && (
            <div style={{width: "250px", height: "100%", backgroundColor: "white", marginRight: "2px"}}>
              <ChatMenu ref={this.menu} chats={chats} chatName={this.getChat()} onSelectChat={onSelectChat} onAddChat={onAddChat} onDeleteChat={onDeleteChat} onUpdateChatName={onUpdateChatName} stores={this.state.stores} />
            </div>
          )
        }

        {Setting.isMobile() && (
          <Drawer title={i18next.t("chat:Chats")} placement="left" open={this.state.chatMenuVisible} onClose={this.closeChatMenu} width={250}
          >
            <ChatMenu ref={this.menu} chats={chats} chatName={this.getChat()} onSelectChat={onSelectChat} onAddChat={onAddChat} onDeleteChat={onDeleteChat} onUpdateChatName={onUpdateChatName} stores={this.state.stores} />
          </Drawer>
        )}

        <div style={{flex: 1, height: "100%", backgroundColor: "white", position: "relative", display: "flex", flexDirection: "column"}}>
          {this.state.chat && (
            <div style={{display: "flex", alignItems: "center"}}>
              {Setting.isMobile() && (
                <Button type="text" icon={<BarsOutlined />} onClick={this.toggleChatMenu} style={{marginRight: "8px"}} />
              )}
              <div style={{flex: 1}}>
                <StoreInfoTitle chat={this.state.chat} stores={this.state.stores} autoRead={this.state.autoRead} onUpdateAutoRead={(checked) => this.setState({autoRead: checked})} />
              </div>
            </div>
          )}

          <div style={{flex: 1, position: "relative", overflow: "auto"}}>
            {
              (this.state.messages === undefined || this.state.messages === null) ? null : (
                <div style={{
                  position: "absolute",
                  top: -50,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${Setting.StaticBaseUrl}/img/casibase-logo_1200x256.png)`,
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
            <ChatBox
              ref={this.chatBox}
              disableInput={this.state.disableInput}
              loading={this.state.messageLoading}
              messages={this.state.messages}
              messageError={this.state.messageError}
              sendMessage={(text, fileName, regenerate = false) => {
                this.sendMessage(text, fileName, false, regenerate);
              }}
              onMessageEdit={this.handleMessageEdit}
              onCancelMessage={this.cancelMessage}
              account={this.props.account}
              name={this.state.chat?.name}
              displayName={this.state.chat?.displayName}
              store={this.state.chat ? this.state.stores?.find(store => store.name === this.state.chat.store) : this.state.stores?.find(store => store.isDefault === true)}
            />
          </div>
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
          }
          this.getGlobalStores();

          if (!setLoading) {
            if (this.menu && this.menu.current) {
              this.menu.current.setSelectedKeyToNewChat(chats);
            }
          }
        }
      });
  };
}

export default ChatPage;
