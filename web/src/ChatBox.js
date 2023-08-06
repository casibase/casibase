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
import {Avatar, ChatContainer, ConversationHeader, MainContainer, Message, MessageInput, MessageList} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  handleSend = (innerHtml, textContent) => {
    this.props.sendMessage(textContent);
  };

  render() {
    return (
      <MainContainer style={{display: "flex", width: "100%", height: "100%"}} >
        <ChatContainer style={{display: "flex", width: "100%", height: "100%"}}>
          <ConversationHeader>
            <ConversationHeader.Content userName={this.props.displayName} />
          </ConversationHeader>
          <MessageList>
            {this.props.messages.map((message, index) => (
              <Message key={index} model={{
                message: message.text,
                sender: message.name,
                direction: message.direction,
              }} avatarPosition={message.position}>
                <Avatar src={message.avatar} />
              </Message>
            ))}
          </MessageList>
          <MessageInput placeholder="Type message here" onSend={this.handleSend} />
        </ChatContainer>
      </MainContainer>
    );
  }
}

export default ChatBox;
