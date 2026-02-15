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
import * as AssetBackend from "../backend/AssetBackend";
import * as ProviderBackend from "../backend/ProviderBackend";
import * as ScanBackend from "../backend/ScanBackend";
import {ScanResultRenderer} from "./ScanResultRenderer";

const {Option} = Select;

const DEFAULT_SCAN_TARGET = "127.0.0.1";
const DEFAULT_SCAN_COMMAND = "-sn %s";
const DEFAULT_OS_PATCH_COMMAND = "all";
const DEFAULT_NUCLEI_COMMAND = "-u %s -jsonl";
const DEFAULT_ZAP_COMMAND = "-cmd -quickurl %s -quickout /dev/stdout -quickprogress";
const DEFAULT_SUBFINDER_COMMAND = "-d %s -json";
const DEFAULT_HTTPX_COMMAND = "-u %s -json";
const DEFAULT_PROVIDER_TYPE = "Nmap";

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
      scanRawResult: "",
      scanButtonLoading: false,
      assets: [],
      providers: [],
    };
    this.pollInterval = null;
    this.pollTimeout = null;
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

  componentWillUnmount() {
    // Clean up polling intervals
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
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
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get assets")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get assets")}: ${error}`);
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
          }, () => {
            // For new scans with no provider set, select the first provider by default
            if (this.props.scan && !this.props.scan.provider && scanProviders.length > 0) {
              const firstProvider = scanProviders[0];
              this.setDefaultProviderAndCommand(firstProvider.name);
            }
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get providers")}: ${res.msg}`);
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get providers")}: ${error}`);
      });
  }

  getProviderType() {
    // For ProviderEditPage, get type from props.provider
    if (this.props.provider && this.props.provider.category === "Scan") {
      return this.props.provider.type;
    }
    // For ScanEditPage, get type from selected provider
    if (this.props.scan && this.state.selectedProvider) {
      const selectedProviderObj = this.state.providers.find(p => p.name === this.state.selectedProvider);
      if (selectedProviderObj) {
        return selectedProviderObj.type;
      }
    }
    // Default to Nmap if provider type cannot be determined
    return DEFAULT_PROVIDER_TYPE;
  }

  getCommandTemplates() {
    const providerType = this.getProviderType();

    // Return templates based on provider type
    if (providerType === "OS Patch") {
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "all", name: "All Patches", command: "all"},
        {id: "available", name: "Available Patches", command: "available"},
        {id: "installed", name: "Installed Patches", command: "installed"},
      ];
    } else if (providerType === "Nuclei") {
      // Nuclei templates
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "basic", name: "Basic Scan", command: "-u %s -jsonl"},
        {id: "severity-critical", name: "Critical Severity", command: "-u %s -jsonl -s critical"},
        {id: "severity-high", name: "High Severity", command: "-u %s -jsonl -s high"},
        {id: "severity-medium", name: "Medium Severity", command: "-u %s -jsonl -s medium"},
        {id: "cve", name: "CVE Templates", command: "-u %s -jsonl -t cves/"},
        {id: "misconfiguration", name: "Misconfigurations", command: "-u %s -jsonl -t misconfiguration/"},
        {id: "exposures", name: "Exposures", command: "-u %s -jsonl -t exposures/"},
        {id: "vulnerabilities", name: "All Vulnerabilities", command: "-u %s -jsonl -t vulnerabilities/"},
      ];
    } else if (providerType === "ZAP") {
      // ZAP templates
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "quick", name: "Quick Scan", command: "-cmd -quickurl %s -quickout /dev/stdout -quickprogress"},
        {id: "baseline", name: "Baseline Scan", command: "-cmd -quickurl %s -quickout /dev/stdout"},
        {id: "full", name: "Full Scan", command: "-daemon -quickurl %s -quickout /dev/stdout"},
        {id: "ajax-spider", name: "AJAX Spider", command: "-cmd -quickurl %s -quickout /dev/stdout -ajax"},
      ];
    } else if (providerType === "Subfinder") {
      // Subfinder templates
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "basic", name: "Basic Scan", command: "-d %s -json"},
        {id: "silent", name: "Silent Mode", command: "-d %s -json -silent"},
        {id: "recursive", name: "Recursive Scan", command: "-d %s -json -recursive"},
        {id: "all-sources", name: "All Sources", command: "-d %s -json -all"},
        {id: "passive", name: "Passive Only", command: "-d %s -json -passive"},
      ];
    } else if (providerType === "httpx") {
      // httpx templates
      return [
        {id: "custom", name: "Custom", command: ""},
        {id: "basic", name: "Basic Scan", command: "-u %s -json"},
        {id: "silent", name: "Silent Mode", command: "-u %s -json -silent"},
        {id: "tech-detect", name: "Technology Detection", command: "-u %s -json -tech-detect"},
        {id: "status-code", name: "With Status Code", command: "-u %s -json -status-code"},
        {id: "follow-redirects", name: "Follow Redirects", command: "-u %s -json -follow-redirects"},
        {id: "screenshot", name: "With Screenshot", command: "-u %s -json -screenshot"},
      ];
    } else {
      // Nmap templates
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
  }

  getDefaultCommand(providerType) {
    if (providerType === "OS Patch") {
      return DEFAULT_OS_PATCH_COMMAND;
    } else if (providerType === "Nuclei") {
      return DEFAULT_NUCLEI_COMMAND;
    } else if (providerType === "ZAP") {
      return DEFAULT_ZAP_COMMAND;
    } else if (providerType === "Subfinder") {
      return DEFAULT_SUBFINDER_COMMAND;
    } else if (providerType === "httpx") {
      return DEFAULT_HTTPX_COMMAND;
    }
    return DEFAULT_SCAN_COMMAND;
  }

  setDefaultProviderAndCommand(providerName) {
    // Get the provider type
    const providerObj = this.state.providers.find(p => p.name === providerName);
    if (!providerObj) {
      return;
    }

    const providerType = providerObj.type;
    const defaultCommand = this.getDefaultCommand(providerType);

    // Update state (template radio button will auto-update based on matching command)
    this.setState({
      selectedProvider: providerName,
      scanCommand: defaultCommand,
    });

    // Update the scan object
    if (this.props.onUpdateScan) {
      this.props.onUpdateScan("provider", providerName);
      this.props.onUpdateScan("command", defaultCommand);
    }
  }

  initializeDefaults() {
    // Initialize from scan object (for ScanEditPage)
    if (this.props.scan) {
      // Determine the provider type to use appropriate default command
      const providerType = this.getProviderType();
      const providerTypeDefault = this.getDefaultCommand(providerType);

      const defaultCommand = this.props.scan.command || providerTypeDefault;
      const targetMode = this.props.scan.targetMode || (this.props.scan.asset ? "Asset" : "Manual Input");
      const scanTarget = targetMode === "Asset" ? "" : (this.props.scan.target || DEFAULT_SCAN_TARGET);

      this.setState({
        targetMode: targetMode,
        scanTarget: scanTarget,
        selectedAsset: this.props.scan.asset || "",
        selectedProvider: this.props.scan.provider || "",
        scanCommand: defaultCommand,
        scanResult: this.props.scan.result || "",
        scanRawResult: this.props.scan.rawResult || "",
      });
      return;
    }

    // Initialize from provider object (for ProviderEditPage)
    if (this.props.provider && this.props.provider.category === "Scan") {
      const providerTypeDefault = this.getDefaultCommand(this.props.provider.type);
      const defaultCommand = this.props.provider.text || providerTypeDefault;
      const targetMode = this.props.provider.targetMode || "Manual Input";
      const defaultTarget = targetMode === "Asset" ? "" : (this.props.provider.target || this.props.provider.network || DEFAULT_SCAN_TARGET);

      // Set default values if empty
      if (!this.props.provider.target && !this.props.provider.network && targetMode !== "Asset") {
        this.props.provider.target = defaultTarget;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("target", defaultTarget);
        }
      }

      if (!this.props.provider.text) {
        this.props.provider.text = defaultCommand;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("text", defaultCommand);
        }
      }

      if (!this.props.provider.targetMode) {
        this.props.provider.targetMode = targetMode;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("targetMode", targetMode);
        }
      }

      this.setState({
        targetMode: targetMode,
        scanTarget: defaultTarget,
        selectedAsset: this.props.provider.asset || "",
        selectedProvider: this.props.provider.name || "",
        scanCommand: defaultCommand,
        scanResult: this.props.provider.configText || "",
        scanRawResult: this.props.provider.rawText || "",
      });
    }
  }

  clearScan() {
    // Clear all results, runner, errorText, and set state to "Created"
    this.setState({
      scanResult: "",
      scanRawResult: "",
    });

    // Clear results, runner, errorText, resultSummary, and set state to "Created" in parent component
    if (this.props.onUpdateProvider) {
      this.props.onUpdateProvider("configText", "");
      this.props.onUpdateProvider("rawText", "");
      this.props.onUpdateProvider("runner", "");
      this.props.onUpdateProvider("errorText", "");
      this.props.onUpdateProvider("resultSummary", "");
      this.props.onUpdateProvider("state", "Created");
    }
    if (this.props.onUpdateScan) {
      this.props.onUpdateScan("result", "");
      this.props.onUpdateScan("rawResult", "");
      this.props.onUpdateScan("runner", "");
      this.props.onUpdateScan("errorText", "");
      this.props.onUpdateScan("resultSummary", "");
      this.props.onUpdateScan("state", "Created");
    }

    Setting.showMessage("success", i18next.t("general:Successfully cleared"));
  }

  testScan() {
    // Clear previous results first
    this.setState({
      scanButtonLoading: true,
      scanResult: "",
      scanRawResult: "",
    });

    // Clear results, runner, errorText, and resultSummary in parent component
    if (this.props.onUpdateProvider) {
      this.props.onUpdateProvider("configText", "");
      this.props.onUpdateProvider("rawText", "");
      this.props.onUpdateProvider("runner", "");
      this.props.onUpdateProvider("errorText", "");
      this.props.onUpdateProvider("resultSummary", "");
    }
    if (this.props.onUpdateScan) {
      this.props.onUpdateScan("result", "");
      this.props.onUpdateScan("rawResult", "");
      this.props.onUpdateScan("runner", "");
      this.props.onUpdateScan("errorText", "");
      this.props.onUpdateScan("resultSummary", "");
    }

    // Determine parameters based on context
    let provider = "";
    let scan = "";
    const targetMode = this.state.targetMode;
    const target = this.state.scanTarget;
    const asset = this.state.selectedAsset;
    const command = this.state.scanCommand;
    let saveToScan = false;

    // For ProviderEditPage, use the provider passed via props
    if (this.props.provider && this.props.provider.category === "Scan") {
      provider = `${this.props.provider.owner}/${this.props.provider.name}`;
      saveToScan = false;
    } else if (this.props.scan) {
      const providerObj = this.state.providers.find(p => p.name === this.state.selectedProvider);
      if (providerObj) {
        provider = `${providerObj.owner}/${providerObj.name}`;
      }
      scan = `${this.props.scan.owner}/${this.props.scan.name}`;
      saveToScan = true; // Scan edit page saves results to scan object
    }

    if (!provider) {
      Setting.showMessage("error", i18next.t("general:Please select a provider"));
      this.setState({scanButtonLoading: false});
      return;
    }

    if (targetMode === "Manual Input" && !target) {
      Setting.showMessage("error", i18next.t("general:Please enter a target"));
      this.setState({scanButtonLoading: false});
      return;
    }

    if (targetMode === "Asset" && !asset) {
      Setting.showMessage("error", i18next.t("general:Please select an asset"));
      this.setState({scanButtonLoading: false});
      return;
    }

    // Save widget state to parent component
    this.saveWidgetState();

    // Save to DB first (without showing toast), then execute scan
    this.saveToDB()
      .then(() => {
        // Call unified scan-asset API after saving
        return AssetBackend.scanAsset(provider, scan, targetMode, target, asset, command, saveToScan);
      })
      .then((res) => {
        if (res.status === "ok") {
          // For scan edit page (async execution), start polling for results
          if (saveToScan && scan) {
            Setting.showMessage("success", i18next.t("general:Scan started, waiting for results..."));
            this.pollScanResults(scan);
          } else {
            // For provider edit page (sync execution), show results immediately
            Setting.showMessage("success", i18next.t("general:Successfully executed"));

            // res.data now contains {rawResult, result, resultSummary, runner}
            const {rawResult = "", result = "", resultSummary = "", runner = ""} = res.data;

            this.setState({
              scanResult: result,
              scanRawResult: rawResult,
              scanButtonLoading: false,
            });

            // Save scan results to provider fields (for ProviderEditPage)
            if (this.props.onUpdateProvider) {
              this.props.onUpdateProvider("configText", result);
              this.props.onUpdateProvider("rawText", rawResult);
              this.props.onUpdateProvider("resultSummary", resultSummary);
              this.props.onUpdateProvider("runner", runner);
            }
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to execute")}: ${res.msg}`);
          this.setState({
            scanResult: `Error: ${res.msg}`,
            scanRawResult: "",
            scanButtonLoading: false,
          });
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to execute")}: ${error}`);
        this.setState({
          scanResult: `Error: ${error}`,
          scanRawResult: "",
          scanButtonLoading: false,
        });
      });
  }

  saveToDB() {
    // Save scan or provider to DB without showing toast
    if (this.props.scan) {
      // For ScanEditPage
      const scanCopy = Setting.deepCopy(this.props.scan);
      return ScanBackend.updateScan(this.props.scan.owner, this.props.scan.name, scanCopy)
        .then((res) => {
          if (res.status === "ok") {
            return Promise.resolve();
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
            return Promise.reject(res.msg);
          }
        })
        .catch((error) => {
          const errorMsg = typeof error === "string" ? error : (error.message || String(error));
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${errorMsg}`);
          this.setState({scanButtonLoading: false});
          return Promise.reject(error);
        });
    } else if (this.props.provider && this.props.provider.category === "Scan") {
      // For ProviderEditPage
      const providerCopy = Setting.deepCopy(this.props.provider);
      return ProviderBackend.updateProvider(this.props.provider.owner, this.props.provider.name, providerCopy)
        .then((res) => {
          if (res.status === "ok") {
            return Promise.resolve();
          } else {
            Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
            return Promise.reject(res.msg);
          }
        })
        .catch((error) => {
          const errorMsg = typeof error === "string" ? error : (error.message || String(error));
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${errorMsg}`);
          this.setState({scanButtonLoading: false});
          return Promise.reject(error);
        });
    } else {
      // No save needed
      return Promise.resolve();
    }
  }

  pollScanResults(scanId) {
    // Clear any existing polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }

    this.pollInterval = setInterval(() => {
      ScanBackend.getScan(this.props.account.name, scanId.split("/")[1])
        .then((res) => {
          if (res.status === "ok" && res.data) {
            const scanData = res.data;

            // Check if scan is complete (Completed or Failed state)
            if (scanData.state === "Completed" || scanData.state === "Failed") {
              clearInterval(this.pollInterval);
              clearTimeout(this.pollTimeout);
              this.pollInterval = null;
              this.pollTimeout = null;

              this.setState({
                scanResult: scanData.result || "",
                scanRawResult: scanData.rawResult || "",
                scanButtonLoading: false,
              });

              // Update parent component
              if (this.props.onUpdateScan) {
                this.props.onUpdateScan("result", scanData.result || "");
                this.props.onUpdateScan("rawResult", scanData.rawResult || "");
                this.props.onUpdateScan("resultSummary", scanData.resultSummary || "");
                this.props.onUpdateScan("state", scanData.state);
                this.props.onUpdateScan("runner", scanData.runner || "");
                this.props.onUpdateScan("errorText", scanData.errorText || "");
              }

              if (scanData.state === "Completed") {
                Setting.showMessage("success", i18next.t("general:Scan completed successfully"));
              } else {
                Setting.showMessage("error", i18next.t("general:Scan failed"));
              }
            }
          }
        })
        .catch((error) => {
          clearInterval(this.pollInterval);
          clearTimeout(this.pollTimeout);
          this.pollInterval = null;
          this.pollTimeout = null;
          Setting.showMessage("error", `${i18next.t("general:Failed to get scan results")}: ${error}`);
          this.setState({scanButtonLoading: false});
        });
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes to prevent infinite polling
    this.pollTimeout = setTimeout(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      this.pollTimeout = null;
      if (this.state.scanButtonLoading) {
        Setting.showMessage("warning", i18next.t("general:Scan is taking longer than expected"));
        this.setState({scanButtonLoading: false});
      }
    }, 300000);
  }

  clearFieldsByTargetMode(newMode) {
    // Clear asset when switching to Manual Input, clear target when switching to Asset
    if (newMode === "Manual Input") {
      this.setState({selectedAsset: ""});
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("asset", "");
      }
      if (this.props.onUpdateScan) {
        this.props.onUpdateScan("asset", "");
      }
    } else if (newMode === "Asset") {
      this.setState({scanTarget: ""});
      if (this.props.onUpdateProvider) {
        this.props.onUpdateProvider("target", "");
      }
      if (this.props.onUpdateScan) {
        this.props.onUpdateScan("target", "");
      }
    }
  }

  saveWidgetState() {
    // Save all widget field values to DB
    if (this.props.onUpdateProvider) {
      // For ProviderEditPage - save to Provider fields
      this.props.onUpdateProvider("targetMode", this.state.targetMode);
      this.props.onUpdateProvider("target", this.state.targetMode === "Asset" ? "" : this.state.scanTarget);
      this.props.onUpdateProvider("asset", this.state.selectedAsset);
      this.props.onUpdateProvider("text", this.state.scanCommand); // Command is saved to text field
    }

    if (this.props.onUpdateScan) {
      // For ScanEditPage - save to Scan fields
      this.props.onUpdateScan("targetMode", this.state.targetMode);
      this.props.onUpdateScan("target", this.state.targetMode === "Asset" ? "" : this.state.scanTarget);
      this.props.onUpdateScan("asset", this.state.selectedAsset);
      this.props.onUpdateScan("command", this.state.scanCommand);
    }
  }

  getAssetTypeIcon(assetName) {
    if (!assetName) {
      return null;
    }
    const asset = this.state.assets.find(asset => asset.name === assetName);
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

  renderScanResult() {
    const {scanResult, scanRawResult} = this.state;
    const providerType = this.getProviderType();

    return (
      <ScanResultRenderer
        scanResult={scanResult}
        scanRawResult={scanRawResult}
        providerType={providerType}
        provider={this.props.provider}
        scan={this.props.scan}
        onRefresh={() => this.testScan()}
        minHeight="300px"
      />
    );
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
              {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
            </Col>
            <Col span={22} >
              <Select
                virtual={false}
                style={{width: "100%"}}
                value={this.state.selectedProvider}
                onChange={(value) => {
                  // Reset command to defaults when provider changes (template auto-updates based on command)
                  this.setDefaultProviderAndCommand(value);
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
                const newMode = e.target.value;
                this.setState({targetMode: newMode});
                this.clearFieldsByTargetMode(newMode);
                if (this.props.onUpdateProvider) {
                  this.props.onUpdateProvider("targetMode", newMode);
                }
                if (this.props.onUpdateScan) {
                  this.props.onUpdateScan("targetMode", newMode);
                }
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
                  const newValue = e.target.value;
                  this.setState({scanTarget: newValue});
                  if (this.props.onUpdateProvider) {
                    this.props.onUpdateProvider("target", newValue);
                  }
                  if (this.props.onUpdateScan) {
                    this.props.onUpdateScan("target", newValue);
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
                  if (this.props.onUpdateProvider) {
                    this.props.onUpdateProvider("asset", value);
                  }
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
                      <Option key={index} value={asset.name}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          {icon && <img src={icon} alt={asset.type} style={{width: "16px", height: "16px"}} />}
                          <span>{`${asset.displayName} (${asset.name})`}</span>
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
            {Setting.getLabel(i18next.t("general:Action"), i18next.t("general:Action - Tooltip"))} :
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
            <Button
              disabled={isRemote}
              style={{marginBottom: "10px", marginLeft: "10px"}}
              onClick={() => this.clearScan()}
            >
              {i18next.t("general:Clear")}
            </Button>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={Setting.isMobile() ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Result"), i18next.t("general:Result - Tooltip"))} :
          </Col>
          <Col span={22} >
            {this.renderScanResult()}
          </Col>
        </Row>
      </div>
    );
  }
}

export default TestScanWidget;
