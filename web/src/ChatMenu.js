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

import Search from "antd/es/input/Search";
import moment from "moment/moment";
import React from "react";
import {Button, Input, Menu, Popconfirm} from "antd";
import {DeleteOutlined, EditOutlined, LayoutOutlined, PlusOutlined, SaveOutlined} from "@ant-design/icons";
import i18next from "i18next";
import * as UsageBackend from "./backend/UsageBackend";
import {ThemeDefault} from "./Conf";
import * as Setting from "./Setting";

class ChatMenu extends React.Component {
  constructor(props) {
    super(props);

    const items = this.chatsToItems(this.props.chats);
    const selectedKey = this.getSelectedKeyOfCurrentChat(this.props.chats, this.props.chatName);
    const openKeys = items.map((item) => item.key);
    this.userList = [];

    this.state = {
      openKeys: openKeys,
      selectedKeys: [selectedKey],
      editChat: false,
      editChatName: "",
      users: [],
      inSearch: false,
    };
  }

  componentDidMount() {
    this.getUserList();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const selectedKey = this.getSelectedKeyOfCurrentChat(this.props.chats, this.props.chatName);
    if (this.state.selectedKeys[0] !== selectedKey) {
      this.setState({
        selectedKeys: [selectedKey],
      });
    }
  }

