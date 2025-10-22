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
import * as FileObjectBackend from "./backend/FileObjectBackend";

const {Option} = Select;

class FileObjectEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileObjectName: props.match.params.fileObjectName,
      fileObject: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getFileObject();
  }

  getFileObject() {
    FileObjectBackend.getFileObject("admin", this.props.match.params.fileObjectName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            fileObject: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseFileObjectField(key, value) {
    if (["size", "tokenCount"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFileObjectField(key, value) {
    value = this.parseFileObjectField(key, value);

    const fileObject = this.state.fileObject;
    fileObject[key] = value;
    this.setState({
      fileObject: fileObject,
    });
  }

  renderFileObject() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("file:Edit File")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitFileObjectEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitFileObjectEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.name} onChange={e => {
              this.updateFileObjectField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.displayName} onChange={e => {
              this.updateFileObjectField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Filename"), i18next.t("file:Filename - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.filename} onChange={e => {
              this.updateFileObjectField("filename", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Path"), i18next.t("file:Path - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.path} onChange={e => {
              this.updateFileObjectField("path", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Size"), i18next.t("file:Size - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.fileObject.size} onChange={value => {
              this.updateFileObjectField("size", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.store} onChange={e => {
              this.updateFileObjectField("store", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Storage Provider"), i18next.t("file:Storage Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.fileObject.storageProvider} onChange={e => {
              this.updateFileObjectField("storageProvider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("file:Token Count"), i18next.t("file:Token Count - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.fileObject.tokenCount} onChange={value => {
              this.updateFileObjectField("tokenCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.fileObject.status} onChange={(value) => {
              this.updateFileObjectField("status", value);
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

  submitFileObjectEdit(exitAfterSave) {
    const fileObject = Setting.deepCopy(this.state.fileObject);
    FileObjectBackend.updateFileObject(this.state.fileObject.owner, this.state.fileObjectName, fileObject)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              fileObjectName: this.state.fileObject.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/files");
            } else {
              this.props.history.push(`/files/${this.state.fileObject.name}`);
              this.getFileObject();
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateFileObjectField("name", this.state.fileObjectName);
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
          this.state.fileObject !== null ? this.renderFileObject() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitFileObjectEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitFileObjectEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default FileObjectEditPage;
