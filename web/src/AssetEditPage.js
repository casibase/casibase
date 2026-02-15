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
import * as ProviderBackend from "./backend/ProviderBackend";
import * as ScanBackend from "./backend/ScanBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {JsonCodeMirrorEditor} from "./common/JsonCodeMirrorWidget";
import ScanTable from "./common/ScanTable";

class AssetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      assetName: props.match.params.assetName,
      asset: null,
      providers: [],
      scans: [],
      loadingScans: false,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getAsset();
    this.getProviders();
    this.getScans();
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            providers: res.data || [],
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  getScans() {
    this.setState({loadingScans: true});
    ScanBackend.getScansByAsset("admin", this.state.assetName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            scans: res.data || [],
            loadingScans: false,
          });
        } else {
          this.setState({
            scans: [],
            loadingScans: false,
          });
        }
      })
      .catch(() => {
        this.setState({
          scans: [],
          loadingScans: false,
        });
      });
  }

  getAsset() {
    AssetBackend.getAsset("admin", this.state.assetName)
      .then((res) => {
        if (res.status === "ok") {
          const asset = res.data;
          // Format JSON properties with 2-space indentation
          if (asset.properties) {
            asset.properties = Setting.formatJsonString(asset.properties);
          }
          this.setState({
            asset: asset,
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
            this.props.history.push(`/assets/${this.state.asset.name}`);
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

  getProviderLogo(providerName) {
    const provider = this.state.providers.find(p => p.name === providerName);
    if (!provider) {
      return null;
    }

    const otherProviderInfo = Setting.getOtherProviderInfo();
    if (!otherProviderInfo[provider.category] || !otherProviderInfo[provider.category][provider.type]) {
      return null;
    }

    return otherProviderInfo[provider.category][provider.type].logo;
  }

  getTypeIcon(typeName) {
    const typeIcons = Setting.getAssetTypeIcons();
    return typeIcons[typeName] || null;
  }

  renderAsset() {
    const providerLogo = this.getProviderLogo(this.state.asset.provider);
    const typeIcon = this.getTypeIcon(this.state.asset.type);

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
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              value={this.state.asset.provider}
              disabled
              prefix={
                providerLogo ?
                  <img src={providerLogo} alt={this.state.asset.provider} style={{width: "16px", height: "16px"}} /> :
                  null
              }
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:ID"), i18next.t("general:ID - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.asset.id} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              value={this.state.asset.type}
              disabled
              prefix={
                typeIcon ?
                  <img src={typeIcon} alt={this.state.asset.type} style={{width: "16px", height: "16px"}} /> :
                  null
              }
            />
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
        {this.state.asset.type === "Virtual Machine" ? (
          <>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Username"), i18next.t("general:Username - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Input value={this.state.asset.username} onChange={e => {
                  this.updateAssetField("username", e.target.value);
                }} />
              </Col>
            </Row>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("general:Password"), i18next.t("general:Password - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Input.Password value={this.state.asset.password} onChange={e => {
                  this.updateAssetField("password", e.target.value);
                }} />
              </Col>
            </Row>
          </>
        ) : null}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("asset:Properties"), i18next.t("asset:Properties - Tooltip"))} :
          </Col>
          <Col span={22} >
            <JsonCodeMirrorEditor
              value={this.state.asset.properties || ""}
              onChange={(editor, data, value) => {
                this.updateAssetField("properties", value);
              }}
              editable={true}
              height="500px"
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
        {this.state.asset !== null && (
          <Card size="small" title={i18next.t("scan:Related Scans")} style={{marginTop: "20px", marginLeft: "5px"}} type="inner">
            {this.state.loadingScans ? (
              <div style={{textAlign: "center", padding: "40px"}}>
                {i18next.t("general:Loading")}...
              </div>
            ) : this.state.scans.length > 0 ? (
              <ScanTable scans={this.state.scans} providers={this.state.providers} showAsset={false} />
            ) : (
              <div style={{textAlign: "center", padding: "40px", color: "#999"}}>
                {i18next.t("scan:No scans found for this asset")}
              </div>
            )}
          </Card>
        )}
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
