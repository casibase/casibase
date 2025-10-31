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
import {Button, Col, Input, Radio, Row} from "antd";
import * as Setting from "../Setting";
import i18next from "i18next";
import * as ProviderBackend from "../backend/ProviderBackend";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");

// Max height for the scan result CodeMirror editor to prevent UI overflow
const RESULT_MAX_HEIGHT = "calc(100vh - 400px)";

class TestScanWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scanTarget: "",
      scanCommand: "",
      scanResult: "",
      scanButtonLoading: false,
    };
  }

  getCommandTemplates() {
    const providerType = this.props.provider?.type;

    if (providerType === "RMM") {
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "list", name: "List Updates", command: "list"},
        {id: "get-updates", name: "Get Updates", command: "get-updates"},
        {id: "install", name: "Install Update", command: "install"},
      ];
    }

    // Default Nmap templates
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

    const providerType = this.props.provider.type;

    // Set default path based on provider type
    let defaultPath = "";
    if (providerType === "RMM") {
      defaultPath = "http://localhost:8080"; // RMM agent URL
    } else {
      defaultPath = "/usr/bin/nmap"; // Nmap binary path
    }

    if (this.props.provider.path === "" || this.props.provider.path === undefined) {
      this.props.provider.path = defaultPath;
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("path", defaultPath);
      }
    }

    // Set default network/target for scan
    const defaultNetwork = "127.0.0.1";
    if (this.props.provider.network === "" || this.props.provider.network === undefined) {
      this.props.provider.network = defaultNetwork;
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("network", defaultNetwork);
      }
    }

    // Set default command if empty based on provider type
    const defaultCommand = providerType === "RMM" ? "list" : "-sn %s";
    if (this.props.provider.text === "" || this.props.provider.text === undefined) {
      this.props.provider.text = defaultCommand;
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("text", defaultCommand);
      }
    }

    this.setState({
      scanTarget: this.props.provider.network || defaultNetwork,
      scanCommand: this.props.provider.text || defaultCommand,
      scanResult: this.props.provider.configText || "",
    });
  }

  componentDidMount() {
    this.initializeDefaults();
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

    ProviderBackend.testScan(this.props.provider.owner, this.props.provider.name, this.state.scanTarget, this.state.scanCommand)
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
    const providerType = this.props.provider.type;

    // Dynamic labels and placeholders based on provider type
    const pathLabel = providerType === "RMM" ? "URL" : "Path";
    const pathPlaceholder = providerType === "RMM" ? "http://localhost:8080" : "/usr/bin/nmap";
    const commandPlaceholder = providerType === "RMM" ? "list" : "-sn %s";

    return (
      <div>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(pathLabel, pathLabel)} :
          </Col>
          <Col span={22} >
            <Input
              disabled={isRemote}
              value={this.props.provider.path || ""}
              placeholder={pathPlaceholder}
              onChange={e => {
                if (this.props.onUpdateProvider) {
                  this.props.onUpdateProvider("path", e.target.value);
                }
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Network"), i18next.t("general:Network - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              disabled={isRemote}
              value={this.state.scanTarget}
              placeholder="127.0.0.1"
              onChange={e => {
                this.setState({scanTarget: e.target.value});
                if (this.props.onUpdateProvider) {
                  this.props.onUpdateProvider("network", e.target.value);
                }
              }}
            />
          </Col>
        </Row>
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
              placeholder={commandPlaceholder}
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
