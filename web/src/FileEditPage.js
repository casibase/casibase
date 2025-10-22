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
import {Button, Card, Col, Input, InputNumber, Row, Select} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as FileBackend from "./backend/FileBackend";

const {Option} = Select;

class FileEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileName: props.match.params.fileName,
      file: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getFile();
  }

  getFile() {
    FileBackend.getFile("admin", this.props.match.params.fileName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            file: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseFileField(key, value) {
    if (["size", "tokenCount"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFileField(key, value) {
    value = this.parseFileField(key, value);

    const file = this.state.file;
    file[key] = value;
    this.setState({
      file: file,
    });
  }

  renderFile() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("file:Edit File")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitFileEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitFileEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.name} onChange={e => {
              this.updateFileField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.displayName} onChange={e => {
              this.updateFileField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Filename"), i18next.t("file:Filename - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.filename} onChange={e => {
              this.updateFileField("filename", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Path"), i18next.t("file:Path - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.path} onChange={e => {
              this.updateFileField("path", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Size"), i18next.t("file:Size - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.file.size} onChange={value => {
              this.updateFileField("size", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.store} onChange={e => {
              this.updateFileField("store", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Storage Provider"), i18next.t("file:Storage Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.storageProvider} onChange={e => {
              this.updateFileField("storageProvider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Token Count"), i18next.t("file:Token Count - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.file.tokenCount} onChange={value => {
              this.updateFileField("tokenCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.file.status} onChange={(value) => {
              this.updateFileField("status", value);
            }}>
              <Option value="Active">{i18next.t("file:Active")}</Option>
              <Option value="Inactive">{i18next.t("file:Inactive")}</Option>
              <Option value="Processing">{i18next.t("file:Processing")}</Option>
              <Option value="Error">{i18next.t("file:Error")}</Option>
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  submitFileEdit(exitAfterSave) {
    const file = Setting.deepCopy(this.state.file);
    FileBackend.updateFile(this.state.file.owner, this.state.fileName, file)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              fileName: this.state.file.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/files");
            } else {
              this.props.history.push(`/files/${this.state.file.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateFileField("name", this.state.fileName);
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
          this.state.file !== null ? this.renderFile() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitFileEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitFileEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default FileEditPage;
