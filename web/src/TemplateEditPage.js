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
import * as TemplateBackend from "./backend/TemplateBackend";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import StoreAvatarUploader from "./AvatarUpload";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import TextArea from "antd/es/input/TextArea";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

class TemplateEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      templateName: props.match.params.templateName,
      template: null,
      defaultStore: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getTemplate();
    this.getDefaultStore();
  }

  getTemplate() {
    TemplateBackend.getTemplate(this.props.account.name, this.state.templateName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            template: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getDefaultStore() {
    StoreBackend.getStores(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          const defaultStore = res.data.find(store => store.isDefault);
          if (defaultStore) {
            this.setState({
              defaultStore: defaultStore,
            });
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseTemplateField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
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

  renderTemplate() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("template:Edit Template")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
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
            <StoreAvatarUploader
              store={this.state.defaultStore}
              imageUrl={this.state.template.icon}
              onUpdate={(newUrl) => {
                this.updateTemplateField("icon", newUrl);
              }}
              onUploadComplete={(newUrl) => {
                this.submitTemplateEdit(false);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("template:Manifest"), i18next.t("template:Manifest - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{height: "500px"}}>
              <CodeMirror
                value={this.state.template.manifest}
                options={{mode: "yaml", theme: "material-darker"}}
                onBeforeChange={(editor, data, value) => {
                  this.updateTemplateField("manifest", value);
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitTemplateEdit(exitAfterSave) {
    const template = Setting.deepCopy(this.state.template);
    TemplateBackend.updateTemplate(this.state.template.owner, this.state.templateName, template)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              templateName: this.state.template.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/templates");
            } else {
              this.props.history.push(`/templates/${this.state.template.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
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

  render() {
    return (
      <div>
        {
          this.state.template !== null ? this.renderTemplate() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitTemplateEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitTemplateEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default TemplateEditPage;
