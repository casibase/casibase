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
import {Button, Card, Col, Divider, Input, Row, Select, Space, Tag} from "antd";
import {Controlled as CodeMirror} from "react-codemirror2";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as TemplateBackend from "./backend/TemplateBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

import {getYAMLEditorOptions} from "./CodeMirrorConfig";

const {TextArea} = Input;

class ApplicationEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      applicationOwner: props.match.params.organizationName,
      applicationName: props.match.params.applicationName,
      application: null,
      templates: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
      deploymentStatus: null,
      isDeploying: false,
      isDeleting: false,
      k8sStatus: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getApplication();
    this.getTemplates();
    this.getDeploymentStatus();
    this.getK8sStatus();
  }

  getApplication() {
    ApplicationBackend.getApplication(this.props.account.owner, this.state.applicationName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            application: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")} : ${res.msg}`);
        }
      });
  }

  getTemplates() {
    TemplateBackend.getTemplates(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            templates: res.data || [],
          });
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

  getDeploymentStatus() {
    return ApplicationBackend.getApplicationStatus(`${this.props.account.owner}/${this.state.applicationName}`)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            deploymentStatus: res.data,
          });
        }
        return res;
      })
      .catch(error => {
        return {status: "error", msg: error.toString()};
      });
  }

  parseApplicationField(key, value) {
    if (["parameters"].includes(key)) {
      return value;
    }
    return value;
  }

  updateApplicationField(key, value) {
    value = this.parseApplicationField(key, value);

    const application = this.state.application;
    application[key] = value;
    this.setState({
      application: application,
    });
  }

  deployApplication() {
    if (!this.state.application.template) {
      Setting.showMessage("error", "Please select a template");
      return;
    }

    this.setState({isDeploying: true});

    const deploymentData = {
      owner: this.state.application.owner,
      name: this.state.application.name,
      template: this.state.application.template,
      parameters: this.state.application.parameters,
    };

    ApplicationBackend.deployApplication(deploymentData)
      .then((res) => {
        this.setState({isDeploying: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deployed"));
          this.setState({
            deploymentStatus: {status: "Pending", message: "Deployment in progress..."},
          });
          // Update application status
          this.updateApplicationField("status", "Pending");
          this.updateApplicationField("message", "Deployment in progress...");

          setTimeout(() => {
            this.getDeploymentStatus();
            this.pollDeploymentStatus();
          }, 1000);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${res.msg}`);
        }
      })
      .catch(error => {
        this.setState({isDeploying: false});
        Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${error}`);
      });
  }

  pollDeploymentStatus(maxAttempts = 10, interval = 3000) {
    let attempts = 0;

    const poll = () => {
      if (attempts >= maxAttempts) {
        return;
      }

      attempts++;
      this.getDeploymentStatus().then(() => {
        const status = this.state.deploymentStatus?.status;
        if (status === "Pending" && attempts < maxAttempts) {
          setTimeout(poll, interval);
        }
      });
    };

    setTimeout(poll, interval);
  }

  deleteDeployment() {
    this.setState({isDeleting: true});

    const deploymentData = {
      owner: this.state.application.owner,
      name: this.state.application.name,
    };

    ApplicationBackend.undeployApplication(deploymentData)
      .then((res) => {
        this.setState({isDeleting: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            deploymentStatus: {status: "Not Deployed", message: "Deployment deleted"},
          });
          // Update application status
          this.updateApplicationField("status", "Not Deployed");
          this.updateApplicationField("message", "Deployment deleted");

          setTimeout(() => {
            this.getDeploymentStatus();
          }, 2000);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        this.setState({isDeleting: false});
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderStatusTag(status) {
    const colorMap = {
      "Running": "success",
      "Pending": "processing",
      "Failed": "error",
      "Not Deployed": "default",
      "Unknown": "warning",
    };

    return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
  }

  renderDeploymentStatus() {
    const {deploymentStatus} = this.state;

    if (!deploymentStatus) {
      return <Tag color="default">Loading...</Tag>;
    }

    return (
      <div>
        {this.renderStatusTag(deploymentStatus.status)}
        {deploymentStatus.message && (
          <span style={{marginLeft: 8, color: "#666", fontSize: "12px"}}>
            {deploymentStatus.message}
          </span>
        )}
      </div>
    );
  }

  // CodeMirror configuration for YAML editing
  getCodeMirrorOptions() {
    return getYAMLEditorOptions();
  }

  renderApplication() {
    const {deploymentStatus, isDeploying, isDeleting, k8sStatus} = this.state;
    const isDeployed = deploymentStatus && deploymentStatus.status !== "Not Deployed" && deploymentStatus.status !== "Unknown";
    const k8sConnected = k8sStatus && k8sStatus.status === "Connected";

    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("general:New Application") : i18next.t("general:Edit Application")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitApplicationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitApplicationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteApplication()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.application.owner} onChange={e => {
              this.updateApplicationField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.application.name} onChange={e => {
              this.updateApplicationField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.application.displayName} onChange={e => {
              this.updateApplicationField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 5}} value={this.state.application.description} onChange={e => {
              this.updateApplicationField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel("Template", "Template to use for deployment")} :
          </Col>
          <Col span={22} >
            <Select
              style={{width: "100%"}}
              value={this.state.application.template}
              onChange={value => {
                this.updateApplicationField("template", value);
              }}
              placeholder="Select a template"
            >
              {this.state.templates.map(template => (
                <Select.Option key={template.name} value={template.name}>
                  {template.displayName || template.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel("Parameters", "Deployment parameters in YAML/JSON format")} :
          </Col>
          <Col span={22} >
            <div style={{border: "1px solid #d9d9d9", borderRadius: "6px", overflow: "hidden"}}>
              <CodeMirror
                value={this.state.application.parameters || ""}
                options={this.getCodeMirrorOptions()}
                onBeforeChange={(editor, data, value) => {
                  this.updateApplicationField("parameters", value);
                }}
                editorDidMount={(editor) => {
                  // Set editor height and enable word wrap
                  editor.setSize(null, "300px");
                  editor.refresh();
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel("Namespace", "Kubernetes namespace")} :
          </Col>
          <Col span={22} >
            <Input value={this.state.application.namespace} disabled />
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
              {k8sStatus && k8sStatus.message && (
                <span style={{color: "#666", fontSize: "12px"}}>
                  {k8sStatus.message}
                </span>
              )}
              <Button size="small" onClick={() => this.getK8sStatus()}>
                {i18next.t("general:Refresh Status")}
              </Button>
            </Space>
          </Col>
        </Row>

        {k8sConnected && (
          <>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel("Deployment Status", "Current deployment status")} :
              </Col>
              <Col span={22} >
                <Space>
                  {this.renderDeploymentStatus()}
                  <Button size="small" onClick={() => this.getDeploymentStatus()}>
                    {i18next.t("general:Refresh Status")}
                  </Button>
                </Space>
              </Col>
            </Row>

            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel("Deployment Actions", "Deploy or delete the application")} :
              </Col>
              <Col span={22} >
                <Space>
                  <Button type="primary" loading={isDeploying} disabled={isDeleting || !k8sConnected || !this.state.application.template} onClick={() => this.deployApplication()}>
                    {isDeployed ? i18next.t("general:Redeploy") : i18next.t("general:Deploy")}
                  </Button>
                  {isDeployed && (
                    <Button danger loading={isDeleting} disabled={isDeploying || !k8sConnected} onClick={() => this.deleteDeployment()}>
                      {i18next.t("general:Undeploy")}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </>
        )}

        <Divider />
      </Card>
    );
  }

  submitApplicationEdit(willExit) {
    const application = Setting.deepCopy(this.state.application);
    ApplicationBackend.updateApplication(this.state.application.owner, this.state.applicationName, application)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              applicationName: this.state.application.name,
            });
            if (willExit) {
              this.props.history.push("/applications");
            } else {
              this.props.history.push(`/applications/${encodeURIComponent(this.state.application.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateApplicationField("name", this.state.applicationName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteApplication() {
    ApplicationBackend.deleteApplication(this.state.application)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/applications");
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
          this.state.application !== null ? this.renderApplication() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitApplicationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitApplicationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteApplication()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default ApplicationEditPage;