  chatsToItems(chats) {
    const categories = {};
    chats.forEach((chat) => {
      if (!categories[chat.category]) {
        categories[chat.category] = [];
      }
      categories[chat.category].push(chat);
    });

    const selectedKeys = this.state === undefined ? [] : this.state.selectedKeys;
    return Object.keys(categories).map((category, index) => {
      return {
        key: `${index}`,
        icon: <LayoutOutlined />,
        label: category,
        children: categories[category].map((chat, chatIndex) => {
          const globalChatIndex = chats.indexOf(chat);
          const isSelected = selectedKeys.includes(`${index}-${chatIndex}`);
          const handleIconMouseEnter = (e) => {
            e.currentTarget.style.color = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.6;
          };

          const handleIconMouseLeave = (e) => {
            e.currentTarget.style.color = "inherit";
            e.currentTarget.style.opacity = 1;
          };

          const handleIconMouseDown = (e) => {
            e.currentTarget.style.color = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.4;
          };

          const handleIconMouseUp = (e) => {
            e.currentTarget.style.color = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.6;
          };

          const onSave = (e) => {
            e.stopPropagation();
            this.props.onUpdateChatName(globalChatIndex, this.state.editChatName);
            this.setState({editChat: false});
          };

          const isAIChat = chat.type === "AI";

          let title;
          if (chat && chat.type === "Signal") {
            title = this.props.account.name === chat.user ? chat.user1 : chat.user;
          } else {
            title = chat.displayName;
          }

          return {
            key: `${index}-${chatIndex}`,
            index: globalChatIndex,
            label: (
              isSelected && this.state.editChat ? (
                <div className="menu-item-container">
                  <Input style={{width: "70%"}} value={this.state.editChatName}
                    onChange={(event) => {this.setState({editChatName: event.target.value});}}
                    onBlur={onSave}
                    onPressEnter={onSave} />
                  <SaveOutlined className="menu-item-icon"
                    onMouseEnter={handleIconMouseEnter}
                    onMouseLeave={handleIconMouseLeave}
                    onMouseDown={handleIconMouseDown}
                    onMouseUp={handleIconMouseUp}
                    onClick={onSave}
                  />
                </div>) : (
                <div className="menu-item-container">
                  <div>{title}</div>
                  {isSelected && isAIChat && (
                    <div>
                      <EditOutlined className="menu-item-icon"
                        onMouseEnter={handleIconMouseEnter}
                        onMouseLeave={handleIconMouseLeave}
                        onMouseDown={handleIconMouseDown}
                        onMouseUp={handleIconMouseUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          this.setState({
                            editChatName: this.props.chats[globalChatIndex].displayName,
                            editChat: true,
                          });
                        }} />
                      <Popconfirm
                        title={`${i18next.t("general:Sure to delete")}: ${chat.displayName} ?`}
                        onConfirm={() => {
                          if (this.props.onDeleteChat) {
                            this.props.onDeleteChat(globalChatIndex);
                          }
                        }}
                        okText={i18next.t("general:OK")}
                        cancelText={i18next.t("general:Cancel")}
                      >
                        <DeleteOutlined className="menu-item-icon"
                          onMouseEnter={handleIconMouseEnter}
                          onMouseLeave={handleIconMouseLeave}
                          onMouseDown={handleIconMouseDown}
                          onMouseUp={handleIconMouseUp}
                        />
                      </Popconfirm>
                    </div>
                  )}
                </div>)
            ),
          };
        }),
      };
    });
  }

  onSelect = (info) => {
    const [categoryIndex, chatIndex] = info.selectedKeys[0].split("-").map(Number);
    const selectedItem = this.chatsToItems(this.props.chats)[categoryIndex].children[chatIndex];
    this.setState({
      selectedKeys: [`${categoryIndex}-${chatIndex}`],
      editChat: false,
      editChatName: this.props.chats[chatIndex].displayName,
    });

    if (this.props.onSelectChat) {
      this.props.onSelectChat(selectedItem.index);
    }
  };

  getRootSubmenuKeys(items) {
    return items.map((item, index) => `${index}`);
  }

  setSelectedKeyToNewChat(chats) {
    const items = this.chatsToItems(chats);
    const openKeys = items.map((item) => item.key);

    this.setState({
      openKeys: openKeys,
      selectedKeys: ["0-0"],
    });
  }

  getSelectedKeyOfCurrentChat(chats, chatName) {
    const items = this.chatsToItems(chats);
    const chat = chats.find(chat => chat.name === chatName);
    let selectedKey = null;

    for (let categoryIndex = 0; categoryIndex < items.length; categoryIndex++) {
      const category = items[categoryIndex];
      for (let chatIndex = 0; chatIndex < category.children.length; chatIndex++) {
        if (category.children[chatIndex].index === chats.indexOf(chat)) {
          selectedKey = `${categoryIndex}-${chatIndex}`;
          break;
        }
      }
      if (selectedKey) {
        break;
      }
    }
    return selectedKey === null ? "0-0" : selectedKey;
  }

  onOpenChange = (keys) => {
    const items = this.chatsToItems(this.props.chats);
    const rootSubmenuKeys = this.getRootSubmenuKeys(items);
    const latestOpenKey = keys.find((key) => this.state.openKeys.indexOf(key) === -1);

    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      this.setState({openKeys: keys});
    } else {
      this.setState({openKeys: latestOpenKey ? [latestOpenKey] : []});
    }
  };

  // type is Signal or Group
  newUserChat(user, type = "Signal") {
    const randomName = Setting.getRandomName();
    const displayName = `${this.props.account.name} - ${user}`;
    return {
      owner: "admin",
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      organization: this.props.account.owner,
      displayName: displayName,
      category: i18next.t("chat:Default Category"),
      type: type,
      user: this.props.account.name,
      user1: user,
      user2: "",
      users: [],
      messageCount: 0,
    };
  }

  getUserList() {
    UsageBackend.getUsers("", "").then((data) => {
      if (data.status === "ok") {
        this.setState({
          users: data.data,
        });
        this.userList = data.data;
      } else {
        Setting.showMessage("error", data.msg);
      }
    });
  }

  updateUserList(value) {
    if (value === "") {
      this.setState({
        inSearch: false,
      });
      return;
    }
    this.setState({
      inSearch: true,
      users: this.userList.filter(user => user.includes(value)),
    });
  }

  renderUserList() {
    return (
      <Menu onClick={(item, key, keyPath, domEvent) => {
        const newChat = this.newUserChat(item.key);
        this.props.onAddChat(newChat);
        this.setState({
          inSearch: false,
        });
      }}>
        {this.state.users.map((user, index) => {
          if (user === this.props.account.name) {
            return null;
          }
          return (
            <Menu.Item key={user}>
              {user}
            </Menu.Item>
          );
        })}
      </Menu>
    );
  }

  renderChatList() {
    const items = this.chatsToItems(this.props.chats);
    const hasEmptyChat = this.props.chats.some(chat => chat.messageCount === 0);

    return (
      <div>
        <Button
          icon={<PlusOutlined />}
          style={{
            width: "calc(100% - 8px)",
            height: "40px",
            margin: "4px",
            borderColor: "rgb(229,229,229)",
          }}
          disabled={hasEmptyChat}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.6;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.borderColor = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.4;
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.borderColor = ThemeDefault.colorPrimary;
            e.currentTarget.style.opacity = 0.6;
          }}
          onClick={() => {
            this.props.onAddChat();
          }}
        >
          {i18next.t("chat:New Chat")}
        </Button>
        <div style={{marginRight: "4px"}}>
          <Menu
            style={{maxHeight: "calc(100vh - 140px - 40px - 8px)", overflowY: "auto"}}
            mode="inline"
            openKeys={this.state.openKeys}
            selectedKeys={this.state.selectedKeys}
            onOpenChange={this.onOpenChange}
            onSelect={this.onSelect}
            items={items}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <Search placeholder={i18next.t("chat:Search User")} style={{width: "calc(100% - 8px)", margin: "4px"}} onSearch={(e) => {
          this.updateUserList(e);
        }} />
        {!this.state.inSearch && this.renderChatList()}
        {this.state.inSearch && this.renderUserList()}
      </div>
    );
  }
}

export default ChatMenu;
