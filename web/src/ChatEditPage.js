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
import {Button, Card, Col, Input, Row, Select, Switch} from "antd";
import * as ChatBackend from "./backend/ChatBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import ChatBox from "./ChatBox";
import {renderText} from "./ChatMessageRender";
import * as MessageBackend from "./backend/MessageBackend";

const {Option} = Select;

class ChatEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      chatName: props.match.params.chatName,
      chat: null,
      messages: null,
      provider: null,
      providers: [],
      // users: [],
      isNewChat: props.location?.state?.isNewChat || false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getChat();
    this.getMessages(this.state.chatName);
    this.getProviders();
    // this.getUser();
  }

  getProviders() {
    ProviderBackend.getProviders("admin")
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            providers: res.data.filter(p => p.category === "Model"),
          });
        }
      });
  }

  getProvider(providerName) {
    if (!providerName) {
      return;
    }
    ProviderBackend.getProvider("admin", providerName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            provider: res.data,
          });
        }
      });
  }

  getChat() {
    ChatBackend.getChat("admin", this.state.chatName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chat: res.data,
          });
          this.getProvider(res.data.modelProvider);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getMessages(chatName) {
    MessageBackend.getChatMessages("admin", chatName)
      .then((res) => {
        res.data.map((message) => {
          message.html = renderText(message.text);
        });
        this.setState({
          messages: res.data,
        });
      });
  }

  parseChatField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateChatField(key, value) {
    value = this.parseChatField(key, value);

    const chat = this.state.chat;
    chat[key] = value;
    this.setState({
      chat: chat,
    });
  }

  renderChat() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("chat:Edit Chat")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitChatEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitChatEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.isNewChat && <Button style={{marginLeft: "20px"}} onClick={() => this.cancelChatEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      } style={(Setting.isMobile()) ? {margin: "5px"} : {}} type="inner">
        {/* <Row style={{marginTop: "10px"}} >*/}
        {/*  <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>*/}
        {/*    {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))}:*/}
        {/*  </Col>*/}
        {/*  <Col span={22} >*/}
        {/*    <Select virtual={false} disabled={!Setting.isAdminUser(this.props.account)} style={{width: "100%"}} value={this.state.chat.organization} onChange={(value => {this.updateChatField("organization", value);})}*/}
        {/*      options={this.state.organizations.map((organization) => Setting.getOption(organization.name, organization.name))*/}
        {/*      } />*/}
        {/*  </Col>*/}
        {/* </Row>*/}
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.chat.name} onChange={e => {
              this.updateChatField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.chat.displayName} onChange={e => {
              this.updateChatField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.chat.type} onChange={(value => {
              this.updateChatField("type", value);
            })}>
              {
                [
                  {id: "Single", name: i18next.t("chat:Single")},
                  {id: "Group", name: i18next.t("chat:Group")},
                  {id: "AI", name: i18next.t("chat:AI")},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.chat.store} onChange={e => {
              this.updateChatField("store", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Model provider"), i18next.t("provider:Model provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.chat.modelProvider}
              onChange={(value) => {
                this.updateChatField("modelProvider", value);
                this.getProvider(value);
              }}
              showSearch
              filterOption={(input, option) =>
                option.children[1].toLowerCase().includes(input.toLowerCase())
              }
            >
              {
                this.state.providers.map((provider, index) => (
                  <Option key={index} value={provider.name}>
                    <img width={20} height={20} style={{marginBottom: "3px", marginRight: "10px"}} src={Setting.getProviderLogoURL({category: provider.category, type: provider.type})} alt={provider.type} />
                    {provider.name}
                  </Option>
                ))
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Category"), i18next.t("provider:Category - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.chat.category} onChange={e => {
              this.updateChatField("category", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:User"), i18next.t("general:User - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.chat.user} onChange={e => {
              this.updateChatField("user", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("chat:User1"), i18next.t("chat:User1 - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.chat.user1} onChange={(value => {this.updateChatField("user1", value);})}
              options={this.state.chat.users.map((user) => Setting.getOption(`${user}`, `${user}`))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("chat:User2"), i18next.t("chat:User2 - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.chat.user2} onChange={(value => {this.updateChatField("user2", value);})}
              options={[{label: "None", value: ""}, ...this.state.chat.users.map((user) => Setting.getOption(`${user}`, `${user}`))]
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Users"), i18next.t("general:Users - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} mode="multiple" style={{width: "100%"}} value={this.state.chat.users}
              onChange={(value => {this.updateChatField("users", value);})}
              options={this.state.chat.users.map((user) => Setting.getOption(`${user}`, `${user}`))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 19 : 2}>
            {Setting.getLabel(i18next.t("general:Is deleted"), i18next.t("general:Is deleted - Tooltip"))} :
          </Col>
          <Col span={1} >
            <Switch checked={this.state.chat.isDeleted} onChange={checked => {
              this.updateChatField("isDeleted", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Messages"), i18next.t("general:Messages - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{width: "50%", height: "800px"}}>
              <ChatBox disableInput={true} hideInput={true} messages={this.state.messages} sendMessage={null} account={this.props.account} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitChatEdit(exitAfterSave) {
    const chat = Setting.deepCopy(this.state.chat);
    ChatBackend.updateChat(this.state.chat.owner, this.state.chatName, chat)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              chatName: this.state.chat.name,
              isNewChat: false,
            });

            if (exitAfterSave) {
              this.props.history.push("/chats");
            } else {
              this.props.history.push(`/chats/${this.state.chat.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateChatField("name", this.state.chatName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  cancelChatEdit() {
    if (this.state.isNewChat) {
      ChatBackend.deleteChat(this.state.chat)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Cancelled successfully"));
            this.props.history.push("/chats");
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${res.msg}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${error}`);
        });
    } else {
      this.props.history.push("/chats");
    }
  }

  render() {
    return (
      <div>
        {
          this.state.chat !== null ? this.renderChat() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitChatEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitChatEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.isNewChat && <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.cancelChatEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      </div>
    );
  }
}

export default ChatEditPage;
