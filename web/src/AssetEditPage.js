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
      assetOwner: props.match.params.organizationName,
      assetName: props.match.params.assetName,
      asset: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getAsset();
  }

  getAsset() {
    AssetBackend.getAsset(this.props.account.owner, this.state.assetName)
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

  submitAssetEdit(exitAfterSave) {
    const asset = Setting.deepCopy(this.state.asset);
    AssetBackend.updateAsset(this.state.asset.owner, this.state.assetName, asset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            assetName: this.state.asset.name,
          });

          if (exitAfterSave) {
            this.props.history.push("/assets");
          } else {
            this.props.history.push(`/assets/${this.state.asset.owner}/${this.state.asset.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteAsset() {
    AssetBackend.deleteAsset(this.state.asset)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/assets");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  renderAsset() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("asset:New Asset") : i18next.t("asset:Edit Asset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitAssetEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitAssetEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteAsset()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.owner} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.name} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.displayName} onChange={e => {
              this.updateAssetField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("asset:Provider"), i18next.t("asset:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.provider} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("asset:Resource ID"), i18next.t("asset:Resource ID - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.resourceId} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("asset:Resource type"), i18next.t("asset:Resource type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.resourceType} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Region"), i18next.t("general:Region - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.region} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Zone"), i18next.t("general:Zone - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.zone} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.state} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Tag"), i18next.t("general:Tag - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.tag} onChange={e => {
              this.updateAssetField("tag", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("asset:Properties"), i18next.t("asset:Properties - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea
              autoSize={{minRows: 5, maxRows: 20}}
              value={this.state.asset.properties}
              onChange={e => {
                this.updateAssetField("properties", e.target.value);
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {
          this.state.asset !== null ? this.renderAsset() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitAssetEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitAssetEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteAsset()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default AssetEditPage;
