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
import {Card, Layout} from "antd";
import * as Setting from "./Setting";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import moment from "moment";
import ChatPrompts from "./ChatPrompts";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import VoiceInputOverlay from "./chat/VoiceInputOverlay";
import WelcomeHeader from "./chat/WelcomeHeader";
import * as MessageBackend from "./backend/MessageBackend";

// Store the input value when the name(chat) leaves
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
      rerenderErrorMessage: false,
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
      this.setState({messages: this.props.messages});
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
        }
      }
    };

    inputElement?.addEventListener("keyup", updateCursorPosition);
    inputElement?.addEventListener("click", updateCursorPosition);
  }

  handleSend = (innerHtml) => {
    // abort because the remaining recognition results are useless
    this.recognition?.abort();
    if (this.state.value === "" || this.props.disableInput) {
      return;
    }

    const newValue = this.state.value.replace(/<img src="([^"]*)" alt="([^"]*)" width="(\d+)" height="(\d+)" data-original-width="(\d+)" data-original-height="(\d+)">/g,
      (match, src, alt, width, height, scaledWidth, scaledHeight) => {
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
    this.setState({value: "", files: []});
  };

  handleRegenerate = (index) => {
    // can only regenerate after sending the message
    const messages = this.state.messages || [];
    const message = [...messages.slice(0, index)].reverse().find(message => message.author !== "AI");

    this.handleEditMessage({...message, text: message.text, updatedTime: new Date().toISOString()});
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

  copyMessageFromHTML(message) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = message;
    const text = tempElement.innerText;
    copy(text);
    Setting.showMessage("success", i18next.t("general:Successfully copied"));
  }

  handleMessageLike = (message, reactionType) => {
    const oppositeReaction = reactionType === "like" ? "dislike" : "like";
    const isCancel = !!message[`${reactionType}Users`]?.includes(this.props.account.name);

    if (isCancel) {
      message[`${reactionType}Users`] = Setting.deleteElementFromSet(message[`${reactionType}Users`], this.props.account.name);
    } else {
      message[`${reactionType}Users`] = Setting.addElementToSet(message[`${reactionType}Users`], this.props.account.name);
    }

    message[`${oppositeReaction}Users`] = Setting.deleteElementFromSet(message[`${oppositeReaction}Users`], this.props.account.name);

    this.setState({messages: this.state.messages.map(m => m.name === message.name ? message : m)});
    MessageBackend.updateMessage(message.owner, message.name, message).then((result) => {
      if (result.status === "ok") {
        if (reactionType === "like") {
          if (isCancel) {
            Setting.showMessage("success", i18next.t("general:Successfully unliked"));
          } else {
            Setting.showMessage("success", i18next.t("general:Successfully liked"));
          }
        } else {
          if (isCancel) {
            Setting.showMessage("success", i18next.t("general:Successfully undisliked"));
          } else {
            Setting.showMessage("success", i18next.t("general:Successfully disliked"));
          }
        }
      } else {
        Setting.showMessage("error", result.msg);
      }
    });
  };

  toggleMessageReadState = (message) => {
    const shouldPause = (this.state.readingMessage === message.name && this.state.isReading);
    if (shouldPause) {
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
      utterThis.lang = Setting.getLanguage();
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
  };

  insertVoiceMessage = () => {
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
  };

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

  handleEditMessage = (message) => {
    const editedMessage = {
      ...message,
      createdTime: moment().format(),
    };
    MessageBackend.addMessage(editedMessage)
      .then((res) => {
        if (res.status === "ok") {
          const chat = res.data;

          if (this.props.onMessageEdit) {
            this.props.onMessageEdit(chat.name);
          }

          Setting.showMessage("success", i18next.t("general:Successfully update"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  };

  render() {
    let messages = this.props.messages;
    if (messages === null) {
      messages = [];
    }

    let prompts = this.props.store?.prompts;
    if (!prompts) {
      prompts = [];
    }

    return (
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
          {messages.length === 0 && <WelcomeHeader store={this.props.store} />}

          <MessageList
            ref={this.messageListRef}
            messages={messages}
            account={this.props.account}
            store={this.props.store}
            onRegenerate={this.handleRegenerate}
            onMessageLike={this.handleMessageLike}
            onCopyMessage={this.copyMessageFromHTML}
            onToggleRead={this.toggleMessageReadState}
            onEditMessage={this.handleEditMessage}
            previewMode={this.props.previewMode}
            hideInput={this.props.hideInput}
            disableInput={this.props.disableInput}
            isReading={this.state.isReading}
            readingMessage={this.state.readingMessage}
            sendMessage={this.props.sendMessage}
          />

          {!this.props.disableInput && (
            <ChatInput
              value={this.state.value}
              onChange={(value) => this.setState({value})}
              onSend={this.handleSend}
              onFileUpload={this.handleFileUploadClick}
              loading={this.props.loading}
              disableInput={this.props.disableInput}
              messageError={this.props.messageError}
              onCancelMessage={this.props.onCancelMessage}
              onVoiceInputStart={() => this.setState({isVoiceInput: true})}
              onVoiceInputEnd={() => this.setState({isVoiceInput: false})}
            />
          )}
        </Card>

        {this.state.isVoiceInput ? (
          <VoiceInputOverlay
            onStop={() => {
              this.recognition?.abort();
              this.setState({isVoiceInput: false});
            }}
          />
        ) : (
          messages.length === 0 ? (
            <ChatPrompts
              sendMessage={this.props.sendMessage}
              prompts={prompts}
            />
          ) : null
        )}
      </Layout>
    );
  }
}

export default ChatBox;
