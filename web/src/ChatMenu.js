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
import {Button, Input, Menu} from "antd";
import {DeleteOutlined, EditOutlined, LayoutOutlined, PlusOutlined, SaveOutlined} from "@ant-design/icons";

class ChatMenu extends React.Component {
  constructor(props) {
    super(props);

    const items = this.chatsToItems(this.props.chats);
    const openKeys = items.map((item) => item.key);

    this.state = {
      openKeys: openKeys,
      selectedKeys: ["0-0"],
      editChat: false,
      editChatName: "",
    };
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
            e.currentTarget.style.color = "rgba(89,54,213,0.6)";
          };

          const handleIconMouseLeave = (e) => {
            e.currentTarget.style.color = "inherit";
          };

          const handleIconMouseDown = (e) => {
            e.currentTarget.style.color = "rgba(89,54,213,0.4)";
          };

          const handleIconMouseUp = (e) => {
            e.currentTarget.style.color = "rgba(89,54,213,0.6)";
          };

          const onSave = (e) => {
            e.stopPropagation();
            this.props.onUpdateChatName(globalChatIndex, this.state.editChatName);
            this.setState({editChat: false});
          };

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
                  <div>{chat.displayName}</div>
                  {isSelected && (
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
                      <DeleteOutlined className="menu-item-icon"
                        onMouseEnter={handleIconMouseEnter}
                        onMouseLeave={handleIconMouseLeave}
                        onMouseDown={handleIconMouseDown}
                        onMouseUp={handleIconMouseUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (this.props.onDeleteChat) {
                            this.props.onDeleteChat(globalChatIndex);
                          }
                        }} />
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

  render() {
    const items = this.chatsToItems(this.props.chats);

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
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.4)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.6)";
          }}
          onClick={this.props.onAddChat}
        >
          New Chat
        </Button>
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
    );
  }
}

export default ChatMenu;
