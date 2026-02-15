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
import {Button, Card, Col, Input, Row, Select, Upload} from "antd";
import {FilePdfOutlined, FileWordOutlined, UploadOutlined} from "@ant-design/icons";
import * as TaskBackend from "./backend/TaskBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as MessageBackend from "./backend/MessageBackend";
import ChatPage from "./ChatPage";
import * as ConfTask from "./ConfTask";
import Editor from "./common/Editor";

const {Option} = Select;
const {TextArea} = Input;

class TaskEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      taskName: props.match.params.taskName,
      isNewTask: props.location?.state?.isNewTask || false,
      modelProviders: [],
      task: null,
      chatPageObj: null,
      loading: false,
      uploadingDocument: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTask();
    this.getModelProviders();
  }

  getTask() {
    TaskBackend.getTask(this.state.owner, this.state.taskName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            task: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getQuestion() {
    return `${this.state.task.text.replace("{example}", this.state.task.example).replace("{labels}", this.state.task.labels.map(label => `"${label}"`).join(", "))}`;
  }

  getAnswer() {
    const provider = this.state.task.provider;
    const question = this.getQuestion();
    const framework = this.state.task.name;
    const video = "";
    MessageBackend.getAnswer(provider, question, framework, video)
      .then((res) => {
        if (res.status === "ok") {
          this.updateTaskField("log", res.data);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }

        this.setState({
          loading: false,
        });
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
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
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

  fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  handleDocumentUpload = async({file}) => {
    this.setState({uploadingDocument: true});

    const base64Data = await this.fileToBase64(file);
    const taskId = `${this.state.task.owner}/${this.state.task.name}`;

    TaskBackend.uploadTaskDocument(taskId, base64Data, file.name, file.type)
      .then((res) => {
        if (res.status === "ok") {
          const result = res.data;
          // Update both fields in a single setState to avoid race conditions
          const task = this.state.task;
          task.documentUrl = result.url;
          task.documentText = result.text;
          this.setState({task: task});

          Setting.showMessage("success", i18next.t("general:Successfully uploaded"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to upload")}: ${res.msg}`);
        }
      })
      .catch(err => {
        Setting.showMessage("error", `${i18next.t("general:Failed to upload")}: ${err.message}`);
      })
      .finally(() => {
        this.setState({uploadingDocument: false});
      });
  };

  renderTask() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("task:Edit Task")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitTaskEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitTaskEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.isNewTask && <Button style={{marginLeft: "20px"}} onClick={() => this.cancelTaskEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.task.name} onChange={e => {
              this.updateTaskField("name", e.target.value);
            }} />
          </Col>
        </Row>
        {
          this.state.task.type !== "Labeling" ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Input value={this.state.task.displayName} onChange={e => {
                  this.updateTaskField("displayName", e.target.value);
                }} />
              </Col>
            </Row>
          )
        }
        {
          // Show Model provider field only for admin users who are NOT task-users
          (this.props.account.name === "admin" && !Setting.isTaskUser(this.props.account)) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("provider:Model provider"), i18next.t("provider:Model provider - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Select virtual={false} style={{width: "100%"}} value={this.state.task.provider} onChange={(value => {this.updateTaskField("provider", value);})}
                  options={this.state.modelProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, `${provider.name}`))
                  } />
              </Col>
            </Row>
          ) : null
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.task.type} onChange={(value => {this.updateTaskField("type", value);})}>
              {
                [
                  {id: "Labeling", name: "Labeling"},
                  {id: "PBL", name: "PBL"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        {
          this.state.task.type === "Labeling" ? null : (
            <React.Fragment>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("store:Subject"), i18next.t("store:Subject - Tooltip"))} :
                </Col>
                <Col span={3} >
                  {ConfTask.SubjectOptions.length > 0 ? (
                    <Select virtual={false} style={{width: "100%"}} value={this.state.task.subject} onChange={(value => {this.updateTaskField("subject", value);})}>
                      {
                        ConfTask.SubjectOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                      }
                    </Select>
                  ) : (
                    <Input value={this.state.task.subject} onChange={e => {
                      this.updateTaskField("subject", e.target.value);
                    }} />
                  )}
                </Col>
                <Col span={2} />
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("video:Topic"), i18next.t("video:Topic - Tooltip"))} :
                </Col>
                <Col span={3} >
                  {ConfTask.TopicOptions.length > 0 ? (
                    <Select virtual={false} style={{width: "100%"}} value={this.state.task.topic} onChange={(value => {this.updateTaskField("topic", value);})}>
                      {
                        ConfTask.TopicOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                      }
                    </Select>
                  ) : (
                    <Input value={this.state.task.topic} onChange={e => {
                      this.updateTaskField("topic", e.target.value);
                    }} />
                  )}
                </Col>
                <Col span={2} />
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("video:Grade"), i18next.t("video:Grade - Tooltip"))} :
                </Col>
                <Col span={3} >
                  {ConfTask.GradeOptions.length > 0 ? (
                    <Select virtual={false} style={{width: "100%"}} value={this.state.task.grade} onChange={(value => {this.updateTaskField("grade", value);})}>
                      {
                        ConfTask.GradeOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                      }
                    </Select>
                  ) : (
                    <Input value={this.state.task.grade} onChange={e => {
                      this.updateTaskField("grade", e.target.value);
                    }} />
                  )}
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("general:Result"), i18next.t("general:Result - Tooltip"))} :
                </Col>
                <Col span={22} >
                  {ConfTask.ResultOptions.length > 0 ? (
                    <Select virtual={false} style={{width: "100%"}} value={this.state.task.result} onChange={(value => {this.updateTaskField("result", value);})}>
                      {
                        ConfTask.ResultOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                      }
                    </Select>
                  ) : (
                    <Input value={this.state.task.result} onChange={e => {
                      this.updateTaskField("result", e.target.value);
                    }} />
                  )}
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("task:Activity"), i18next.t("task:Activity - Tooltip"))} :
                </Col>
                <Col span={22} >
                  {ConfTask.ActivityOptions.length > 0 ? (
                    <Select virtual={false} style={{width: "100%"}} value={this.state.task.activity} onChange={(value => {this.updateTaskField("activity", value);})}>
                      {
                        ConfTask.ActivityOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                      }
                    </Select>
                  ) : (
                    <Input value={this.state.task.activity} onChange={e => {
                      this.updateTaskField("activity", e.target.value);
                    }} />
                  )}
                </Col>
              </Row>
            </React.Fragment>
          )
        }
        {
          // Show Text field only for non-task-user users
          !Setting.isTaskUser(this.props.account) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Text"), i18next.t("general:Text - Tooltip"))} :
              </Col>
              <Col span={22} >
                <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.task.text} onChange={(e) => {
                  this.updateTaskField("text", e.target.value);
                }} />
              </Col>
            </Row>
          ) : null
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("store:File"), i18next.t("store:File - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              value={this.state.task.documentUrl}
              onChange={e => {
                this.updateTaskField("documentUrl", e.target.value);
              }}
              addonAfter={
                this.state.task.documentUrl && (
                  <a href={this.state.task.documentUrl} target="_blank" rel="noopener noreferrer">
                    {this.state.task.documentUrl.endsWith(".pdf") ? <FilePdfOutlined /> : <FileWordOutlined />}
                  </a>
                )
              }
            />
            <Upload
              name="file"
              accept=".docx,.pdf"
              showUploadList={false}
              customRequest={this.handleDocumentUpload}
              style={{marginTop: "10px"}}
            >
              <Button icon={<UploadOutlined />} loading={this.state.uploadingDocument} style={{marginTop: "10px"}}>
                {i18next.t("store:Upload file")} (.docx, .pdf)
              </Button>
            </Upload>
          </Col>
        </Row>
        {
          (this.state.task.type !== "Labeling") ? null : (
            <React.Fragment>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("task:Example"), i18next.t("task:Example - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Input value={this.state.task.example} onChange={e => {
                    this.updateTaskField("example", e.target.value);
                  }} />
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("task:Labels"), i18next.t("task:Labels - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Select virtual={false} mode="tags" style={{width: "100%"}} value={this.state.task.labels} onChange={(value => {this.updateTaskField("labels", value);})}>
                    {
                      this.state.task.labels?.map((item, index) => <Option key={index} value={item}>{item}</Option>)
                    }
                  </Select>
                </Col>
              </Row>
            </React.Fragment>
          )
        }
        {
          // Show Question field only for non-task-user users
          !Setting.isTaskUser(this.props.account) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("task:Question"), i18next.t("task:Question - Tooltip"))} :
              </Col>
              <Col span={22} >
                <TextArea disabled={true} autoSize={{minRows: 1, maxRows: 15}} value={(this.state.task.type !== "Labeling") ? this.getProjectText() : this.getQuestion()} onChange={(e) => {}} />
              </Col>
            </Row>
          ) : null
        }
        {
          (this.state.task.type !== "Labeling") ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Chat"), i18next.t("general:Chat - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Button disabled={this.state.task.subject === "" && this.state.task.topic === "" && this.state.task.result === "" && this.state.task.activity === "" && this.state.task.grade === ""} style={{marginBottom: "20px", width: "200px"}} type="primary" onClick={() => this.generateProject()}>{i18next.t("task:Analyze")}</Button>
                <ChatPage onCreateChatPage={(chatPageObj) => {this.setState({chatPageObj: chatPageObj});}} account={this.props.account} />
              </Col>
            </Row>
          ) : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("task:Log"), i18next.t("task:Log - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Button loading={this.state.loading} style={{marginBottom: "20px", width: "100px"}} type="primary" onClick={this.runTask.bind(this)}>{i18next.t("general:Run")}</Button>
                <div style={{height: "200px"}}>
                  <Editor
                    value={this.state.task.log}
                    lang="js"
                    fillHeight
                    dark
                    onChange={value => {
                      this.updateTaskField("log", value);
                    }}
                  />
                </div>
              </Col>
            </Row>
          )
        }
      </Card>
    );
  }

  getProjectText() {
    let text = this.state.task.text;
    text = text.replaceAll("${document}", this.state.task.documentText);
    text = text.replaceAll("${subject}", this.state.task.subject);
    text = text.replaceAll("${topic}", this.state.task.topic);
    text = text.replaceAll("${grade}", this.state.task.grade);
    text = text.replaceAll("${result}", this.state.task.result);
    text = text.replaceAll("${activity}", this.state.task.activity);
    return text;
  }

  generateProject() {
    const text = this.getProjectText();
    this.state.chatPageObj.sendMessage(text, "", true);
  }

  runTask() {
    this.updateTaskField("log", "");
    this.setState({
      loading: true,
    });
    this.getAnswer();
  }

  submitTaskEdit(exitAfterSave) {
    const task = Setting.deepCopy(this.state.task);
    TaskBackend.updateTask(this.state.task.owner, this.state.taskName, task)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              taskName: this.state.task.name,
              isNewTask: false,
            });
            if (exitAfterSave) {
              this.props.history.push("/tasks");
            } else {
              this.props.history.push(`/tasks/${this.state.task.owner}/${this.state.task.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateTaskField("name", this.state.taskName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
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
          {this.state.isNewTask && <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.cancelTaskEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      </div>
    );
  }
  cancelTaskEdit() {
    if (this.state.isNewTask) {
      TaskBackend.deleteTask(this.state.task)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Cancelled successfully"));
            this.props.history.push("/tasks");
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${res.msg}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${error}`);
        });
    } else {
      this.props.history.push("/tasks");
    }
  }

}

export default TaskEditPage;
