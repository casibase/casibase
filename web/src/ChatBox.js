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
import {
  Avatar,
  Button,
  ChatContainer,
  ConversationHeader,
  InputToolbox,
  MainContainer,
  Message,
  MessageInput,
  MessageList, SendButton
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {FolderOutlined} from "@ant-design/icons";

const aiAvatar = "https://cdn.casbin.com/casdoor/static/gpt.png";

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: "",
    };
  }
  handleSend = () => {
    if (this.state.content !== "") {
      this.props.sendMessage(this.state.content);
      this.setState({content: ""});
    }
  };
  handleImageClick = () => {
    if (this.inputImage.files) {
      this.inputImage.click();
    }
  };
  handleInputChange = async() => {
    const file = this.inputImage.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        const maxWidth = 800;
        let Ratio = 1;
        if (originalWidth > maxWidth) {
          Ratio = maxWidth / originalWidth;
        }
        const scaledWidth = Math.round(originalWidth * Ratio);
        const scaledHeight = Math.round(originalHeight * Ratio);
        this.setState({
          content: this.state.content + `<img src="${img.src}" alt="${img.alt}" width="${scaledWidth}" height="${scaledHeight}">`,
        });
      };

      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  render() {
    let messages = this.props.messages;
    if (messages === null) {
      messages = [];
    }
    return (
      <MainContainer style={{display: "flex", width: "100%", height: "100%", border: "1px solid rgb(242,242,242)", borderRadius: "6px"}} >
        <ChatContainer style={{display: "flex", width: "100%", height: "100%"}}>
          <ConversationHeader style={{backgroundColor: "rgb(246,240,255)"}}>
            <Avatar src={aiAvatar} name="AI" />
            <ConversationHeader.Content userName="AI" />
          </ConversationHeader>
          <MessageList>
            {messages.map((message, index) => (
              <Message key={index} model={{
                message: message.text,
                sentTime: "just now",
                sender: message.name,
                direction: message.author === "AI" ? "incoming" : "outgoing",
              }} avatarPosition={message.author === "AI" ? "tl" : "tr"}>
                <Avatar src={message.author === "AI" ? aiAvatar : this.props.account.avatar} name="GPT" />
              </Message>
            ))}
          </MessageList>
          <MessageInput placeholder="Type message here" value={this.state.content} onChange={val => this.setState({content: val})} onSend={this.handleSend} sendButton={false} attachButton={false} />
          <InputToolbox>
            <Button onClick={this.handleImageClick}><FolderOutlined /></Button>
            <input
              ref={e => this.inputImage = e}
              type="file"
              accept="image/*"
              multiple={false}
              onChange={this.handleInputChange}
              style={{display: "none"}}
            />
            <SendButton onClick={this.handleSend} />
          </InputToolbox>
        </ChatContainer>
      </MainContainer>
    );
  }
}

export default ChatBox;
