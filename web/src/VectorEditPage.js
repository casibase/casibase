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
import {Button, Card, Col, Input, InputNumber, Row} from "antd";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as VectorBackend from "./backend/VectorBackend";
import Editor from "./common/Editor";

const {TextArea} = Input;

class VectorEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      vectorName: props.match.params.vectorName,
      vector: null,
      isNewVector: props.location?.state?.isNewVector || false,
      mode: new URLSearchParams(props.location?.search || "").get("mode") || "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getVector();
  }

  getVector() {
    VectorBackend.getVector("admin", this.props.match.params.vectorName)
      .then((res) => {
        if (res.data === null) {
          this.props.history.push("/404");
          return;
        }

        if (res.status === "ok") {
          this.setState({
            vector: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseVectorField(key, value) {
    if (key === "data") {
      value = value.split(",").map(Number);
    }

    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateVectorField(key, value) {
    value = this.parseVectorField(key, value);

    const vector = this.state.vector;
    vector[key] = value;
    this.setState({
      vector: vector,
    });
  }

  renderVector() {
    const isViewMode = this.state.mode === "view";
    return (
      <Card size="small" title={
        <div>
          {isViewMode ? i18next.t("vector:View Vector") : i18next.t("vector:Edit Vector")}&nbsp;&nbsp;&nbsp;&nbsp;
          {!isViewMode && (<>
            <Button onClick={() => this.submitVectorEdit(false)}>{i18next.t("general:Save")}</Button>
            <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitVectorEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            {this.state.isNewVector && <Button style={{marginLeft: "20px"}} onClick={() => this.cancelVectorEdit()}>{i18next.t("general:Cancel")}</Button>}
          </>)}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.name} disabled={isViewMode} onChange={e => {
              this.updateVectorField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.displayName} disabled={isViewMode} onChange={e => {
              this.updateVectorField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Store"), i18next.t("general:Store - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.store} disabled={isViewMode} onChange={e => {
              this.updateVectorField("store", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.provider} disabled={isViewMode} onChange={e => {
              this.updateVectorField("provider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("store:File"), i18next.t("store:File - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.file} disabled={isViewMode} onChange={e => {
              this.updateVectorField("file", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Text"), i18next.t("general:Text - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Editor
              value={this.state.vector.text}
              lang="markdown"
              dark
              fillHeight
              fillWidth
              readOnly={isViewMode}
              onChange={value => {
                if (!isViewMode) {
                  this.updateVectorField("text", value);
                }
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Size"), i18next.t("general:Size - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber disabled={true} value={this.state.vector.size} onChange={value => {
              this.updateVectorField("size", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("vector:Dimension"), i18next.t("vector:Dimension - Tooltip"))} :
          </Col>
          <Col span={22} >
            <InputNumber disabled={true} value={this.state.vector.dimension} onChange={value => {
              this.updateVectorField("dimension", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Data"), i18next.t("general:Data - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.vector.data} disabled={isViewMode} onChange={(e) => {
              this.updateVectorField("data", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitVectorEdit(exitAfterSave) {
    const vector = Setting.deepCopy(this.state.vector);
    VectorBackend.updateVector(this.state.vector.owner, this.state.vectorName, vector)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              vectorName: this.state.vector.name,
              isNewVector: false,
            });

            if (exitAfterSave) {
              this.props.history.push("/vectors");
            } else {
              this.props.history.push(`/vectors/${this.state.vector.name}`);
              this.getVector();
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateVectorField("name", this.state.vectorName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  cancelVectorEdit() {
    if (this.state.isNewVector) {
      VectorBackend.deleteVector(this.state.vector)
        .then((res) => {
          if (res.status === "ok") {
            Setting.showMessage("success", i18next.t("general:Cancelled successfully"));
            this.props.history.push("/vectors");
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${res.msg}`);
          }
        })
        .catch(error => {
          Setting.showMessage("error", `${i18next.t("general:Failed to cancel")}: ${error}`);
        });
    } else {
      this.props.history.push("/vectors");
    }
  }

  render() {
    const isViewMode = this.state.mode === "view";
    return (
      <div>
        {
          this.state.vector !== null ? this.renderVector() : null
        }
        {!isViewMode && (
          <div style={{marginTop: "20px", marginLeft: "40px"}}>
            <Button size="large" onClick={() => this.submitVectorEdit(false)}>{i18next.t("general:Save")}</Button>
            <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitVectorEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            {this.state.isNewVector && <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.cancelVectorEdit()}>{i18next.t("general:Cancel")}</Button>}
          </div>
        )}
      </div>
    );
  }
}

export default VectorEditPage;
