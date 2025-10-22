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
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as AssetBackend from "./backend/AssetBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/mode/javascript/javascript");

const {Option} = Select;

class AssetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      assetName: props.match.params.assetName,
      asset: null,
      providers: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getAsset();
    this.getProviders();
  }

  getAsset() {
    AssetBackend.getAsset(this.state.owner, this.state.assetName)
      .then((asset) => {
        if (asset.status === "ok") {
          this.setState({
            asset: asset.data,
          });
        } else {
          Setting.showMessage("error", asset.msg);
        }
      });
  }

  getProviders() {
    ProviderBackend.getProviders(this.state.owner)
      .then((res) => {
        if (res.status === "ok") {
          const cloudProviders = res.data.filter(provider =>
            (provider.category === "Public Cloud" || provider.category === "Private Cloud") &&
            provider.state === "Active"
          );
          this.setState({
            providers: cloudProviders,
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  parseAssetField(key, value) {
    if (["tags", "properties"].includes(key)) {
      value = Setting.myParseJson(value);
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
          {this.state.mode === "add" ? i18next.t("asset:New Asset") : i18next.t("asset:Edit Asset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitAssetEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitAssetEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteAsset()}>{i18next.t("general:Cancel")}</Button> : null}
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
            {i18next.t("asset:Provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.asset.provider} onChange={(value => {
              this.updateAssetField("provider", value);
            })}>
              {
                this.state.providers.map((provider, index) => <Option key={index} value={provider.name}>
                  <div style={{display: "flex", alignItems: "center"}}>
                    {Setting.getProviderLogo(provider)}
                    <span style={{marginLeft: 10}}>{provider.displayName || provider.name}</span>
                  </div>
                </Option>)
              }
            </Select>
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
            {i18next.t("asset:Resource Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.resourceName} onChange={e => {
              this.updateAssetField("resourceName", e.target.value);
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
            {i18next.t("asset:Status")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.status} onChange={e => {
              this.updateAssetField("status", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Tags")}:
          </Col>
          <Col span={22} >
            <CodeMirror
              value={this.state.asset.tags}
              options={{mode: "javascript", theme: "material-darker", lineNumbers: true}}
              onBeforeChange={(editor, data, value) => {
                this.updateAssetField("tags", value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("asset:Properties")}:
          </Col>
          <Col span={22} >
            <CodeMirror
              value={this.state.asset.properties}
              options={{mode: "javascript", theme: "material-darker", lineNumbers: true}}
              onBeforeChange={(editor, data, value) => {
                this.updateAssetField("properties", value);
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  submitAssetEdit(willExist) {
    const asset = Setting.deepCopy(this.state.asset);
    AssetBackend.updateAsset(this.state.asset.owner, this.state.assetName, asset)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            assetName: this.state.asset.name,
          });
          if (willExist) {
            this.props.history.push("/assets");
          } else {
            this.props.history.push(`/assets/${this.state.asset.owner}/${this.state.asset.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
          this.updateAssetField("name", this.state.assetName);
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
