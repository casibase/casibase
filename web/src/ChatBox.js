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
import {Alert, Button} from "antd";
import {Avatar, ChatContainer, ConversationHeader, MainContainer, Message, MessageInput, MessageList} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import * as Conf from "./Conf";
import * as Setting from "./Setting";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import moment from "moment";
import {ThemeDefault} from "./Conf";
import {CopyOutlined, DislikeOutlined, LikeOutlined, ReloadOutlined} from "@ant-design/icons";
import ChatPrompts from "./ChatPrompts";

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dots: "⚫",
      value: "",
    };
    this.timer = null;
    this.copyFileName = null;
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState(prevState => {
        switch (prevState.dots) {
        case "⚫":
          return {dots: " "};
        case " ":
          return {dots: "⚫"};
        default:
          return {dots: "⚫"};
        }
      });
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleSend = (innerHtml) => {
    if (this.state.value === "" || this.props.disableInput) {
      return;
    }
    const newValue = this.state.value.replace(/<img src="([^"]*)" alt="([^"]*)" width="(\d+)" height="(\d+)" data-original-width="(\d+)" data-original-height="(\d+)">/g, (match, src, alt, width, height, scaledWidth, scaledHeight) => {
      return `<img src="${src}" alt="${alt}" width="${scaledWidth}" height="${scaledHeight}">`;
    });
    const date = moment();
    const dateString = date.format("YYYYMMDD_HHmmss");

    let fileName = "";
    if (this.inputImage.files[0]) {
      fileName = this.inputImage.files[0].name;
    } else if (this.copyFileName) {
      const fileExtension = this.copyFileName.match(/\..+$/)[0];
      fileName = dateString + fileExtension;
      this.copyFileName = null;
    }
    this.props.sendMessage(newValue, fileName);
    this.setState({value: ""});
  };

  handleRegenerate = () => {
    const lastUserMessage = this.props.messages.reverse().find(message => message.author !== "AI");
    // eslint-disable-next-line no-console
    console.log(lastUserMessage.text);
    this.props.sendMessage(lastUserMessage.text, "", true);
  };

  handleImageClick = () => {
    this.inputImage.click();
  };

  handleInputChange = async(file) => {
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;
          const inputMaxWidth = 70;
          const chatMaxWidth = 600;
          let Ratio = 1;
          if (originalWidth > inputMaxWidth) {
            Ratio = inputMaxWidth / originalWidth;
          }
          const scaledWidth = Math.round(originalWidth * Ratio);
          const scaledHeight = Math.round(originalHeight * Ratio);
          if (originalWidth > chatMaxWidth) {
            Ratio = chatMaxWidth / originalWidth;
          }
          const chatScaledWidth = Math.round(originalWidth * Ratio);
          const chatScaledHeight = Math.round(originalHeight * Ratio);
          this.setState({
            value: this.state.value + `<img src="${img.src}" alt="${img.alt}" width="${scaledWidth}" height="${scaledHeight}" data-original-width="${chatScaledWidth}" data-original-height="${chatScaledHeight}">`,
          });
        };
        img.src = e.target.result;
      };
    } else {
      reader.onload = (e) => {
        this.setState({
          value: this.state.value + `<a href="${e.target.result}" target="_blank">${file.name}</a>`,
        });
      };
    }
    reader.readAsDataURL(file);
  };

  renderMessageContent = (message) => {
    if (message.errorText !== "") {
      const refinedErrorText = Setting.getRefinedErrorText(message.errorText);
      return (
        <Alert
          message={refinedErrorText}
          description={message.errorText}
          type="error"
          showIcon
          action={
            <Button type={"primary"} onClick={this.handleRegenerate}>
              {i18next.t("general:Regenerate Answer")}
            </Button>
          }
        />
      );
    }

    if (message.text === "") {
      return this.state.dots;
    }

    return message.html;
  };

  copyMessageFromHTML(message) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = message;
    const text = tempElement.innerText;
    copy(text);
    Setting.showMessage("success", "Message copied successfully");
  }

  likeMessage() {
    Setting.showMessage("success", "Message liked successfully");
  }

  dislikeMessage() {
    Setting.showMessage("success", "Message disliked successfully");
  }

  render() {
    let title = Setting.getUrlParam("title");
    if (title === null) {
      title = Conf.AiName;
    }

    let messages = this.props.messages;
    if (messages === null) {
      messages = [];
    }
    return (
      <React.Fragment>
        <MainContainer style={{display: "flex", width: "100%", height: "100%", border: "1px solid " + ThemeDefault.colorBackground, borderRadius: "6px"}} >
          <ChatContainer style={{display: "flex", width: "100%", height: "100%"}}>
            {
              (title === "") ? null : (
                <ConversationHeader style={{backgroundColor: ThemeDefault.colorBackground, height: "42px"}}>
                  <ConversationHeader.Content userName={title} />
                </ConversationHeader>
              )
            }
            <MessageList style={{marginTop: "10px"}}>
              {messages.filter(message => message.isHidden === false).map((message, index) => (
                <Message key={index} model={{
                  type: "custom",
                  sender: message.name,
                  direction: message.author === "AI" ? "incoming" : "outgoing",
                }} avatarPosition={message.author === "AI" ? "tl" : "tr"}>
                  <Avatar src={message.author === "AI" ? Conf.AiAvatar : (this.props.hideInput === true ? "https://cdn.casdoor.com/casdoor/resource/built-in/admin/casibase-user.png" : this.props.account.avatar)} name="GPT" />
                  <Message.CustomContent>
                    {this.renderMessageContent(message)}
                  </Message.CustomContent>
                  {
                    (message.author === "AI" && (this.props.disableInput === false || index !== messages.length - 1)) ? (
                      <Message.Footer>
                        {<Button icon={<CopyOutlined />} style={{border: "none", color: ThemeDefault.colorPrimary}} onClick={() => this.copyMessageFromHTML(message.html.props.dangerouslySetInnerHTML.__html)}></Button>}
                        {index !== messages.length - 1 ? null : <Button icon={<ReloadOutlined />} style={{border: "none", color: ThemeDefault.colorPrimary}} onClick={() => this.handleRegenerate()}></Button>}
                        {<Button icon={<LikeOutlined />} style={{border: "none", color: ThemeDefault.colorPrimary}} onClick={() => this.likeMessage()}></Button>}
                        {<Button icon={<DislikeOutlined />} style={{border: "none", color: ThemeDefault.colorPrimary}} onClick={() => this.dislikeMessage()}></Button>}
                      </Message.Footer>
                    ) : null
                  }
                </Message>
              ))}
            </MessageList>
            {
              this.props.hideInput === true ? null : (
                <MessageInput disabled={false}
                  sendDisabled={this.state.value === "" || this.props.disableInput}
                  placeholder={i18next.t("chat:Type message here")}
                  onSend={this.handleSend}
                  value={this.state.value}
                  onChange={(val) => {
                    this.setState({value: val});
                  }}
                  onAttachClick={() => {
                    this.handleImageClick();
                  }}
                  onPaste={(event) => {
                    const items = event.clipboardData.items;
                    const item = items[0];
                    if (item.kind === "file") {
                      event.preventDefault();
                      const file = item.getAsFile();
                      this.copyFileName = file.name;
                      this.handleInputChange(file);
                    }
                  }}
                />
              )
            }
          </ChatContainer>
          {
            messages.length !== 0 ? null : <ChatPrompts sendMessage={this.props.sendMessage} />
          }
        </MainContainer>
        <input
          ref={e => this.inputImage = e}
          type="file"
          accept="image/*, .txt, .md, .yaml, .csv, .docx, .pdf, .xlsx"
          multiple={false}
          onChange={() => this.handleInputChange(this.inputImage.files[0])}
          style={{display: "none"}}
        />
      </React.Fragment>
    );
  }
}

export default ChatBox;
