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
import {Alert, Button, Card, Layout, List, Space} from "antd";
import {updateMessage} from "./backend/MessageBackend";
import {renderText} from "./ChatMessageRender";
import * as Conf from "./Conf";
import * as Setting from "./Setting";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import moment from "moment";
import {ThemeDefault} from "./Conf";
import {AudioFilled, CopyOutlined, DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined, LinkOutlined, PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined} from "@ant-design/icons";
import ChatPrompts from "./ChatPrompts";
import {Bubble, Sender, Welcome} from "@ant-design/x";

// store the input value when the name(chat) leaves
const inputStore = new Map();

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      files: [],
      messages: this.props.messages,
      currentReadingMessage: null,
      isReading: false,
      isVoiceInput: false,
    };
    this.synth = window.speechSynthesis;
    this.recognition = undefined;
    this.cursorPosition = undefined;
    this.copyFileName = null;
    this.messageListRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("beforeunload", () => {
      this.synth.cancel();
    });
    this.addCursorPositionListener();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // clear old status when the name(chat) changes
    if (prevProps.name !== this.props.name) {
      inputStore.set(prevProps.name, this.state.value);
      this.clearOldStatus();
    }
    if (inputStore.has(this.props.name)) {
      this.setState({value: inputStore.get(this.props.name)});
      inputStore.delete(this.props.name);
    }
    if (prevProps.messages?.length !== this.props.messages?.length) {
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
    inputStore.set(this.props.name, this.state.value);
    this.clearOldStatus();
  }

  clearOldStatus() {
    this.recognition?.abort();
    this.synth.cancel();
    this.setState({
      value: "",
      files: [],
      messages: this.props.messages,
      currentReadingMessage: null,
      isReading: false,
      isVoiceInput: false,
    });
    this.cursorPosition = undefined;
  }

  addCursorPositionListener() {
    const inputElement = document.querySelector(".cs-message-input__content-editor");
    const updateCursorPosition = () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(inputElement);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        this.cursorPosition = preSelectionRange.toString().length;
        if (this.state.isVoiceInput) {
          this.recognition.abort();
          // this.recognition.onresult = this.insertVoiceMessage.call(this);
        }
      }
    };
    // add listener to update cursor position
    inputElement?.addEventListener("keyup", updateCursorPosition);
    inputElement?.addEventListener("click", updateCursorPosition);
  }

  handleSend = (innerHtml) => {
    // abort because the remaining recognition results are useless
    this.recognition?.abort();
    if (this.state.value === "" || this.props.disableInput) {
      return;
    }
    const newValue = this.state.value.replace(/<img src="([^"]*)" alt="([^"]*)" width="(\d+)" height="(\d+)" data-original-width="(\d+)" data-original-height="(\d+)">/g, (match, src, alt, width, height, scaledWidth, scaledHeight) => {
      return `<img src="${src}" alt="${alt}" width="${scaledWidth}" height="${scaledHeight}">`;
    });
    const date = moment();
    const dateString = date.format("YYYYMMDD_HHmmss");

    let fileName = "";
    if (this.state.files[0]) {
      fileName = this.state.files[0].name;
    } else if (this.copyFileName) {
      const fileExtension = this.copyFileName.match(/\..+$/)[0];
      fileName = dateString + fileExtension;
      this.copyFileName = null;
    }
    this.props.sendMessage(newValue, fileName);
    this.setState({value: ""});
  };

  handleRegenerate = () => {
    const messages = this.props.messages;
    const isSingleWelcomeMessage = (
      messages.length === 1 &&
      messages[0].replyTo === "Welcome" &&
      messages[0].author === "AI"
    );
    const text = isSingleWelcomeMessage ? "" : messages.reverse().find(message => message.author !== "AI").text;
    this.props.sendMessage(text, "", true);
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
          this.setState(prevState => ({
            value: prevState.value + `<img src="${img.src}" alt="${img.alt}" width="${scaledWidth}" height="${scaledHeight}" data-original-width="${chatScaledWidth}" data-original-height="${chatScaledHeight}">`,
            files: [...prevState.files, file],
          }));
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

  renderMessageContent = (message, isLastMessage) => {
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

    if (message.text === "" && message.author === "AI") {
      return null;
    }

    if (isLastMessage && message.author === "AI" && message.TokenCount === 0) {
      return renderText(Setting.parseAnswerAndSuggestions(message.text)["answer"]);
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

  handleMessageLike(message, reactionType) {
    const oppositeReaction = reactionType === "like" ? "dislike" : "like";

    const isCancel = !!message[`${reactionType}Users`]?.includes(this.props.account.name);

    if (isCancel) {
      message[`${reactionType}Users`] = Setting.deleteElementFromSet(message[`${reactionType}Users`], this.props.account.name);
    } else {
      message[`${reactionType}Users`] = Setting.addElementToSet(message[`${reactionType}Users`], this.props.account.name);
    }

    message[`${oppositeReaction}Users`] = Setting.deleteElementFromSet(message[`${oppositeReaction}Users`], this.props.account.name);

    this.setState({messages: this.state.messages.map(m => m.name === message.name ? message : m)});
    updateMessage(message.owner, message.name, message).then((result) => {
      if (result.status === "ok") {
        Setting.showMessage("success", `${isCancel ? "Cancel " : ""}${reactionType}d successfully`);
        return;
      }
      Setting.showMessage("error", result.msg);
    });
  }

  handleDragOver = (e) => {
    e.preventDefault();
  };

  handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      this.handleInputChange(files[0]);
    }
  };

  toggleMessageReadState(message) {
    const shouldPaused = (this.state.readingMessage === message.name && this.state.isReading);
    if (shouldPaused) {
      this.synth.pause();
      this.setState({isReading: false});
      return;
    }
    if (this.state.readingMessage === message.name && this.state.isReading === false) {
      this.synth.resume();
      this.setState({isReading: true});
    } else {
      this.synth.cancel();
      const utterThis = new SpeechSynthesisUtterance(message.text);
      utterThis.addEventListener("end", () => {
        this.synth.cancel();
        this.setState({isReading: false, readingMessage: null});
      });
      this.synth.speak(utterThis);
      this.setState({
        readingMessage: message.name,
        isReading: true,
      });
    }
  }

  renderSuggestions(message) {
    if (message.author !== "AI" || !message.suggestions || !Array.isArray(message.suggestions)) {
      return null;
    }
    const fontSize = Setting.isMobile() ? "10px" : "12px";
    return (
      <div style={{
        position: "absolute",
        marginRight: "10%",
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "start",
        zIndex: "10000",
        maxWidth: "80%",
      }}>
        {
          message?.suggestions?.map((suggestion, index) => {
            let suggestionText = suggestion.text;
            if (suggestionText.trim() === "") {
              return null;
            }
            suggestionText = Setting.formatSuggestion(suggestionText);

            return (
              <Button
                className={"suggestions-item"}
                key={index} type="primary" style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  border: "1px solid " + ThemeDefault.colorPrimary,
                  color: ThemeDefault.colorPrimary,
                  borderRadius: "4px",
                  fontSize: fontSize,
                  margin: "3px",
                  textAlign: "start",
                  whiteSpace: "pre-wrap",
                  height: "auto",
                }} onClick={() => {
                  this.props.sendMessage(suggestionText, "");
                  message.suggestions[index].isHit = true;
                  updateMessage(message.owner, message.name, message, true);
                }}
              >{suggestionText}</Button>
            );
          })
        }
      </div>
    );
  }

  insertVoiceMessage() {
    const oldValue = this.state.value;

    return (event) => {
      const result = Array.from(event?.results)?.map((result) => result[0].transcript).join(",");
      if (this.cursorPosition === undefined) {
        this.setState({value: oldValue + result});
      } else {
        const newValue = oldValue.slice(0, this.cursorPosition) + result + oldValue.slice(this.cursorPosition);
        this.setState({value: newValue});
      }
    };
  }

  renderVoiceInputHint() {
    const baseUnit = Setting.isMobile() ? "vw" : "vh";
    return (
      <div style={{position: "absolute", zIndex: "100", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
        <div style={{padding: "10px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", borderRadius: "50%", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "50" + baseUnit, height: "50" + baseUnit, backgroundColor: "rgba(255, 255, 255, 0.8)"}}
          onClick={
            () => {
              this.recognition.abort();
              this.setState({isVoiceInput: false});
            }
          }>
          <AudioFilled style={{fontSize: `10${baseUnit}`, color: ThemeDefault.colorPrimary, marginBottom: "10%"}} />
          <div style={{fontSize: "14px", color: ThemeDefault.colorPrimary, marginBottom: "5%", fontFamily: "Arial, sans-serif", fontWeight: "bold"}}>{i18next.t("chat:I'm listening...")}</div>
          <div style={{fontSize: "12px", color: ThemeDefault.colorPrimary, fontFamily: "Arial, sans-serif"}}>{i18next.t("chat:click to stop...")}</div>
        </div>
      </div>
    );
  }

  handleFileUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*, .txt, .md, .yaml, .csv, .docx, .pdf, .xlsx";
    input.multiple = false;
    input.style.display = "none";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleInputChange(file);
      }
    };
    input.click();
  };

  scrollToBottom = () => {
    if (this.messageListRef.current) {
      const scrollElement = this.messageListRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  };

  renderWelcomeHeader() {
    return (
      <Welcome
        variant="borderless"
        icon={this.props.store?.avatar || Conf.AiAvatar}
        title={i18next.t("chat:Hello, I'm") + " " + "AI Assistant"}
        description={i18next.t("chat:I'm here to help answer your questions")}
      />
    );
  }

  render() {
    const getStoreAvatar = (store) => (!store?.avatar) ? Conf.AiAvatar : store.avatar;

    const avatar = getStoreAvatar(this.props.store);

    let prompts = this.props.store?.prompts;
    if (!prompts) {
      prompts = [];
    }

    let messages = this.props.messages;
    if (messages === null) {
      messages = [];
    }

    return (
      <React.Fragment>
        <Layout style={{
          display: "flex",
          width: "100%",
          height: "100%",
          borderRadius: "6px",
        }}>
          <Card style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            position: "relative",
            padding: "24px",
          }}>
            {messages.length === 0 && this.renderWelcomeHeader()}
            <List
              ref={this.messageListRef}
              locale={{emptyText: " "}}
              style={{
                flex: 1,
                overflow: "auto",
                position: this.props.previewMode ? "relative" : "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: "100px",
                padding: "24px",
                paddingBottom: "40px",
                scrollBehavior: "smooth",
              }}
              dataSource={messages.filter(message => message.isHidden === false)}
              renderItem={(message, index) => (
                <div key={index} style={{
                  maxWidth: "90%",
                  margin: message.author === "AI" ? "0 auto 0 0" : "0 0 0 auto",
                }}>
                  <div style={{
                    textAlign: message.author === "AI" ? "left" : "right",
                    color: "#999",
                    fontSize: "12px",
                    marginBottom: "8px",
                    padding: "0 12px",
                  }}>
                    {moment(message.createdTime).format("YYYY/M/D HH:mm:ss")}
                  </div>
                  <Bubble
                    placement={message.author === "AI" ? "start" : "end"}
                    content={this.renderMessageContent(message, index === messages.length - 1)}
                    loading={message.text === "" && message.author === "AI"}
                    typing={message.author === "AI" ? {
                      step: 2,
                      interval: 50,
                    } : undefined}
                    avatar={{
                      src: message.author === "AI" ? avatar : this.props.account.avatar,
                    }}
                    styles={{
                      content: {
                        backgroundColor: message.author === "AI" ? ThemeDefault.colorBackground : undefined,
                        borderRadius: "16px",
                        padding: "12px 16px",
                      },
                    }}
                  />
                  {(message.author === "AI" && (this.props.disableInput === false || index !== messages.length - 1)) && (
                    <Space
                      size="small"
                      style={{
                        marginTop: "8px",
                        marginLeft: "48px",
                        opacity: 0.8,
                      }}
                    >
                      <Button
                        className="cs-button"
                        icon={<CopyOutlined />}
                        style={{border: "none", color: ThemeDefault.colorPrimary}}
                        onClick={() => this.copyMessageFromHTML(message.html.props.dangerouslySetInnerHTML.__html)}
                      />
                      {index !== messages.length - 1 ? null :
                        <Button
                          className="cs-button"
                          icon={<ReloadOutlined />}
                          style={{border: "none", color: ThemeDefault.colorPrimary}}
                          onClick={() => this.handleRegenerate()}
                        />
                      }
                      <Button
                        className="cs-button"
                        icon={message.likeUsers?.includes(this.props.account.name) ? <LikeFilled /> : <LikeOutlined />}
                        style={{border: "none", color: ThemeDefault.colorPrimary}}
                        onClick={() => this.handleMessageLike(message, "like")}
                      />
                      <Button
                        className="cs-button"
                        icon={message.dislikeUsers?.includes(this.props.account.name) ? <DislikeFilled /> : <DislikeOutlined />}
                        style={{border: "none", color: ThemeDefault.colorPrimary}}
                        onClick={() => this.handleMessageLike(message, "dislike")}
                      />
                      <Button
                        className="cs-button"
                        icon={(this.state.readingMessage === message.name) && this.state.isReading ?
                          <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        style={{border: "none", color: ThemeDefault.colorPrimary}}
                        onClick={() => this.toggleMessageReadState(message)}
                      />
                    </Space>
                  )}
                </div>
              )}
            />
            {!this.props.disableInput && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "16px 24px",
                zIndex: 1,
              }}>
                <div style={{
                  maxWidth: "700px",
                  margin: "0 auto",
                }}>
                  <Sender
                    ref={this.senderRef}
                    prefix={
                      <Button
                        type="text"
                        icon={<LinkOutlined />}
                        onClick={this.handleFileUploadClick}
                      />
                    }
                    loading={this.props.loading}
                    disabled={false}
                    style={{
                      flex: 1,
                      borderRadius: "8px",
                      background: "#f5f5f5",
                    }}
                    sendDisabled={this.state.value === "" || this.props.disableInput}
                    placeholder={i18next.t("chat:Type message here")}
                    value={this.state.value}
                    onChange={(val) => this.setState({value: val})}
                    onPasteFile={this.handleInputChange}
                    onSubmit={() => {
                      this.handleSend(this.state.value);
                      this.setState({value: ""});
                    }}
                    onCancel={() => {
                      this.props.onCancelMessage && this.props.onCancelMessage();
                    }}
                    allowSpeech
                  />
                </div>
              </div>
            )}
          </Card>
          {
            !this.state.isVoiceInput ? messages.length !== 0 ? null : <ChatPrompts sendMessage={this.props.sendMessage} prompts={prompts} /> : this.renderVoiceInputHint()
          }
        </Layout>
      </React.Fragment>
    );
  }
}

export default ChatBox;
