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

class TestScanWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      targetMode: "Manual Input", // "Manual Input" or "Asset"
      scanTarget: "",
      selectedAsset: "",
      selectedProvider: "",
      scanCommand: "",
      scanResult: "",
      scanButtonLoading: false,
      assets: [],
      providers: [],
    };
  }

  componentDidMount() {
    this.loadAssets();
    this.loadProviders();
    this.initializeDefaults();
  }

  componentDidUpdate(prevProps) {
    // Re-initialize if scan or provider changes
    if (this.props.scan && prevProps.scan !== this.props.scan) {
      this.initializeDefaults();
    }
    if (this.props.provider && prevProps.provider?.name !== this.props.provider?.name) {
      this.initializeDefaults();
    }
  }

  loadAssets() {
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
        }
      });
  }

  loadProviders() {
    if (!this.props.account) {
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
        }
      });
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
    // Initialize from scan object (for ScanEditPage)
    if (this.props.scan) {
      const defaultCommand = this.props.scan.command || "-sn %s";
      this.setState({
        targetMode: this.props.scan.asset ? "Asset" : "Manual Input",
        scanTarget: this.props.scan.asset ? "" : "127.0.0.1",
        selectedAsset: this.props.scan.asset || "",
        selectedProvider: this.props.scan.provider || "",
        scanCommand: defaultCommand,
        scanResult: this.props.scan.resultText || "",
      });
      return;
    }

    // Initialize from provider object (for ProviderEditPage)
    if (this.props.provider && this.props.provider.category === "Scan") {
      const defaultCommand = this.props.provider.text || "-sn %s";
      const defaultTarget = this.props.provider.network || "127.0.0.1";

      // Set default network if empty
      if (this.props.provider.network === "" || !this.props.provider.network) {
        this.props.provider.network = defaultTarget;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("network", defaultTarget);
        }
      }

      // Set default command if empty
      if (this.props.provider.text === "" || this.props.provider.text === undefined) {
        this.props.provider.text = defaultCommand;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("text", defaultCommand);
        }
      }

      this.setState({
        targetMode: "Manual Input",
        scanTarget: this.props.provider.network || defaultTarget,
        selectedAsset: "",
        selectedProvider: this.props.provider.name || "",
        scanCommand: defaultCommand,
        scanResult: this.props.provider.configText || "",
      });
    }
  }

  testScan() {
    this.setState({
      scanButtonLoading: true,
    });

    // Determine the target and provider based on mode
    let target = "";
    let provider = "";

    if (this.state.targetMode === "Asset") {
      target = this.state.selectedAsset;
    } else {
      target = this.state.scanTarget;
    }

    // For ProviderEditPage, use the provider passed via props
    // For ScanEditPage, use the selected provider from state
    if (this.props.provider && this.props.provider.category === "Scan") {
      provider = this.props.provider.name;
    } else if (this.state.selectedProvider) {
      provider = this.state.selectedProvider;
    }

    if (!provider) {
      Setting.showMessage("error", i18next.t("general:Please select a provider"));
      this.setState({scanButtonLoading: false});
      return;
    }

    if (!target) {
      Setting.showMessage("error", i18next.t("general:Please enter a target"));
      this.setState({scanButtonLoading: false});
      return;
    }

    ProviderBackend.testScan(this.props.account.name, provider, target, this.state.scanCommand)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully executed"));
          this.setState({
            scanResult: res.data,
          });

          // Save scan result to provider ConfigText field (for ProviderEditPage)
          if (this.props.onUpdateProvider) {
            this.props.onUpdateProvider("configText", res.data);
          }

          // Save scan result to scan ResultText field (for ScanEditPage)
          if (this.props.onUpdateScan) {
            this.props.onUpdateScan("resultText", res.data);
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

  getAssetTypeIcon(assetName) {
    if (!assetName) {
      return null;
    }
    const asset = this.state.assets.find(asset => `${asset.owner}/${asset.name}` === assetName);
    if (!asset) {
      return null;
    }
    const typeIcons = Setting.getAssetTypeIcons();
    return typeIcons[asset.type] || null;
  }

  getProviderLogo(providerName) {
    if (!providerName) {
      return null;
    }
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

  render() {
    // Only render for Scan providers or when scan is provided
    if (!this.props.provider && !this.props.scan) {
      return null;
    }

    if (this.props.provider && this.props.provider.category !== "Scan") {
      return null;
    }

    const isRemote = this.props.provider?.isRemote;
    const isScanEditPage = !!this.props.scan;

    return (
      <div>
        {isScanEditPage && (
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
                  if (this.props.onUpdateScan) {
                    this.props.onUpdateScan("provider", value);
                  }
                }}
              >
                {
                  this.state.providers?.map((provider, index) => {
                    const logo = this.getProviderLogo(provider.name);
                    return (
                      <Option key={index} value={provider.name}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          {logo && <img src={logo} alt={provider.name} style={{width: "16px", height: "16px"}} />}
                          <span>{provider.name}</span>
                        </div>
                      </Option>
                    );
                  })
                }
              </Select>
            </Col>
          </Row>
        )}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("scan:Target mode"), i18next.t("scan:Target mode - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Radio.Group
              disabled={isRemote}
              value={this.state.targetMode}
              onChange={(e) => {
                this.setState({targetMode: e.target.value});
              }}
            >
              <Radio value="Manual Input">{i18next.t("scan:Manual Input")}</Radio>
              <Radio value="Asset">{i18next.t("general:Asset")}</Radio>
            </Radio.Group>
          </Col>
        </Row>
        {this.state.targetMode === "Manual Input" ? (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
              {Setting.getLabel(i18next.t("scan:Target"), i18next.t("scan:Target - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Input
                disabled={isRemote}
                value={this.state.scanTarget}
                placeholder="127.0.0.1 or 192.168.1.0/24"
                onChange={e => {
                  this.setState({scanTarget: e.target.value});
                  if (this.props.onUpdateProvider) {
                    this.props.onUpdateProvider("network", e.target.value);
                  }
                }}
              />
            </Col>
          </Row>
        ) : (
          <Row style={{marginTop: "20px"}} >
            <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:Asset"), i18next.t("scan:Asset - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select
                virtual={false}
                style={{width: "100%"}}
                value={this.state.selectedAsset}
                onChange={(value) => {
                  this.setState({selectedAsset: value});
                  if (this.props.onUpdateScan) {
                    this.props.onUpdateScan("asset", value);
                  }
                }}
              >
                {
                  this.state.assets?.map((asset, index) => {
                    const typeIcons = Setting.getAssetTypeIcons();
                    const icon = typeIcons[asset.type];
                    return (
                      <Option key={index} value={`${asset.owner}/${asset.name}`}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          {icon && <img src={icon} alt={asset.type} style={{width: "16px", height: "16px"}} />}
                          <span>{`${asset.owner}/${asset.name} (${asset.displayName})`}</span>
                        </div>
                      </Option>
                    );
                  })
                }
              </Select>
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
                  if (this.props.onUpdateScan) {
                    this.props.onUpdateScan("command", template.command);
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
                if (this.props.onUpdateScan) {
                  this.props.onUpdateScan("command", e.target.value);
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
            <CodeMirror
              value={this.state.scanResult}
              options={{
                mode: "text/plain",
                theme: "material-darker",
                readOnly: true,
                lineNumbers: true,
              }}
              editorDidMount={(editor) => {
                // Set minimum height to 10 lines
                editor.setSize(null, "auto");
                const lineHeight = editor.defaultTextHeight();
                const minHeight = lineHeight * 10;
                editor.getWrapperElement().style.minHeight = `${minHeight}px`;
              }}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default TestScanWidget;
