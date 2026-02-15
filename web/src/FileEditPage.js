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
      fileName: decodeURIComponent(props.match.params.fileName),
      isNewFile: props.location?.state?.isNewFile || false,
      file: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getFile();
  }

  getFile() {
    const fileName = this.state.fileName;
    FileBackend.getFile("admin", fileName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            file: res.data,
            fileName: fileName,
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
          {this.state.isNewFile && <Button style={{marginLeft: "20px"}} onClick={() => this.cancelFileEdit()}>{i18next.t("general:Cancel")}</Button>}
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
            {Setting.getLabel(i18next.t("general:Size"), i18next.t("general:Size - Tooltip"))} :
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
            {Setting.getLabel(i18next.t("store:Storage provider"), i18next.t("store:Storage provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.file.storageProvider} onChange={e => {
              this.updateFileField("storageProvider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("chat:Token count"), i18next.t("chat:Token count - Tooltip"))} :
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
              <Option value="Pending">{i18next.t("application:Pending")}</Option>
              <Option value="Processing">{i18next.t("file:Processing")}</Option>
              <Option value="Finished">{i18next.t("file:Finished")}</Option>
              <Option value="Error">{i18next.t("general:Error")}</Option>
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("message:Error text"), i18next.t("message:Error text - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input.TextArea value={this.state.file.errorText} autoSize={{minRows: 2, maxRows: 4}} readOnly />
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
              isNewFile: false,
            });

            if (exitAfterSave) {
              this.props.history.push("/files");
            } else {
              this.props.history.push(`/files/${encodeURIComponent(this.state.file.name)}`);
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
          {this.state.isNewFile && <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.cancelFileEdit()}>{i18next.t("general:Cancel")}</Button>}
        </div>
      </div>
    );
  }
  cancelFileEdit() {
    if (this.state.isNewFile) {
      FileBackend.deleteFile(this.state.file)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Cancelled successfully"));
            this.props.history.push("/files");
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${res.msg}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${error}`);
        });
    } else {
      this.props.history.push("/files");
    }
  }

}

export default FileEditPage;
