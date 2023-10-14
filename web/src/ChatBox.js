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
import * as Conf from "./Conf";

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dots: ".",
      sendDisabled: false,
      value: "",
    };
    this.timer = null;
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState(prevState => {
        switch (prevState.dots) {
        case ".":
          return {dots: ".."};
        case "..":
          return {dots: "..."};
        case "...":
          return {dots: "."};
        default:
          return {dots: "."};
        }
      });
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleSend = (innerHtml) => {
    this.props.sendMessage(this.state.value);
    this.setState({value: ""});
  };

  handleImageClick = () => {
    this.inputImage.click();
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
          value: this.state.value + `<img src="${img.src}" alt="${img.alt}" width="${scaledWidth}" height="${scaledHeight}">`,
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
      <React.Fragment>
        <MainContainer style={{display: "flex", width: "100%", height: "100%", border: "1px solid rgb(242,242,242)", borderRadius: "6px"}} >
          <ChatContainer style={{display: "flex", width: "100%", height: "100%"}}>
            <ConversationHeader style={{backgroundColor: "rgb(246,240,255)", height: "42px"}}>
              <ConversationHeader.Content userName={Conf.AiName} />
            </ConversationHeader>
            <MessageList>
              {messages.map((message, index) => (
                <Message key={index} model={{
                  message: message.text !== "" ? message.text : this.state.dots,
                  sender: message.name,
                  direction: message.author === "AI" ? "incoming" : "outgoing",
                }} avatarPosition={message.author === "AI" ? "tl" : "tr"}>
                  <Avatar src={message.author === "AI" ? Conf.AiAvatar : this.props.account.avatar} name="GPT" />
                </Message>
              ))}
            </MessageList>
            <MessageInput disabled={this.props.disableInput}
              sendDisabled={this.state.sendDisabled}
              placeholder={Conf.AiPlaceholder}
              onSend={this.handleSend}
              onChange={(val) => {
                this.setState({value: val});
              }}
              value={this.state.value}
              onPaste={(evt) => {
                evt.preventDefault();
                this.setState({value: this.state.value + evt.clipboardData.getData("text")});
                this.setState({sendDisabled: false});
              }}
              onAttachClick={() => {
                this.handleImageClick();
              }}
            />
          </ChatContainer>
        </MainContainer>
        <input
          ref={e => this.inputImage = e}
          type="file"
          accept="image/*"
          multiple={false}
          onChange={this.handleInputChange}
          style={{display: "none"}}
        />
      </React.Fragment>
    );
  }
}

export default ChatBox;
