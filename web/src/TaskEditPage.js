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
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as TaskBackend from "./backend/TaskBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as MessageBackend from "./backend/MessageBackend";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

const {Option} = Select;
const {TextArea} = Input;

class TaskEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      taskName: props.match.params.taskName,
      modelProviders: [],
      task: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTask();
    this.getModelProviders();
  }

  getTask() {
    TaskBackend.getTask(this.props.account.name, this.state.taskName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            task: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get task: ${res.msg}`);
        }
      });
  }

  getQuestion() {
    return `${this.state.task.text.replace("{example}", this.state.task.example).replace("{labels}", this.state.task.labels.map(label => `"${label}"`).join(", "))}`;
  }

  getAnswer() {
    const provider = this.state.task.provider;
    const question = this.getQuestion();
    MessageBackend.getAnswer(provider, question)
      .then((res) => {
        if (res.status === "ok") {
          this.updateTaskField("log", res.data);
        } else {
          Setting.showMessage("error", `Failed to get answer: ${res.msg}`);
        }
      });
  }

  getModelProviders() {
    ProviderBackend.getProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            modelProviders: res.data.filter(provider => provider.category === "Model"),
          });
        } else {
          Setting.showMessage("error", `Failed to get providers: ${res.msg}`);
        }
      });
  }

  parseTaskField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateTaskField(key, value) {
    value = this.parseTaskField(key, value);

    const task = this.state.task;
    task[key] = value;
    this.setState({
      task: task,
    });
  }

  renderTask() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("task:Edit Task")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitTaskEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitTaskEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.task.name} onChange={e => {
              this.updateTaskField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.task.displayName} onChange={e => {
              this.updateTaskField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Model provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.task.provider} onChange={(value => {this.updateTaskField("provider", value);})}
              options={this.state.modelProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, `${provider.name}`))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Application")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.task.application} onChange={(value => {this.updateTaskField("application", value);})}>
              {
                [
                  {id: "Docs-Polish", name: "Docs-Polish"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Path")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.task.path} onChange={e => {
              this.updateTaskField("path", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Text")}:
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.task.text} onChange={(e) => {
              this.updateTaskField("text", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Example")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.task.example} onChange={e => {
              this.updateTaskField("example", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Labels")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} mode="tags" style={{width: "100%"}} value={this.state.task.labels} onChange={(value => {this.updateTaskField("labels", value);})}>
              {
                this.state.task.labels?.map((item, index) => <Option key={index} value={item}>{item}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Question")}:
          </Col>
          <Col span={22} >
            <TextArea disabled={true} autoSize={{minRows: 1, maxRows: 15}} value={this.getQuestion()} onChange={(e) => {}} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("task:Log")}:
          </Col>
          <Col span={22} >
            <Button style={{marginBottom: "20px", width: "100px"}} type="primary" onClick={this.runTask.bind(this)}>{i18next.t("general:Run")}</Button>
            <div style={{height: "200px"}}>
              <CodeMirror
                value={this.state.task.log}
                options={{mode: "javascript", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {}}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  runTask() {
    this.getAnswer();
  }

  submitTaskEdit(exitAfterSave) {
    const task = Setting.deepCopy(this.state.task);
    TaskBackend.updateTask(this.state.task.owner, this.state.taskName, task)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              taskName: this.state.task.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/tasks");
            } else {
              this.props.history.push(`/tasks/${this.state.task.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateTaskField("name", this.state.taskName);
          }
        } else {
          Setting.showMessage("error", `failed to save: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `failed to save: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.task !== null ? this.renderTask() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitTaskEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitTaskEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default TaskEditPage;
