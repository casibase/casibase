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
import * as VectorBackend from "../backend/VectorBackend";
import {checkProvider} from "./ProviderWidget";

const {TextArea} = Input;

class TestEmbedWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      testButtonLoading: false,
      embeddingResult: null,
    };
  }

  componentDidMount() {
    if (this.props.provider && this.props.provider.category === "Embedding") {
      // Set default test content if empty
      if (this.props.provider.testContent === "") {
        const defaultContent = "This is a sample text for embedding generation.";
        this.props.provider.testContent = defaultContent;
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("testContent", defaultContent);
        }
      }
    }
  }

  async sendTestEmbedding(provider, originalProvider, text) {
    await checkProvider(provider, originalProvider);
    this.setState({testButtonLoading: true, embeddingResult: null});

    try {
      const testVectorName = `test_${provider.name}`;

      const testVector = {
        owner: "admin",
        name: testVectorName,
        provider: provider.name,
        text: "",
      };

      await VectorBackend.deleteVector(testVector);

      // Create new empty vector
      const addResult = await VectorBackend.addVector(testVector);
      if (addResult.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${addResult.msg}`);
        return;
      }

      testVector.text = text;
      const updateResult = await VectorBackend.updateVector("admin", testVectorName, testVector);
      if (updateResult.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${updateResult.msg}`);
        return;
      }

      // Get generated vector data
      const vectorResult = await VectorBackend.getVector("admin", testVectorName);
      if (vectorResult.status === "ok" && vectorResult.data && vectorResult.data.data) {
        this.setState({
          embeddingResult: vectorResult.data.data,
        });
      } else {
        Setting.showMessage("error", i18next.t("general:Failed to get"));
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error.message}`);
    } finally {
      this.setState({testButtonLoading: false});
    }
  }

  render() {
    const {provider, originalProvider, onUpdateProvider} = this.props;

    if (!provider || provider.category !== "Embedding") {
      return null;
    }

    return (
      <React.Fragment>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Provider test"), i18next.t("provider:Provider test - Tooltip"))} :
          </Col>
          <Col span={10} >
            <Input.TextArea rows={1} autoSize={{minRows: 1, maxRows: 5}} value={provider.testContent} onChange={e => {onUpdateProvider("testContent", e.target.value);}} />
          </Col>
          <Col span={6} >
            <Button style={{marginLeft: "10px", marginBottom: "5px"}} type="primary" loading={this.state.testButtonLoading} disabled={!provider.testContent} onClick={() => this.sendTestEmbedding(provider, originalProvider, provider.testContent, this.props.account)}>
              {i18next.t("general:Refresh Vectors")}
            </Button>
          </Col>
        </Row>
        {this.state.embeddingResult && (
          <Row style={{marginTop: "10px"}}>
            <Col span={2}></Col>
            <Col span={20}>
              <div style={{border: "1px solid #d9d9d9", borderRadius: "6px", padding: "10px", backgroundColor: "#fafafa"}}>
                <div><strong>{i18next.t("general:Data")}:</strong></div>
                <TextArea autoSize={{minRows: 3, maxRows: 10}} value={this.state.embeddingResult ? this.state.embeddingResult.join(", ") : ""} readOnly style={{marginTop: "5px", fontFamily: "monospace", fontSize: "12px"}} />
              </div>
            </Col>
          </Row>
        )}
      </React.Fragment>
    );
  }
}

export default TestEmbedWidget;
