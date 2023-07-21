// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import * as FactorsetBackend from "./backend/FactorsetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import FactorTable from "./FactorTable";
import {LinkOutlined} from "@ant-design/icons";

class FactorsetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      factorsetName: props.match.params.factorsetName,
      factorset: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getFactorset();
  }

  getFactorset() {
    FactorsetBackend.getFactorset(this.props.account.name, this.state.factorsetName)
      .then((factorset) => {
        if (factorset.status === "ok") {
          this.setState({
            factorset: factorset.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get factorset: ${factorset.msg}`);
        }
      });
  }

  parseFactorsetField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateFactorsetField(key, value) {
    value = this.parseFactorsetField(key, value);

    const factorset = this.state.factorset;
    factorset[key] = value;
    this.setState({
      factorset: factorset,
    });
  }

  renderFactorset() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("factorset:Edit Factorset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitFactorsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.factorset.name} onChange={e => {
              this.updateFactorsetField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.factorset.displayName} onChange={e => {
              this.updateFactorsetField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:URL")}:
          </Col>
          <Col span={22} >
            <Input prefix={<LinkOutlined />} value={this.state.factorset.url} onChange={e => {
              this.updateFactorsetField("url", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("factorset:File name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.factorset.fileName} onChange={e => {
              this.updateFactorsetField("fileName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("factorset:File size")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.factorset.fileSize} onChange={e => {
              this.updateFactorsetField("fileSize", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("factorset:Dimension")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.factorset.dimension} onChange={value => {
              this.updateFactorsetField("dimension", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("factorset:Count")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.factorset.count} onChange={value => {
              this.updateFactorsetField("count", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("factorset:Example factors")}:
          </Col>
          <Col span={22} >
            <FactorTable
              title={i18next.t("factorset:Example factors")}
              table={this.state.factorset.factors}
              onUpdateTable={(value) => {this.updateFactorsetField("factors", value);}}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitFactorsetEdit() {
    const factorset = Setting.deepCopy(this.state.factorset);
    FactorsetBackend.updateFactorset(this.state.factorset.owner, this.state.factorsetName, factorset)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              factorsetName: this.state.factorset.name,
            });
            this.props.history.push(`/factorsets/${this.state.factorset.name}`);
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateFactorsetField("name", this.state.factorsetName);
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
          this.state.factorset !== null ? this.renderFactorset() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button type="primary" size="large" onClick={this.submitFactorsetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      </div>
    );
  }
}

export default FactorsetEditPage;
