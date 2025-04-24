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
import i18next from "i18next";
import * as Setting from "./Setting";
import * as MessageBackend from "./backend/MessageBackend";
import * as ChatBackend from "./backend/ChatBackend";

const {TextArea} = Input;

class MessageEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      messageName: props.match.params.messageName,
      messages: [],
      message: null,
      chats: [],
      // users: [],
      chat: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getMessage();
    this.getMessages();
    this.getChats();
  }

  getChats() {
    ChatBackend.getChats(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chats: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getChat(chatName) {
    ChatBackend.getChat("admin", chatName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            chat: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getMessage() {
    MessageBackend.getMessage("admin", this.state.messageName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            message: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getMessages() {
    MessageBackend.getMessages(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            messages: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseMessageField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateMessageField(key, value) {
    value = this.parseMessageField(key, value);

    const message = this.state.message;
    message[key] = value;
    this.setState({
      message: message,
    });
  }

  renderMessage() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("message:Edit Message")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitMessageEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitMessageEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
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
        <Row style={{marginTop: "10px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.message.name}
              onChange={(e) => {
                this.updateMessageField("name", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:User")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.message.user} onChange={e => {
              this.updateMessageField("user", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Chat")}:
          </Col>
          <Col span={22}>
            <Button onClick={() => this.props.history.push(`/chats/${this.state.message.chat}`)} >
              {this.state.message.chat}
            </Button>
            {/* <Select*/}
            {/*  virtual={false}*/}
            {/*  style={{width: "100%"}}*/}
            {/*  value={this.state.message.chat}*/}
            {/*  onChange={(value) => {*/}
            {/*    this.updateMessageField("chat", value);*/}
            {/*    this.getChat(value);*/}
            {/*  }}*/}
            {/*  options={this.state.chats.map((chat) =>*/}
            {/*    Setting.getOption(chat.name, chat.name)*/}
            {/*  )}*/}
            {/* />*/}
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Author")}:
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.message.author}
              onChange={(value) => {
                this.updateMessageField("author", value);
              }}
              options={
                this.state.chat !== null
                  ? this.state.chat.users.map((user) =>
                    Setting.getOption(`${user}`, `${user}`)
                  )
                  : []
              }
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Reply to")}:
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.message.replyTo}
              onChange={(value) => {
                this.updateMessageField("replyTo", value);
              }}
              options={
                this.state.messages !== null
                  ? this.state.messages.map((message) =>
                    Setting.getOption(`${message.name}`, `${message.name}`)
                  )
                  : []
              }
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("general:Reasoning text")}:
          </Col>
          <Col span={22}>
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.message.reasonText} onChange={(e) => {
              this.updateMessageField("reasonText", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("general:Text")}:
          </Col>
          <Col span={22}>
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.message.text} onChange={(e) => {
              this.updateMessageField("text", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Error text")}:
          </Col>
          <Col span={22}>
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.message.errorText} onChange={(e) => {
              this.updateMessageField("errorText", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Comment")}:
          </Col>
          <Col span={22}>
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.message.comment} onChange={(e) => {
              if (e.target.value !== "") {
                this.updateMessageField("needNotify", true);
              } else {
                this.updateMessageField("needNotify", false);
              }

              this.updateMessageField("comment", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={2}>
            {i18next.t("message:Need notify")}:
          </Col>
          <Col span={1} >
            <Switch checked={this.state.message.needNotify} onChange={checked => {
              this.updateMessageField("needNotify", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 19 : 2}>
            {i18next.t("general:Is deleted")}:
          </Col>
          <Col span={1} >
            <Switch checked={this.state.message.isDeleted} onChange={checked => {
              this.updateMessageField("isDeleted", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 19 : 2}>
            {i18next.t("general:Is alerted")}:
          </Col>
          <Col span={1} >
            <Switch checked={this.state.message.isAlerted} onChange={checked => {
              this.updateMessageField("isAlerted", checked);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitMessageEdit(exitAfterSave) {
    const message = Setting.deepCopy(this.state.message);
    MessageBackend.updateMessage(this.state.message.owner, this.state.messageName, message)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              messageName: this.state.message.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/messages");
            } else {
              this.props.history.push(`/messages/${this.state.message.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateMessageField("name", this.state.messageName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {this.state.message !== null ? this.renderMessage() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitMessageEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitMessageEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default MessageEditPage;
