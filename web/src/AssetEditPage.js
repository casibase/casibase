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
import {Button, Card, Col, Input, Row} from "antd";
import * as AssetBackend from "./backend/AssetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {TextArea} = Input;

class AssetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      organizationName: props.match.params.organizationName !== undefined ? props.match.params.organizationName : props.account.owner,
      assetName: props.match.params.assetName,
      asset: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getAsset();
  }

  getAsset() {
    AssetBackend.getAsset(this.state.organizationName, this.state.assetName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            asset: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseAssetField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateAssetField(key, value) {
    value = this.parseAssetField(key, value);

    const asset = this.state.asset;
    asset[key] = value;
    this.setState({
      asset: asset,
    });
  }

  renderAsset() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("asset:Edit Asset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button type="primary" onClick={this.submitAssetEdit.bind(this)}>{i18next.t("general:Save")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Organization")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.owner} onChange={e => {
              this.updateAssetField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.name} onChange={e => {
              this.updateAssetField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.displayName} onChange={e => {
              this.updateAssetField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Provider")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.provider} onChange={e => {
              this.updateAssetField("provider", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Resource ID")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.resourceId} onChange={e => {
              this.updateAssetField("resourceId", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Resource Type")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.resourceType} onChange={e => {
              this.updateAssetField("resourceType", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Region")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.region} onChange={e => {
              this.updateAssetField("region", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Zone")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.zone} onChange={e => {
              this.updateAssetField("zone", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:State")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.state} onChange={e => {
              this.updateAssetField("state", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:IP Address")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.ipAddress} onChange={e => {
              this.updateAssetField("ipAddress", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Size")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.size} onChange={e => {
              this.updateAssetField("size", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Description")}:
          </Col>
          <Col span={22} >
            <TextArea rows={4} value={this.state.asset.description} onChange={e => {
              this.updateAssetField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Tags")}:
          </Col>
          <Col span={22} >
            <TextArea rows={4} value={this.state.asset.tags} onChange={e => {
              this.updateAssetField("tags", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitAssetEdit() {
    const asset = Setting.deepCopy(this.state.asset);
    AssetBackend.updateAsset(this.state.organizationName, this.state.assetName, asset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            assetName: this.state.asset.name,
          });
          this.props.history.push(`/assets/${this.state.asset.owner}/${this.state.asset.name}`);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
          this.updateAssetField("name", this.state.assetName);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.asset !== null ? this.renderAsset() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.props.history.push("/assets")}>{i18next.t("general:Cancel")}</Button>
        </div>
      </div>
    );
  }
}

export default AssetEditPage;
