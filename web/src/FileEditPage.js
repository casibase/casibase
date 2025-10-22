// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import * as FileListBackend from "./backend/FileListBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import StoreSelect from "./StoreSelect";

const {Option} = Select;

class FileEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileName: props.match.params.fileName,
      fileList: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getFileList();
  }

  getFileList() {
    FileListBackend.getFileList("admin", this.state.fileName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            fileList: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseFileListField(key, value) {
    if (["tokenCount", "size"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFileListField(key, value) {
    value = this.parseFileListField(key, value);

    const fileList = this.state.fileList;
    fileList[key] = value;
    this.setState({
      fileList: fileList,
    });
  }

  renderFileList() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("general:New File") : i18next.t("general:Edit File")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitFileListEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitFileListEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteFileList()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileList.name} onChange={e => {
              this.updateFileListField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileList.displayName} onChange={e => {
              this.updateFileListField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:File name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileList.fileName} onChange={e => {
              this.updateFileListField("fileName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:File ID")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileList.fileId} onChange={e => {
              this.updateFileListField("fileId", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Store")}:
          </Col>
          <Col span={22} >
            <StoreSelect account={this.props.account} labelSpan={0} store={this.state.fileList.store} onUpdateStore={(value) => {this.updateFileListField("store", value);}} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Embedding provider")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileList.embeddingProvider} onChange={e => {
              this.updateFileListField("embeddingProvider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Status")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.fileList.status} onChange={(value) => {
              this.updateFileListField("status", value);
            }}>
              {
                ["Pending", "Processing", "Completed", "Failed"]
                  .map((item, index) => <Option key={index} value={item}>{item}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("chat:Token count")}:
          </Col>
          <Col span={22} >
            <InputNumber style={{width: "100%"}} value={this.state.fileList.tokenCount} onChange={value => {
              this.updateFileListField("tokenCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Size")}:
          </Col>
          <Col span={22} >
            <InputNumber style={{width: "100%"}} value={this.state.fileList.size} onChange={value => {
              this.updateFileListField("size", value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitFileListEdit(exitAfterSave) {
    const fileList = Setting.deepCopy(this.state.fileList);
    FileListBackend.updateFileList(this.state.fileList.owner, this.state.fileName, fileList)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            fileName: this.state.fileList.name,
          });
          if (exitAfterSave) {
            this.props.history.push("/files");
          } else {
            this.props.history.push(`/files/${this.state.fileList.owner}/${this.state.fileList.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteFileList() {
    FileListBackend.deleteFileList(this.state.fileList)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/files");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.fileList !== null ? this.renderFileList() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.props.history.push("/files")}>{i18next.t("general:Cancel")}</Button>
        </div>
      </div>
    );
  }
}

export default FileEditPage;
