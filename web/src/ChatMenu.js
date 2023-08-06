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
import {Button, Input, Modal} from "antd";
import {Avatar, Conversation, ConversationList} from "@chatscope/chat-ui-kit-react";

const ChatTypeSingle = 0;
const ChatTypeGroup = 1;

class ChatMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    addSingleChatModal: false,
    addGroupChatModal: false,
    inputValue: "",
  };

  showModalSingle = () => {
    this.setState({
      addSingleChatModal: true,
    });
  };

  handleOkSingle = () => {
    this.setState({
      addSingleChatModal: false,
    });
    this.props.addChat(this.state.inputValue, ChatTypeSingle);
  };

  handleCancelSingle = () => {
    this.setState({
      addSingleChatModal: false,
    });
  };

  showModalGroup = () => {
    this.setState({
      addGroupChatModal: true,
    });
  };

  handleOkGroup = () => {
    this.setState({
      addGroupChatModal: false,
    });
    this.props.addChat(this.state.inputValue, ChatTypeGroup);
  };

  handleCancelGroup = () => {
    this.setState({
      addGroupChatModal: false,
    });
  };

  handleInputChange = (event) => {
    this.setState({
      inputValue: event.target.value,
    });
  };

  render() {
    return (
      <div style={{height: "465px", width: "250px"}}>
        <div>
          <Button onClick={this.showModalSingle}>单聊</Button>
          <Modal title="add single chat" open={this.state.addSingleChatModal} onOk={this.handleOkSingle} onCancel={this.handleCancelSingle}>
            <p><Input placeholder="user name" onChange={this.handleInputChange} /></p>
          </Modal>
          <Button onClick={this.showModalGroup}>群聊</Button>
          <Modal title="add group chat" open={this.state.addGroupChatModal} onOk={this.handleOkGroup} onCancel={this.handleCancelGroup}>
            <p><Input placeholder="chat display name" onChange={this.handleInputChange} /></p>
          </Modal>
        </div>
        <ConversationList>
          {this.props.chats.map((chat, index) => (
            <Conversation key={index} name={chat.displayName} lastSenderName={chat.lastSender} onClick={() => {this.props.selectChat(index);}}>
              <Avatar src={chat.avatar} />
            </Conversation>
          ))}
        </ConversationList>
      </div>
    );
  }
}

export default ChatMenu;
