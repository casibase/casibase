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
import {Button, Col, Input, Row} from "antd";
import * as Setting from "../Setting";
import i18next from "i18next";
import * as ProviderBackend from "../backend/ProviderBackend";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");

class TestScanWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scanTarget: "",
      scanResult: "",
      scanButtonLoading: false,
    };
  }

  componentDidMount() {
    if (this.props.provider && this.props.provider.category === "Scan") {
      // Set default network if empty
      if (this.props.provider.network === "") {
        this.props.provider.network = "127.0.0.1";
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("network", "127.0.0.1");
        }
      }
      this.setState({
        scanTarget: this.props.provider.network || "127.0.0.1",
        scanResult: this.props.provider.text || "",
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.provider?.name !== this.props.provider?.name &&
        this.props.provider?.category === "Scan") {
      // Set default network if empty
      if (this.props.provider.network === "") {
        this.props.provider.network = "127.0.0.1";
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("network", "127.0.0.1");
        }
      }
      this.setState({
        scanTarget: this.props.provider.network || "127.0.0.1",
        scanResult: this.props.provider.text || "",
      });
    }
  }

  testScan() {
    this.setState({
      scanButtonLoading: true,
    });

    ProviderBackend.testScan(this.props.provider.owner, this.props.provider.name, this.state.scanTarget)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully executed"));
          this.setState({
            scanResult: res.data,
          });
          // Update the provider text field
          if (this.props.onUpdateProvider) {
            this.props.onUpdateProvider("text", res.data);
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
        {this.state.scanResult && (
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
              />
            </Col>
          </Row>
        )}
      </div>
    );
  }
}

export default TestScanWidget;
