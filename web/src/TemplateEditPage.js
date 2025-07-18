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
import * as Setting from "./Setting";
import i18next from "i18next";

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
      deploymentStatus: null,
      isDeploying: false,
      isDeleting: false,
      k8sStatus: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTemplate();
    this.getDeploymentStatus();
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

  getDeploymentStatus() {
    return TemplateBackend.getDeploymentStatus(this.props.account.owner, this.state.templateName)
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

  deployTemplate() {
    if (!this.state.template.manifests) {
      Setting.showMessage("error", i18next.t("general:Please provide manifests content"));
      return;
    }

    this.setState({isDeploying: true});

    const deploymentData = {
      owner: this.state.template.owner,
      name: this.state.template.name,
      manifests: this.state.template.manifests,
    };

    TemplateBackend.deployTemplate(deploymentData)
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
      owner: this.state.template.owner,
      name: this.state.template.name,
    };

    TemplateBackend.deleteDeployment(deploymentData)
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

  renderTemplate() {
    const {deploymentStatus, isDeploying, isDeleting, k8sStatus} = this.state;
    const isDeployed = deploymentStatus && deploymentStatus.status !== "Not Deployed" && deploymentStatus.status !== "Unknown";
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
            <TextArea value={this.state.template.description} onChange={e => {
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
            <TextArea
              rows={10}
              value={this.state.template.manifests || ""}
              placeholder="Enter Kubernetes manifests (YAML format)"
              onChange={e => {
                this.updateTemplateField("manifests", e.target.value);
              }}
            />
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
                  Refresh Status
              </Button>
              {k8sStatus && k8sStatus.message && (
                <span style={{color: "#666", fontSize: "12px"}}>
                  {k8sStatus.message}
                </span>
              )}
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
                {this.renderDeploymentStatus()}
              </Col>
            </Row>

            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel("Deployment Actions", "Deploy or delete the application")} :
              </Col>
              <Col span={22} >
                <Space>
                  <Button type="primary" loading={isDeploying} disabled={isDeleting || !k8sConnected} onClick={() => this.deployTemplate()}>
                    {isDeployed ? "Redeploy" : "Deploy"}
                  </Button>
                  {isDeployed && (
                    <Button danger loading={isDeleting} disabled={isDeploying || !k8sConnected} onClick={() => this.deleteDeployment()}>
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
