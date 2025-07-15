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
import {Button, Card, Col, Input, Row, Select} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import * as FormBackend from "./backend/FormBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import FormItemTable from "./table/FormItemTable";

const {Option} = Select;

class FormEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      formName: props.match.params.formName,
      form: null,
      formCount: "key",
    };
  }

  UNSAFE_componentWillMount() {
    this.getForm();
  }

  getForm() {
    FormBackend.getForm(this.props.account.name, this.state.formName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            form: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseFormField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFormField(key, value) {
    value = this.parseFormField(key, value);

    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  renderForm() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("form:Edit Form")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitFormEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitFormEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.form.name} onChange={e => {
              this.updateFormField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.form.displayName} onChange={e => {
              this.updateFormField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("form:Position"), i18next.t("form:Position - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.form.position} onChange={e => {
              this.updateFormField("position", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.form.type} onChange={(value => {
              this.updateFormField("type", value);
            })}>
              {
                [
                  {id: "Table", name: i18next.t("form:Table")},
                  {id: "iFrame", name: i18next.t("form:iFrame")},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        {
          this.state.form.type === "Table" && (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("form:Form items"), i18next.t("form:Form items - Tooltip"))} :
              </Col>
              <Col span={22} >
                <FormItemTable
                  title={i18next.t("form:Form items")}
                  table={this.state.form.formItems}
                  onUpdateTable={(value) => {this.updateFormField("formItems", value);}}
                />
              </Col>
            </Row>
          )
        }
        {
          this.state.form.type === "iFrame" && (
            <Row style={{marginTop: "20px"}}>
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:URL"), i18next.t("general:URL - Tooltip"))} :
              </Col>
              <Col span={22}>
                <Input prefix={<LinkOutlined />} value={this.state.form.url} onChange={e => {this.updateFormField("url", e.target.value);}} />
              </Col>
            </Row>
          )
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Preview")}:
          </Col>
          <Col span={22} >
            <div key={this.state.formCount}>
              <iframe id="formData" title={"formData"} src={`${location.href}/data`} width="100%" height="700px" scrolling="no" style={{border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"}} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  submitFormEdit(exitAfterSave) {
    const form = Setting.deepCopy(this.state.form);
    if (!exitAfterSave) {
      this.setState({
        formCount: this.state.formCount + "a",
      });
    }
    FormBackend.updateForm(this.state.form.owner, this.state.formName, form)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              formName: this.state.form.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/forms");
            } else {
              this.props.history.push(`/forms/${this.state.form.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateFormField("name", this.state.formName);
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
          this.state.form !== null ? this.renderForm() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitFormEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitFormEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default FormEditPage;
