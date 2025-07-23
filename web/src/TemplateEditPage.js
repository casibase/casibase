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
import {Button, Card, Col, Divider, Input, Row, Space, Tag} from "antd";
import * as TemplateBackend from "./backend/TemplateBackend";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import moment from "moment/moment";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/yaml/yaml");

const {TextArea} = Input;

class TemplateEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      templateOwner: props.match.params.organizationName,
      templateName: props.match.params.templateName,
      template: null,
      organizations: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
      k8sStatus: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTemplate();
    this.getK8sStatus();
  }

  getTemplate() {
    TemplateBackend.getTemplate(this.props.account.owner, this.state.templateName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            template: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")} : ${res.msg}`);
        }
      });
  }

  getK8sStatus() {
    TemplateBackend.getK8sStatus()
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            k8sStatus: res.data,
          });
        } else {
          Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
        }
      });
  }

  parseTemplateField(key, value) {
    if (["version"].includes(key)) {
      return value;
    }
    return value;
  }

  updateTemplateField(key, value) {
    value = this.parseTemplateField(key, value);

    const template = this.state.template;
    template[key] = value;
    this.setState({
      template: template,
    });
  }

  newApplication() {
    const randomName = Setting.getRandomName();
    return {
      owner: this.props.account.owner,
      name: `app-${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      displayName: `New Application - ${randomName}`,
      description: `Application created from template: ${this.state.template.name}`,
      template: this.state.template.name,
      parameters: "",
    };
  }

  // Application creation method
  addApplicationFromTemplate = () => {
    const newApp = this.newApplication();

    ApplicationBackend.addApplication(newApp)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.props.history.push(`/applications/${newApp.name}`);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  };

  renderTemplate() {
    const {k8sStatus} = this.state;
    const k8sConnected = k8sStatus && k8sStatus.status === "Connected";

    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("general:New Template") : i18next.t("general:Edit Template")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteTemplate()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.template.owner} onChange={e => {
              this.updateTemplateField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.template.name} onChange={e => {
              this.updateTemplateField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.template.displayName} onChange={e => {
              this.updateTemplateField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 5}} value={this.state.template.description} onChange={e => {
              this.updateTemplateField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Version"), i18next.t("general:Version - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.template.version} onChange={e => {
              this.updateTemplateField("version", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Icon"), i18next.t("general:Icon - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.template.icon} onChange={e => {
              this.updateTemplateField("icon", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Manifests"), i18next.t("general:Manifests - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{border: "1px solid #d9d9d9", borderRadius: "6px", overflow: "hidden"}}>
              <CodeMirror
                value={this.state.template.manifests || ""}
                options={{mode: "yaml", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateTemplateField("manifests", value);
                }}
                editorDidMount={(editor) => {
                  // Set editor height for manifests
                  editor.setSize(null, "400px");
                  editor.refresh();
                }}
              />
            </div>
          </Col>
        </Row>
        <Divider />

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel("Kubernetes Status", "Kubernetes connection status")} :
          </Col>
          <Col span={22} >
            <Space>
              <Tag color={k8sConnected ? "success" : "error"}>
                {k8sStatus ? k8sStatus.status : "Loading..."}
              </Tag>
              <Button size="small" onClick={() => this.getK8sStatus()}>
                {i18next.t("general:Refresh Status")}
              </Button>
              {k8sStatus && k8sStatus.message && (
                <span style={{color: "#666", fontSize: "12px"}}>
                  {k8sStatus.message}
                </span>
              )}
            </Space>
          </Col>
        </Row>

        {k8sConnected && this.state.template.manifests && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel("Application Actions")} :
            </Col>
            <Col span={22} >
              <Space>
                <Button type="primary" onClick={this.addApplicationFromTemplate} disabled={!k8sConnected}>
                  {i18next.t("general:Add Application")}
                </Button>
                <Button onClick={() => this.props.history.push("/applications")}>
                  {i18next.t("general:View Applications")}
                </Button>
              </Space>
            </Col>
          </Row>
        )}

        <Divider />
      </Card>
    );
  }

  submitTemplateEdit(willExit) {
    const template = Setting.deepCopy(this.state.template);
    TemplateBackend.updateTemplate(this.state.template.owner, this.state.templateName, template)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              templateName: this.state.template.name,
            });
            if (willExit) {
              this.props.history.push("/templates");
            } else {
              this.props.history.push(`/templates/${encodeURIComponent(this.state.template.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateTemplateField("name", this.state.templateName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteTemplate() {
    TemplateBackend.deleteTemplate(this.state.template)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/templates");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.template !== null ? this.renderTemplate() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteTemplate()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default TemplateEditPage;
