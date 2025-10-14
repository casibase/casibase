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
      scanOwner: props.match.params.organizationName,
      scanName: props.match.params.scanName,
      scan: null,
      providers: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getScan();
    this.getProviders();
  }

  getScan() {
    ScanBackend.getScan(this.props.account.owner, this.state.scanName)
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

  getProviders() {
    ProviderBackend.getProviders("admin")
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            providers: res.data.filter(provider => provider.category === "Scan"),
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

  submitScanEdit(willExist) {
    const scan = Setting.deepCopy(this.state.scan);
    ScanBackend.updateScan(this.state.scan.owner, this.state.scanName, scan)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            scanName: this.state.scan.name,
          });
          if (willExist) {
            this.props.history.push("/scans");
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
            <Input value={this.state.scan.owner} onChange={e => {
              this.updateScanField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.name} onChange={e => {
              this.updateScanField("name", e.target.value);
            }} />
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
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.scan.provider} onChange={(value => {
              this.updateScanField("provider", value);
            })}>
              {
                this.state.providers.map((provider, index) => <Option key={index} value={`${provider.owner}/${provider.name}`}>{`${provider.owner}/${provider.name}`}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("scan:Target"), i18next.t("scan:Target - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.scan.target} onChange={e => {
              this.updateScanField("target", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Status"), i18next.t("general:Status - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.scan.status} onChange={(value => {
              this.updateScanField("status", value);
            })}>
              {
                [
                  {id: "Pending", name: "Pending"},
                  {id: "Running", name: "Running"},
                  {id: "Completed", name: "Completed"},
                  {id: "Failed", name: "Failed"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("scan:Result"), i18next.t("scan:Result - Tooltip"))} :
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 10, maxRows: 100}} value={this.state.scan.result} onChange={e => {
              this.updateScanField("result", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.scan.state} onChange={(value => {
              this.updateScanField("state", value);
            })}>
              {
                [
                  {id: "Active", name: "Active"},
                  {id: "Inactive", name: "Inactive"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
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
