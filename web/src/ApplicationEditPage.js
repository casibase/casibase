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
import {Button, Card, Col, Input, Popconfirm, Row, Select, Tag} from "antd";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as TemplateBackend from "./backend/TemplateBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/yaml/yaml");

const {TextArea} = Input;

class ApplicationEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      applicationName: props.match.params.applicationName,
      application: null,
      templates: [],
      deploying: false,
      refreshing: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getApplication();
    this.getTemplates();

    setTimeout(() => {
      if (this.state.application) {
        this.startStatusPolling(() => false);
      }
    }, 1000);

    setTimeout(() => {
      this.stopStatusPolling();
    }, 6000);
  }

  componentWillUnmount() {
    this.stopStatusPolling();
  }

  getApplication() {
    ApplicationBackend.getApplication(this.props.account.name, this.state.applicationName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            application: res.data,
          }, () => {
            this.refreshApplicationStatus();
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  refreshApplicationStatus() {
    if (!this.state.application) {
      return;
    }

    this.setState({refreshing: true});
    const applicationId = `${this.state.application.owner}/${this.state.application.name}`;

    ApplicationBackend.getApplicationStatus(applicationId)
      .then((res) => {
        if (res.status === "ok") {
          const application = this.state.application;
          application.status = res.data.status;
          application.message = res.data.message;
          this.setState({
            application: application,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
        this.setState({refreshing: false});
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${error}`);
        this.setState({refreshing: false});
      });
  }

  stopStatusPolling() {
    if (this.statusRefreshTimer) {
      clearInterval(this.statusRefreshTimer);
      this.statusRefreshTimer = null;
    }
  }

  startStatusPolling(stopCondition) {
    this.stopStatusPolling();
    this.refreshApplicationStatus();
    this.statusRefreshTimer = setInterval(() => {
      this.refreshApplicationStatus();
      if (this.state.application && stopCondition(this.state.application.status)) {
        this.stopStatusPolling();
      }
    }, 2500);
  }

  deployApplication() {
    this.setState({deploying: true});

    ApplicationBackend.deployApplication(this.state.application)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deployed"));
          setTimeout(() => {
            this.startStatusPolling((status) => status === "Running");
          }, 1000);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${res.msg}`);
        }
        this.setState({deploying: false});
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to deploy")}: ${error}`);
        this.setState({deploying: false});
      });
  }

  undeployApplication() {
    this.setState({deploying: true});

    ApplicationBackend.undeployApplication(this.state.application.owner, this.state.application.name)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully undeployed"));
          this.startStatusPolling((status) => status === "Not Deployed");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to undeploy")}: ${res.msg}`);
        }
        this.setState({deploying: false});
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to undeploy")}: ${error}`);
        this.setState({deploying: false});
      });
  }

  renderStatus(status) {
    let color;
    switch (status) {
    case "Running":
      color = "green";
      break;
    case "Pending":
      color = "orange";
      break;
    case "Failed":
      color = "red";
      break;
    case "Not Deployed":
      color = "default";
      break;
    default:
      color = "default";
    }

    return (
      <Tag color={color}>
        {i18next.t(`application:${status}`)}
      </Tag>
    );
  }

  getTemplates() {
    TemplateBackend.getTemplates(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            templates: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseApplicationField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
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

  renderApplication() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("application:Edit Application")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitApplicationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitApplicationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={(Setting.isMobile()) ? {margin: "5px"} : {}} type="inner">
        <Row style={{marginTop: "10px"}} >
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
            {Setting.getLabel(i18next.t("general:Template"), i18next.t("general:Template - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.application.template} onChange={(value => {this.updateApplicationField("template", value);})}
              options={this.state.templates.map((template) => Setting.getOption(`${template.displayName} (${template.name})`, `${template.name}`))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22} >
            {this.renderStatus(this.state.application.status)}
            {
              this.state.application.status === "Not Deployed" ? (
                <Button loading={this.state.deploying} style={{marginLeft: "10px"}} type="primary" onClick={() => this.deployApplication()}>
                  {i18next.t("application:Deploy")}
                </Button>
              ) : (
                <Popconfirm title={`${i18next.t("general:Sure to undeploy")}: ${this.state.application.name} ?`} onConfirm={() => this.undeployApplication()} okText={i18next.t("general:OK")} cancelText={i18next.t("general:Cancel")}>
                  <Button loading={this.state.deploying} style={{marginLeft: "10px"}} type="primary" danger>
                    {i18next.t("application:Undeploy")}
                  </Button>
                </Popconfirm>
              )
            }
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Message"), i18next.t("general:Message - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 5}} value={this.state.application.message} onChange={(e) => {
              this.updateApplicationField("message", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Namespace"), i18next.t("general:Namespace - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled value={this.state.application.namespace} onChange={e => {
              this.updateApplicationField("namespace", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("application:Parameters"), i18next.t("application:Parameters - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.application.parameters}
                options={{mode: "yaml", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateApplicationField("parameters", value);
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitApplicationEdit(exitAfterSave) {
    const application = Setting.deepCopy(this.state.application);
    ApplicationBackend.updateApplication(this.state.application.owner, this.state.applicationName, application)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              applicationName: this.state.application.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/applications");
            } else {
              this.props.history.push(`/applications/${this.state.application.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
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

  render() {
    return (
      <div>
        {
          this.state.application !== null ? this.renderApplication() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitApplicationEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitApplicationEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default ApplicationEditPage;
