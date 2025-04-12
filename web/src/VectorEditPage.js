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

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/markdown/markdown");

const {TextArea} = Input;

class VectorEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      vectorName: props.match.params.vectorName,
      vector: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getVector();
  }

  getVector() {
    VectorBackend.getVector("admin", this.props.match.params.vectorName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            vector: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get vector: ${res.msg}`);
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
    return (
      <Card size="small" title={
        <div>
          {i18next.t("vector:Edit Vector")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitVectorEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitVectorEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.name} onChange={e => {
              this.updateVectorField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.displayName} onChange={e => {
              this.updateVectorField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Store")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.store} onChange={e => {
              this.updateVectorField("store", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vector:Provider")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.provider} onChange={e => {
              this.updateVectorField("provider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:File")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.vector.file} onChange={e => {
              this.updateVectorField("file", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Text")}:
          </Col>
          <Col span={22} >
            <CodeMirror value={this.state.vector.text}
              options={{mode: "markdown", theme: "material-darker", lineWrapping: true}}
              onBeforeChange={(editor, data, value) => {
                this.updateVectorField("text", value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Size")}:
          </Col>
          <Col span={22} >
            <InputNumber disabled={true} value={this.state.vector.size} onChange={value => {
              this.updateVectorField("size", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vector:Dimension")}:
          </Col>
          <Col span={22} >
            <InputNumber disabled={true} value={this.state.vector.dimension} onChange={value => {
              this.updateVectorField("dimension", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("vector:Data")}:
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.vector.data} onChange={(e) => {
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
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              vectorName: this.state.vector.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/vectors");
            } else {
              this.props.history.push(`/vectors/${this.state.vector.name}`);
              this.getVector();
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateVectorField("name", this.state.vectorName);
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
          this.state.vector !== null ? this.renderVector() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitVectorEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitVectorEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default VectorEditPage;
