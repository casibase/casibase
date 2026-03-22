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
import {Button, Card, Col, Input, Progress, Row, Select, Space, Spin, Switch, Typography, Upload} from "antd";

const ANALYZE_PROGRESS_DURATION_SEC = 300;
const ANALYZE_PROGRESS_TICK_MS = 500;
const ANALYZE_PROGRESS_MAX_PERCENT = 99;

import {CloseOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, UploadOutlined} from "@ant-design/icons";
import * as TaskBackend from "./backend/TaskBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as MessageBackend from "./backend/MessageBackend";
import Editor from "./common/Editor";
import TaskAnalysisReport from "./TaskAnalysisReport";
import * as Provider from "./Provider";

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
      templates: [],
      task: null,
      analyzing: false,
      analyzeProgress: 0,
      loading: false,
      uploadingDocument: false,
    };
    this.analyzeProgressIntervalId = null;
    this.analyzeStartTime = null;
  }

  componentWillUnmount() {
    if (this.analyzeProgressIntervalId !== null) {
      clearInterval(this.analyzeProgressIntervalId);
    }
  }

  UNSAFE_componentWillMount() {
    this.getTask();
    this.getModelProviders();
    TaskBackend.getTaskTemplates().then((res) => {
      if (res.status === "ok" && res.data) {
        this.setState({templates: res.data});
      }
    });
  }

  normalizeTaskResult(task) {
    if (!task) {
      return task;
    }
    let t = task.isTemplate === undefined || task.isTemplate === null ? {...task, isTemplate: false} : task;
    if (t.isTemplate && (t.state === undefined || t.state === null || t.state === "")) {
      t = {...t, state: "Public"};
    }
    if (!t.result) {
      return t;
    }
    if (typeof t.result === "string") {
      try {
        t = {...t, result: JSON.parse(t.result)};
      } catch {
        t = {...t, result: null};
      }
    }
    return t;
  }

  getTask() {
    TaskBackend.getTask(this.state.owner, this.state.taskName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            task: this.normalizeTaskResult(res.data),
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getEffectiveScale() {
    if (this.state.task.template) {
      const tpl = this.state.templates.find((t) => `${t.owner}/${t.name}` === this.state.task.template);
      return tpl ? (tpl.scale || "") : "";
    }
    return this.state.task.scale || "";
  }

  getQuestion() {
    const scale = this.getEffectiveScale();
    return `${scale.replace("{example}", this.state.task.example).replace("{labels}", this.state.task.labels.map(label => `"${label}"`).join(", "))}`;
  }

  analyzeTask() {
    this.analyzeStartTime = Date.now();
    this.setState({analyzing: true, analyzeProgress: 0});
    const durationMs = ANALYZE_PROGRESS_DURATION_SEC * 1000;
    this.analyzeProgressIntervalId = setInterval(() => {
      const elapsed = Date.now() - this.analyzeStartTime;
      const percent = Math.min(ANALYZE_PROGRESS_MAX_PERCENT, (99 * elapsed) / durationMs);
      this.setState({analyzeProgress: Math.round(percent)});
    }, ANALYZE_PROGRESS_TICK_MS);
    TaskBackend.analyzeTask(this.state.task.owner, this.state.task.name)
      .then((res) => {
        if (res.status === "ok") {
          const task = this.state.task;
          task.result = res.data;
          task.score = res.data.score;
          this.setState({task: task});
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      })
      .catch(err => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${err.message}`);
      })
      .finally(() => {
        if (this.analyzeProgressIntervalId !== null) {
          clearInterval(this.analyzeProgressIntervalId);
          this.analyzeProgressIntervalId = null;
        }
        this.setState({analyzeProgress: 100}, () => {
          setTimeout(() => {
            this.setState({analyzing: false, analyzeProgress: 0});
          }, 400);
        });
      });
  }

  clearReport = () => {
    const task = this.state.task;
    task.result = null;
    task.score = 0;
    this.setState({task: task});
  };

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

  clearDocument = () => {
    const task = this.state.task;
    task.documentUrl = "";
    task.documentText = "";
    this.setState({task: task});
  };

  getDocumentFileName() {
    const url = this.state.task?.documentUrl || "";
    try {
      const path = new URL(url).pathname || url;
      const encoded = path.split("/").filter(Boolean).pop() || url;
      try {
        return decodeURIComponent(encoded);
      } catch {
        return encoded;
      }
    } catch {
      return url;
    }
  }

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
        <Row style={{marginTop: "10px"}} gutter={16}>
          <Col style={{marginTop: "5px"}} span={Setting.isAdminUser(this.props.account) ? 8 : 24}>
            <div>{Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :</div>
            <Input value={this.state.task.name} onChange={e => {
              this.updateTaskField("name", e.target.value);
            }} />
          </Col>
          {Setting.isAdminUser(this.props.account) ? (
            <>
              <Col style={{marginTop: "5px"}} span={8}>
                <div>{Setting.getLabel(i18next.t("provider:Model provider"), i18next.t("provider:Model provider - Tooltip"))} :</div>
                <Select
                  virtual={false}
                  style={{width: "100%"}}
                  value={this.state.task.provider}
                  onChange={(value) => this.updateTaskField("provider", value)}
                  options={this.state.modelProviders.map((p) => ({
                    value: p.name,
                    label: (
                      <span style={{display: "inline-flex", alignItems: "center", gap: 8}}>
                        <Provider.ProviderLogo provider={p} width={20} height={20} />
                        <span>{p.displayName} ({p.name})</span>
                      </span>
                    ),
                  }))}
                />
              </Col>
              <Col style={{marginTop: "5px"}} span={8}>
                <div>{Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :</div>
                <Select virtual={false} style={{width: "100%"}} value={this.state.task.type} onChange={(value => {this.updateTaskField("type", value);})}>
                  {
                    [
                      {id: "Labeling", name: "Labeling"},
                      {id: "PBL", name: "PBL"},
                    ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                  }
                </Select>
              </Col>
            </>
          ) : null}
        </Row>
        {
          Setting.isAdminUser(this.props.account) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("task:Is template"), i18next.t("task:Is template - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Switch
                  checked={!!this.state.task.isTemplate}
                  onChange={(checked) => {
                    const task = {...this.state.task, isTemplate: checked};
                    if (checked) {
                      task.template = "";
                      task.state = "Public";
                    } else {
                      task.state = "";
                    }
                    this.setState({task});
                  }}
                />
              </Col>
            </Row>
          ) : null
        }
        {
          Setting.isAdminUser(this.props.account) && this.state.task.isTemplate ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Select
                  virtual={false}
                  style={{width: "100%"}}
                  value={this.state.task.state || "Public"}
                  onChange={(value) => this.updateTaskField("state", value)}
                  options={[
                    {value: "Public", label: i18next.t("video:Public")},
                    {value: "Hidden", label: i18next.t("video:Hidden")},
                  ]}
                />
              </Col>
            </Row>
          ) : null
        }
        {
          (this.state.task.type === "Labeling" || Setting.isAdminUser(this.props.account)) ? (
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
          ) : null
        }
        {
          !this.state.task.isTemplate && (Setting.isAdminUser(this.props.account) || this.state.templates.length > 0) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Template"), i18next.t("general:Template - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Select
                  virtual={false}
                  style={{width: "100%"}}
                  placeholder={i18next.t("general:None")}
                  allowClear
                  value={this.state.task.template ?? ""}
                  onChange={(value) => this.updateTaskField("template", value || "")}
                  options={[
                    {value: "", label: i18next.t("general:None")},
                    ...this.state.templates.map((t) => ({value: `${t.owner}/${t.name}`, label: t.displayName ? `${t.displayName} (${t.owner}/${t.name})` : `${t.owner}/${t.name}`})),
                  ]}
                />
              </Col>
            </Row>
          ) : null
        }
        {
          Setting.isAdminUser(this.props.account) ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("task:Scale"), i18next.t("task:Scale - Tooltip"))} :
              </Col>
              <Col span={22} >
                <TextArea
                  rows={5}
                  style={{maxHeight: "120px", overflow: "auto"}}
                  value={this.getEffectiveScale()}
                  disabled={!!this.state.task.template}
                  onChange={this.state.task.template ? undefined : (e) => this.updateTaskField("scale", e.target.value)}
                />
              </Col>
            </Row>
          ) : null
        }
        {
          this.state.task.isTemplate ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("store:File"), i18next.t("store:File - Tooltip"))} :
              </Col>
              <Col span={22}>
                {this.state.task.documentUrl ? (
                  <Card size="small" style={{maxWidth: 560}}>
                    <Space align="center">
                      <span style={{fontSize: 28, color: this.state.task.documentUrl.endsWith(".pdf") ? "#cf1322" : "#1890ff"}}>
                        {this.state.task.documentUrl.endsWith(".pdf") ? <FilePdfOutlined /> : <FileWordOutlined />}
                      </span>
                      <Typography.Text ellipsis style={{maxWidth: 420}}>{this.getDocumentFileName()}</Typography.Text>
                      <Button type="link" size="small" icon={<DownloadOutlined />} href={this.state.task.documentUrl} target="_blank" rel="noopener noreferrer">
                        {i18next.t("general:Download")}
                      </Button>
                      <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={this.clearDocument} aria-label={i18next.t("general:Delete")} />
                    </Space>
                  </Card>
                ) : (
                  <Upload
                    name="file"
                    accept=".docx,.pdf"
                    showUploadList={false}
                    customRequest={this.handleDocumentUpload}
                  >
                    <Button type="primary" icon={<UploadOutlined />} loading={this.state.uploadingDocument}>
                      {i18next.t("store:Upload file")} (.docx, .pdf)
                    </Button>
                  </Upload>
                )}
              </Col>
            </Row>
          )
        }
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
          (this.state.task.type !== "Labeling") && this.state.task.documentUrl && !this.state.task.isTemplate ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("task:Report"), i18next.t("task:Report - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Button
                  loading={this.state.analyzing}
                  disabled={!this.state.task.documentText || !!this.state.task.result}
                  style={{marginBottom: "20px", width: "200px"}}
                  type="primary"
                  onClick={() => this.analyzeTask()}
                >
                  {i18next.t("task:Analyze")}
                </Button>
                {Setting.isAdminUser(this.props.account) && this.state.task.result ? (
                  <Button
                    style={{marginBottom: "20px", marginLeft: "8px", width: "200px"}}
                    onClick={this.clearReport}
                  >
                    {i18next.t("general:Clear")}
                  </Button>
                ) : null}
                {this.state.analyzing && (
                  <>
                    <div style={{maxWidth: "400px", marginTop: "8px", marginBottom: "8px"}}>
                      <Progress percent={this.state.analyzeProgress} status="active" />
                    </div>
                    <Spin style={{marginLeft: "16px"}} tip={i18next.t("task:Analyzing")} />
                  </>
                )}
                {this.state.task.result && (
                  <TaskAnalysisReport
                    result={this.state.task.result}
                    downloadFileName={`${this.state.task.owner}_${this.state.task.name}_report.docx`}
                  />
                )}
              </Col>
            </Row>
          ) : this.state.task.type === "Labeling" && !this.state.task.isTemplate ? (
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
          ) : null
        }
      </Card>
    );
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
    if (task.result && typeof task.result === "object") {
      task.result = JSON.stringify(task.result);
    }
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
