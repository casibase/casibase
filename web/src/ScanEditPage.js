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
import * as ScanBackend from "./backend/ScanBackend";
import * as AssetBackend from "./backend/AssetBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {Option} = Select;
const {TextArea} = Input;

class ScanEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      scanName: props.match.params.scanName,
      scan: null,
      assets: [],
      providers: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getScan();
    this.getAssets();
    this.getProviders();
  }

  getScan() {
    ScanBackend.getScan(this.props.account.name, this.state.scanName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            scan: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getAssets() {
    AssetBackend.getAssets(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          // Filter to only show Virtual Machine assets
          const vmAssets = res.data.filter(asset => asset.type === "Virtual Machine");
          this.setState({
            assets: vmAssets,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          const scanProviders = res.data.filter(provider =>
            provider.category === "Scan"
          );
          this.setState({
            providers: scanProviders,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseScanField(key, value) {
    return value;
  }

  updateScanField(key, value) {
    value = this.parseScanField(key, value);
    const scan = this.state.scan;
    scan[key] = value;
    this.setState({
      scan: scan,
    });
  }

  submitScanEdit(exitAfterSave) {
    const scan = Setting.deepCopy(this.state.scan);
    ScanBackend.updateScan(this.state.scan.owner, this.state.scanName, scan)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            scanName: this.state.scan.name,
          });

          if (exitAfterSave) {
            this.props.history.push("/scans");
          } else {
            this.props.history.push(`/scans/${this.state.scan.name}`);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteScan() {
    ScanBackend.deleteScan(this.state.scan)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/scans");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  startScan() {
    ScanBackend.startScan(this.state.scan.owner, this.state.scan.name)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully executed"));
          this.getScan();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to execute")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  renderScan() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("scan:New Scan") : i18next.t("scan:Edit Scan")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitScanEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitScanEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteScan()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.owner} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.name} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.displayName} onChange={e => {
              this.updateScanField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Asset"), i18next.t("scan:Asset - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.scan.asset}
              onChange={(value => {
                this.updateScanField("asset", value);
              })} >
              {
                this.state.assets?.map((asset, index) => <Option key={index} value={`${asset.owner}/${asset.name}`}>{`${asset.owner}/${asset.name} (${asset.displayName})`}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("scan:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.scan.provider}
              onChange={(value => {
                this.updateScanField("provider", value);
              })} >
              {
                this.state.providers?.map((provider, index) => <Option key={index} value={provider.name}>{provider.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Command"), i18next.t("scan:Command - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.command} onChange={e => {
              this.updateScanField("command", e.target.value);
            }} placeholder="-sn %s" />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.state} disabled />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Result"), i18next.t("scan:Result - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea value={this.state.scan.resultText} disabled rows={10} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col span={22} offset={2}>
            <Button type="primary" onClick={() => this.startScan()} disabled={this.state.scan.state === "Running"}>
              {i18next.t("asset:Scan")}
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {
          this.state.scan !== null ? this.renderScan() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitScanEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitScanEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteScan()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default ScanEditPage;
