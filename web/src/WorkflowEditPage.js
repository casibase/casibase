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
import {Button, Card, Col, Input, Row} from "antd";
import * as WorkflowBackend from "./backend/WorkflowBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import BpmnComponent from "./BpmnComponent";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/xml/xml");
require("codemirror/mode/htmlmixed/htmlmixed");

class WorkflowEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      workflowName: props.match.params.workflowName,
      modelProviders: [],
      workflow: null,
      chatPageObj: null,
      loading: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getWorkflow();
  }

  getWorkflow() {
    WorkflowBackend.getWorkflow(this.props.account.name, this.state.workflowName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            workflow: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get workflow: ${res.msg}`);
        }
      });
  }

  parseWorkflowField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateWorkflowField(key, value) {
    value = this.parseWorkflowField(key, value);

    const workflow = this.state.workflow;
    workflow[key] = value;
    this.setState({
      workflow: workflow,
    });
  }

  renderWorkflow() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("workflow:Edit Workflow")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitWorkflowEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitWorkflowEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.workflow.name} onChange={e => {
              this.updateWorkflowField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.workflow.displayName} onChange={e => {
              this.updateWorkflowField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Text")}:
          </Col>
          <Col span={10} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.workflow.text}
                options={{mode: "xml", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateWorkflowField("text", value);
                }}
              />
            </div>
          </Col>
          <Col span={1} />
          <Col span={11} >
            <div>
              <BpmnComponent
                diagramXML={this.state.workflow.text}
                onLoading={(info) => {
                  Setting.showMessage("success", info);
                }}
                onError={(err) => {
                  Setting.showMessage("error", err);
                }}
                onXMLChange={(xml) => {
                  this.updateWorkflowField("text", xml);
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Text2")}:
          </Col>
          <Col span={10} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.workflow.text2}
                options={{mode: "xml", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateWorkflowField("text2", value);
                }}
              />
            </div>
          </Col>
          <Col span={1} />
          <Col span={11} >
            <div>
              <BpmnComponent
                diagramXML={this.state.workflow.text2}
                onLoading={(info) => {
                  Setting.showMessage("success", info);
                }}
                onError={(err) => {
                  Setting.showMessage("error", err);
                }}
                onXMLChange={(xml) => {
                  this.updateWorkflowField("text2", xml);
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Message")}:
          </Col>
          <Col span={22} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.workflow.message}
                options={{mode: "html", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateWorkflowField("message", value);
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitWorkflowEdit(exitAfterSave) {
    const workflow = Setting.deepCopy(this.state.workflow);
    WorkflowBackend.updateWorkflow(this.state.workflow.owner, this.state.workflowName, workflow)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              workflowName: this.state.workflow.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/workflows");
            } else {
              this.props.history.push(`/workflows/${this.state.workflow.name}`);
              this.getWorkflow();
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateWorkflowField("name", this.state.workflowName);
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
          this.state.workflow !== null ? this.renderWorkflow() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitWorkflowEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitWorkflowEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default WorkflowEditPage;
