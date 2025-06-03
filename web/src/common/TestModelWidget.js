// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import {Button, Col, Row} from "antd";
import * as Setting from "../Setting";
import {renderText} from "../ChatMessageRender";
import moment from "moment";
import {checkProvider} from "./ProviderWidget";
import * as ChatBackend from "../backend/ChatBackend";
import i18next from "i18next";
import * as MessageBackend from "../backend/MessageBackend";
import ChatBox from "../ChatBox";

class ModelTestWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      testMessages: [],
      testButtonLoading: false,
    };
  }

  componentDidMount() {
    if (this.props.provider && this.props.provider.category === "Model") {
      // Set default test content if empty
      if (this.props.provider.testContent === "") {
        this.props.provider.testContent = "Hello, how are you today?";
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("testContent", "Hello, how are you today?");
        }
      }

      this.getTestMessages(this.props.provider, this.props.account, (messages) => this.setState({testMessages: messages}));
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.provider?.name !== this.props.provider?.name &&
        this.props.provider?.category === "Model") {
      // Set default test content if empty
      if (this.props.provider.testContent === "") {
        this.props.provider.testContent = "Hello, how are you today?";
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("testContent", "Hello, how are you today?");
        }
      }

      this.getTestMessages(this.props.provider, this.props.account, (messages) => this.setState({testMessages: messages}));
    }
  }

  newTestMessage(text, author, provider, account) {
    const randomName = Setting.getRandomName();
    const messageText = text;
    return {
      owner: "admin",
      name: `message_${randomName}`,
      createdTime: moment().format(),
      organization: account.owner,
      user: account.name,
      chat: `chat_${provider.name}`,
      replyTo: "",
      author: author,
      text: messageText,
      isHidden: false,
      isDeleted: false,
      isAlerted: false,
      isRegenerated: false,
      fileName: "",
      html: renderText(messageText),
      errorText: "",
      reasonText: "",
    };
  }

  async sendTestModel(provider, originalProvider, question, owner, user, setLoading = null, setAnswer = null) {
    await checkProvider(provider, originalProvider);
    if (setLoading) {
      setLoading(true);
    }

    const providerName = provider.name;

    const response = await fetch(`${Setting.ServerUrl}/api/get-answer?provider=${encodeURIComponent(providerName)}&question=${encodeURIComponent(question)}&framework=chat_${encodeURIComponent(providerName)}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "ok") {
      if (setAnswer) {
        setAnswer(result.data);
        setLoading(false);
      }
    } else {
      Setting.showMessage("error", Setting.getRefinedErrorText(result.msg));
      if (setAnswer) {
        setAnswer("");
      }
    }
  }

  sendTestMessage(provider, originalProvider, messageText, account, setLoading, setMessages, messages) {
    if (!messageText.trim()) {return;}

    const userMessage = this.newTestMessage(messageText, account.name, provider, account);

    const aiMessage = this.newTestMessage("", "AI", provider, account);
    aiMessage.replyTo = userMessage.name;

    const newMessages = [...messages, userMessage, aiMessage];
    setMessages(newMessages);

    this.sendTestModel(provider, originalProvider, messageText, account.owner, account.name, setLoading, (answer) => {
      const updatedMessages = [...newMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      lastMessage.text = answer;
      lastMessage.html = renderText(answer);
      setMessages(updatedMessages);
    });
  }

  getTestMessages(provider, account, setMessages) {
    const testChatName = `chat_${provider.name}`;

    MessageBackend.getChatMessages(account.owner, testChatName)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            res.data.map((message) => {
              message.html = renderText(message.text);
              return message;
            });
          }
          setMessages(res.data || []);
        } else {
          setMessages([]);
        }
      })
      .catch(error => {
        setMessages([]);
      });
  }

  clearTestMessages(provider, account, setMessages) {
    const testChat = {
      name: `chat_${provider.name}`,
      owner: "admin",
      organization: account.owner,
    };

    ChatBackend.deleteChat(testChat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          setMessages([]);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    const {provider, originalProvider, account} = this.props;

    if (!provider || provider.category !== "Model") {
      return null;
    }

    return (
      <React.Fragment>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Provider test"), i18next.t("provider:Provider test - Tooltip"))} :
          </Col>
          <Col span={20}>
            <div style={{marginBottom: "10px", textAlign: "right"}}>
              <Button type="primary" onClick={() => this.clearTestMessages(provider, account, (messages) => this.setState({testMessages: messages}))} size="small">
                {i18next.t("chat:New Chat")}
              </Button>
            </div>
            <div style={{width: "100%", height: "600px", border: "1px solid #d9d9d9", borderRadius: "6px"}}>
              <ChatBox disableInput={false} hideInput={false} messages={this.state.testMessages} sendMessage={(message) => this.sendTestMessage(provider, originalProvider, message, account, (loading) => this.setState({testButtonLoading: loading}), (messages) => this.setState({testMessages: messages}), this.state.testMessages)} account={account} loading={this.state.testButtonLoading}
              />
            </div>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default ModelTestWidget;
