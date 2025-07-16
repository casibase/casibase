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
import * as ApplicationTemplateBackend from "./backend/ApplicationTemplateBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {TextArea} = Input;

class ApplicationTemplateEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      applicationTemplateOwner: props.match.params.organizationName,
      applicationTemplateName: props.match.params.templateName,
      applicationTemplate: null,
      organizations: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
      deploymentStatus: null,
      isDeploying: false,
      isDeleting: false,
      k8sConfig: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getApplicationTemplate();
    this.getDeploymentStatus();
    this.getK8sConfig();
  }

  getApplicationTemplate() {
    ApplicationTemplateBackend.getApplicationTemplate(this.props.account.owner, this.state.applicationTemplateName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            applicationTemplate: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")} : ${res.msg}`);
        }
      });
  }

  getK8sConfig() {
    ApplicationTemplateBackend.getK8sConfig()
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            k8sConfig: res.data,
          });
        }
      });
  }

  testK8sConnection() {
    ApplicationTemplateBackend.testK8sConnection()
      .then((res) => {
        if (res.status === "ok") {
          if (res.data.status === "Connected") {
            Setting.showMessage("success", "K8s connection successful");
          } else {
            Setting.showMessage("error", `K8s connection failed: ${res.data.message}`);
          }
          this.getK8sConfig(); // Refresh config to update connection status
        } else {
          Setting.showMessage("error", `K8s connection test failed: ${res.msg}`);
        }
      });
  }

  getDeploymentStatus() {
    return ApplicationTemplateBackend.getDeploymentStatus(this.props.account.owner, this.state.applicationTemplateName)
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

  parseApplicationTemplateField(key, value) {
    if (["version"].includes(key)) {
      return value;
    }
    return value;
  }

  updateApplicationTemplateField(key, value) {
    value = this.parseApplicationTemplateField(key, value);

    const applicationTemplate = this.state.applicationTemplate;
    applicationTemplate[key] = value;
    this.setState({
      applicationTemplate: applicationTemplate,
    });
  }

  deployApplicationTemplate() {
    if (!this.state.applicationTemplate.manifests) {
      Setting.showMessage("error", i18next.t("general:Please provide manifests content"));
      return;
    }

    this.setState({isDeploying: true});

    const deploymentData = {
      owner: this.state.applicationTemplate.owner,
      name: this.state.applicationTemplate.name,
      manifests: this.state.applicationTemplate.manifests,
    };

    ApplicationTemplateBackend.deployApplicationTemplate(deploymentData)
      .then((res) => {
        this.setState({isDeploying: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deployed"));
          this.setState({
            deploymentStatus: {status: "Pending", message: "Deployment in progress..."},
          });
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
      owner: this.state.applicationTemplate.owner,
      name: this.state.applicationTemplate.name,
    };

    ApplicationTemplateBackend.deleteDeployment(deploymentData)
      .then((res) => {
        this.setState({isDeleting: false});
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          this.setState({
            deploymentStatus: {status: "Not Deployed", message: "Deployment deleted"},
          });
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

  renderDeploymentStatus() {
    const {deploymentStatus} = this.state;

    if (!deploymentStatus) {
      return <Tag color="default">Loading...</Tag>;
    }

    return (
      <div>
        {deploymentStatus.message && (
          <span style={{marginLeft: 8, color: "#666", fontSize: "12px"}}>
            {deploymentStatus.message}
          </span>
        )}
      </div>
    );
  }

  renderApplicationTemplate() {
    const {deploymentStatus, isDeploying, isDeleting, k8sConfig} = this.state;
    const isDeployed = deploymentStatus && deploymentStatus.status !== "Not Deployed" && deploymentStatus.status !== "Unknown";
    const k8sEnabled = k8sConfig && k8sConfig.enabled;
    const k8sConnected = k8sConfig && k8sConfig.connected;

    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("general:New Application Template") : i18next.t("general:Edit Application Template")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitApplicationTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitApplicationTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteApplicationTemplate()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.applicationTemplate.owner} onChange={e => {
              this.updateApplicationTemplateField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.applicationTemplate.name} onChange={e => {
              this.updateApplicationTemplateField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.applicationTemplate.displayName} onChange={e => {
              this.updateApplicationTemplateField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea value={this.state.applicationTemplate.description} onChange={e => {
              this.updateApplicationTemplateField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Version"), i18next.t("general:Version - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.applicationTemplate.version} onChange={e => {
              this.updateApplicationTemplateField("version", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Icon"), i18next.t("general:Icon - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.applicationTemplate.icon} onChange={e => {
              this.updateApplicationTemplateField("icon", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Manifests"), i18next.t("general:Manifests - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea
              rows={10}
              value={this.state.applicationTemplate.manifests || ""}
              placeholder="Enter Kubernetes manifests (YAML format)"
              onChange={e => {
                this.updateApplicationTemplateField("manifests", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Divider />

        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel("Kubernetes Config", "Kubernetes configuration status")} :
          </Col>
          <Col span={22} >
            <Space>
              <Tag color={k8sEnabled ? "success" : "default"}>
                {k8sEnabled ? "Enabled" : "Disabled"}
              </Tag>
              {k8sEnabled && (
                <Tag color={k8sConnected ? "success" : "error"}>
                  {k8sConnected ? "Connected" : "Disconnected"}
                </Tag>
              )}
              {k8sEnabled && (
                <Button size="small" onClick={() => this.testK8sConnection()}>
                      Test Connection
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {k8sEnabled && (
          <>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel("Deployment Status", "Current deployment status")} :
              </Col>
              <Col span={22} >
                {this.renderDeploymentStatus()}
              </Col>
            </Row>

            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel("Deployment Actions", "Deploy or delete the application")} :
              </Col>
              <Col span={22} >
                <Space>
                  <Button
                    type="primary"
                    loading={isDeploying}
                    disabled={isDeleting || !k8sConnected}
                    onClick={() => this.deployApplicationTemplate()}
                  >
                    {isDeployed ? "Redeploy" : "Deploy"}
                  </Button>
                  {isDeployed && (
                    <Button
                      danger
                      loading={isDeleting}
                      disabled={isDeploying || !k8sConnected}
                      onClick={() => this.deleteDeployment()}
                    >
                            Delete Deployment
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

  submitApplicationTemplateEdit(willExit) {
    const applicationTemplate = Setting.deepCopy(this.state.applicationTemplate);
    ApplicationTemplateBackend.updateApplicationTemplate(this.state.applicationTemplate.owner, this.state.applicationTemplateName, applicationTemplate)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              applicationTemplateName: this.state.applicationTemplate.name,
            });
            if (willExit) {
              this.props.history.push("/application-templates");
            } else {
              this.props.history.push(`/application-templates/${encodeURIComponent(this.state.applicationTemplate.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateApplicationTemplateField("name", this.state.applicationTemplateName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteApplicationTemplate() {
    ApplicationTemplateBackend.deleteApplicationTemplate(this.state.applicationTemplate)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/application-templates");
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
          this.state.applicationTemplate !== null ? this.renderApplicationTemplate() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitApplicationTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitApplicationTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteApplicationTemplate()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default ApplicationTemplateEditPage;
