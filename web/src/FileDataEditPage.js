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
import {LinkOutlined} from "@ant-design/icons";
import * as FileDataBackend from "./backend/FileDataBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import StoreSelect from "./StoreSelect";

const {Option} = Select;

class FileDataEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileDataName: props.match.params.fileDataName,
      fileData: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getFileData();
  }

  getFileData() {
    FileDataBackend.getFileData("admin", this.state.fileDataName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            fileData: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseFileDataField(key, value) {
    if (["tokenCount", "size"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFileDataField(key, value) {
    value = this.parseFileDataField(key, value);

    const fileData = this.state.fileData;
    fileData[key] = value;
    this.setState({
      fileData: fileData,
    });
  }

  renderFileData() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("fileData:New File Data") : i18next.t("fileData:Edit File Data")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitFileDataEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitFileDataEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteFileData()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileData.name} onChange={e => {
              this.updateFileDataField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileData.displayName} onChange={e => {
              this.updateFileDataField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileData:File name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileData.fileName} onChange={e => {
              this.updateFileDataField("fileName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileData:File ID")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileData.fileId} onChange={e => {
              this.updateFileDataField("fileId", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Store")}:
          </Col>
          <Col span={22} >
            <StoreSelect account={this.props.account} labelSpan={0} store={this.state.fileData.store} onUpdateStore={(value) => {this.updateFileDataField("store", value);}} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileData:Embedding provider")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.fileData.embeddingProvider} onChange={e => {
              this.updateFileDataField("embeddingProvider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileData:Status")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.fileData.status} onChange={(value) => {
              this.updateFileDataField("status", value);
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
            {i18next.t("fileData:Token count")}:
          </Col>
          <Col span={22} >
            <InputNumber style={{width: "100%"}} value={this.state.fileData.tokenCount} onChange={value => {
              this.updateFileDataField("tokenCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileData:Size")}:
          </Col>
          <Col span={22} >
            <InputNumber style={{width: "100%"}} value={this.state.fileData.size} onChange={value => {
              this.updateFileDataField("size", value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitFileDataEdit(exitAfterSave) {
    const fileData = Setting.deepCopy(this.state.fileData);
    FileDataBackend.updateFileData(this.state.fileData.owner, this.state.fileDataName, fileData)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            fileDataName: this.state.fileData.name,
          });
          if (exitAfterSave) {
            this.props.history.push("/files-data");
          } else {
            this.props.history.push(`/files-data/${this.state.fileData.owner}/${this.state.fileData.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteFileData() {
    FileDataBackend.deleteFileData(this.state.fileData)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/files-data");
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
          this.state.fileData !== null ? this.renderFileData() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.props.history.push("/files-data")}>{i18next.t("general:Cancel")}</Button>
        </div>
      </div>
    );
  }
}

export default FileDataEditPage;
