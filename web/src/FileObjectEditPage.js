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
import * as FileObjectBackend from "./backend/FileObjectBackend";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {Option} = Select;

class FileObjectEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      fileObjectName: props.match.params.fileObjectName,
      fileObject: null,
      stores: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getFileObject();
    this.getStores();
  }

  getFileObject() {
    FileObjectBackend.getFileObject(
      this.props.account.owner,
      this.state.fileObjectName
    ).then((res) => {
      if (res.status === "ok") {
        this.setState({
          fileObject: res.data,
        });
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
      }
    });
  }

  getStores() {
    StoreBackend.getStores(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            stores: res.data || [],
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
      <Card
        size="small"
        title={
          <div>
            {this.state.mode === "add"
              ? i18next.t("fileObject:New File")
              : i18next.t("fileObject:Edit File")}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button onClick={() => this.submitFileObjectEdit(false)}>
              {i18next.t("general:Save")}
            </Button>
            <Button
              style={{marginLeft: "20px"}}
              type="primary"
              onClick={() => this.submitFileObjectEdit(true)}
            >
              {i18next.t("general:Save & Exit")}
            </Button>
          </div>
        }
        style={{marginLeft: "5px"}}
        type="inner"
      >
        <Row style={{marginTop: "10px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.fileObject.name}
              onChange={(e) => {
                this.updateFileObjectField("name", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.fileObject.displayName}
              onChange={(e) => {
                this.updateFileObjectField("displayName", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Filename")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.fileObject.filename}
              onChange={(e) => {
                this.updateFileObjectField("filename", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Path")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.fileObject.path}
              onChange={(e) => {
                this.updateFileObjectField("path", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Size")}:
          </Col>
          <Col span={22}>
            <InputNumber
              style={{width: "100%"}}
              value={this.state.fileObject.size}
              onChange={(value) => {
                this.updateFileObjectField("size", value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Store")}:
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.fileObject.store}
              onChange={(value) => {
                this.updateFileObjectField("store", value);
              }}
            >
              {this.state.stores.map((store, index) => (
                <Option key={index} value={store.name}>
                  {store.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Storage provider")}:
          </Col>
          <Col span={22}>
            <Input
              value={this.state.fileObject.storageProvider}
              onChange={(e) => {
                this.updateFileObjectField("storageProvider", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Token count")}:
          </Col>
          <Col span={22}>
            <InputNumber
              style={{width: "100%"}}
              value={this.state.fileObject.tokenCount}
              onChange={(value) => {
                this.updateFileObjectField("tokenCount", value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("fileObject:Status")}:
          </Col>
          <Col span={22}>
            <Select
              virtual={false}
              style={{width: "100%"}}
              value={this.state.fileObject.status}
              onChange={(value) => {
                this.updateFileObjectField("status", value);
              }}
            >
              <Option key="Active" value="Active">
                Active
              </Option>
              <Option key="Inactive" value="Inactive">
                Inactive
              </Option>
              <Option key="Processing" value="Processing">
                Processing
              </Option>
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  submitFileObjectEdit(exitAfterSave) {
    const fileObject = Setting.deepCopy(this.state.fileObject);
    FileObjectBackend.updateFileObject(
      this.state.fileObject.owner,
      this.state.fileObjectName,
      fileObject
    )
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            fileObjectName: this.state.fileObject.name,
          });
          if (exitAfterSave) {
            this.props.history.push("/file-objects");
          } else {
            this.props.history.push(`/file-objects/${this.state.fileObject.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
          this.updateFileObjectField("name", this.state.fileObjectName);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {this.state.fileObject !== null ? this.renderFileObject() : null}
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.props.history.goBack()}>
            {i18next.t("general:Cancel")}
          </Button>
        </div>
      </div>
    );
  }
}

export default FileObjectEditPage;
