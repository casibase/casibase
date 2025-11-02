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
import {Button, Col, Input, Radio, Row, Select} from "antd";
import * as Setting from "../Setting";
import i18next from "i18next";
import * as ProviderBackend from "../backend/ProviderBackend";
import * as AssetBackend from "../backend/AssetBackend";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");

const {Option} = Select;

// Max height for the scan result CodeMirror editor to prevent UI overflow
const RESULT_MAX_HEIGHT = "calc(100vh - 400px)";

class TestScanWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      targetMode: "manual", // "asset" or "manual"
      selectedAsset: "",
      scanTarget: "",
      scanCommand: "",
      scanResult: "",
      scanButtonLoading: false,
      assets: [],
      providers: [],
      selectedProvider: "",
    };
  }

  getCommandTemplates() {
    return [
      {id: "custom", name: "Custom", command: ""},
      {id: "ping", name: "Ping Scan", command: "-sn %s"},
      {id: "quick", name: "Quick Scan", command: "-T4 -F %s"},
      {id: "intense", name: "Intense Scan", command: "-T4 -A -v %s"},
      {id: "comprehensive", name: "Comprehensive Scan", command: "-sS -sU -T4 -A -v %s"},
      {id: "port", name: "Port Scan", command: "-p 1-65535 %s"},
      {id: "os", name: "OS Detection", command: "-O %s"},
      {id: "service", name: "Service Version Detection", command: "-sV %s"},
    ];
  }

  initializeDefaults() {
    if (!this.props.provider || this.props.provider.category !== "Scan") {
      return;
    }

    // Set default network if empty
    if (this.props.provider.network === "") {
      this.props.provider.network = "127.0.0.1";
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("network", "127.0.0.1");
      }
    }

    // Set default command if empty
    const defaultCommand = "-sn %s";
    if (this.props.provider.text === "" || this.props.provider.text === undefined) {
      this.props.provider.text = defaultCommand;
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("text", defaultCommand);
      }
    }

    this.setState({
      scanTarget: this.props.provider.network || "127.0.0.1",
      scanCommand: this.props.provider.text || defaultCommand,
      scanResult: this.props.provider.configText || "",
    });
  }

  getAssets() {
    if (!this.props.account) {
      return;
    }
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
    if (!this.props.account || !this.props.showProviderSelection) {
      return;
    }
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

  componentDidMount() {
    this.initializeDefaults();
    this.getAssets();
    this.getProviders();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.provider?.name !== this.props.provider?.name) {
      this.initializeDefaults();
    }
  }

  testScan() {
    this.setState({
      scanButtonLoading: true,
    });

    // Determine the target based on mode
    let target = this.state.scanTarget;
    if (this.state.targetMode === "asset" && this.state.selectedAsset) {
      // Extract the asset and get its network address
      const asset = this.state.assets.find(a => `${a.owner}/${a.name}` === this.state.selectedAsset);
      if (asset && asset.network) {
        target = asset.network;
      }
    }

    // Determine the provider
    let providerOwner = this.props.provider?.owner || "admin";
    let providerName = this.props.provider?.name || "";

    // If provider selection is enabled and a provider is selected, use it
    if (this.props.showProviderSelection && this.state.selectedProvider) {
      const providerParts = this.state.selectedProvider.split("/");
      if (providerParts.length === 2) {
        providerOwner = providerParts[0];
        providerName = providerParts[1];
      }
    }

    ProviderBackend.testScan(providerOwner, providerName, target, this.state.scanCommand)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully executed"));
          this.setState({
            scanResult: res.data,
          });
          // Save scan result to ConfigText field
          if (this.props.onUpdateProvider) {
            this.props.onUpdateProvider("configText", res.data);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to execute")}: ${res.msg}`);
          this.setState({
            scanResult: `Error: ${res.msg}`,
          });
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to execute")}: ${error}`);
        this.setState({
          scanResult: `Error: ${error}`,
        });
      })
      .finally(() => {
        this.setState({scanButtonLoading: false});
      });
  }

  render() {
    if (!this.props.provider || this.props.provider.category !== "Scan") {
      return null;
    }

    const isRemote = this.props.provider.isRemote;

    return (
      <div>
        {this.props.showProviderSelection && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:Provider"), i18next.t("scan:Provider - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select
                virtual={false}
                style={{width: "100%"}}
                value={this.state.selectedProvider}
                onChange={(value) => {
                  this.setState({selectedProvider: value});
                }}
              >
                {
                  this.state.providers?.map((provider, index) =>
                    <Option key={index} value={`${provider.owner}/${provider.name}`}>
                      {`${provider.owner}/${provider.name}`}
                    </Option>
                  )
                }
              </Select>
            </Col>
          </Row>
        )}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Target mode"), i18next.t("general:Target mode - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Radio.Group
              disabled={isRemote}
              value={this.state.targetMode}
              onChange={(e) => {
                this.setState({targetMode: e.target.value});
              }}
            >
              <Radio value="manual">{i18next.t("general:Manual input")}</Radio>
              <Radio value="asset">{i18next.t("general:Asset")}</Radio>
            </Radio.Group>
          </Col>
        </Row>
        {this.state.targetMode === "asset" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:Asset"), i18next.t("scan:Asset - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select
                virtual={false}
                style={{width: "100%"}}
                value={this.state.selectedAsset}
                disabled={isRemote}
                onChange={(value) => {
                  this.setState({selectedAsset: value});
                }}
              >
                {
                  this.state.assets?.map((asset, index) =>
                    <Option key={index} value={`${asset.owner}/${asset.name}`}>
                      {`${asset.owner}/${asset.name} (${asset.displayName})`}
                    </Option>
                  )
                }
              </Select>
            </Col>
          </Row>
        )}
        {this.state.targetMode === "manual" && (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:Network"), i18next.t("general:Network - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input
                disabled={isRemote}
                value={this.state.scanTarget}
                onChange={e => {
                  this.setState({scanTarget: e.target.value});
                  if (this.props.onUpdateProvider) {
                    this.props.onUpdateProvider("network", e.target.value);
                  }
                }}
              />
            </Col>
          </Row>
        )}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Template"), i18next.t("general:Template - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Radio.Group
              disabled={isRemote}
              value={this.getCommandTemplates().find(t => t.command === this.state.scanCommand)?.id || "custom"}
              onChange={(e) => {
                const value = e.target.value;
                const template = this.getCommandTemplates().find(t => t.id === value);
                if (template && template.command !== "") {
                  this.setState({scanCommand: template.command});
                  if (this.props.onUpdateProvider) {
                    this.props.onUpdateProvider("text", template.command);
                  }
                }
              }}
            >
              {
                this.getCommandTemplates().map((item) => (
                  <Radio key={item.id} value={item.id}>{item.name}</Radio>
                ))
              }
            </Radio.Group>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("container:Command"), i18next.t("container:Command - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              disabled={isRemote}
              value={this.state.scanCommand}
              placeholder="-sn %s"
              onChange={e => {
                this.setState({scanCommand: e.target.value});
                if (this.props.onUpdateProvider) {
                  this.props.onUpdateProvider("text", e.target.value);
                }
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Provider test"), i18next.t("provider:Provider test - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Button
              disabled={isRemote}
              style={{marginBottom: "10px"}}
              loading={this.state.scanButtonLoading}
              type="primary"
              onClick={() => this.testScan()}
            >
              {i18next.t("asset:Scan")}
            </Button>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Result"), i18next.t("general:Result - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{maxHeight: RESULT_MAX_HEIGHT, overflow: "auto"}}>
              <CodeMirror
                value={this.state.scanResult}
                options={{
                  mode: "text/plain",
                  theme: "material-darker",
                  readOnly: true,
                  lineNumbers: true,
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default TestScanWidget;
