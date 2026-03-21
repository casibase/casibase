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
import * as TextToImageBackend from "../backend/TextToImageBackend";
import {checkProvider} from "./ProviderWidget";

class TestImageWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      testButtonLoading: false,
      imageHtml: "",
    };
  }

  componentDidMount() {
    if (this.props.provider && this.props.provider.category === "Text-to-Image") {
      // Set default test content if empty
      if (this.props.provider.testContent === "") {
        const defaultContent = "A beautiful sunset over a calm ocean.";
        this.props.provider.testContent = defaultContent;
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("testContent", defaultContent);
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.provider?.name !== this.props.provider?.name &&
        this.props.provider?.category === "Text-to-Image") {
      // Set default test content if empty
      if (this.props.provider.testContent === "") {
        const defaultContent = "A beautiful sunset over a calm ocean.";
        this.props.provider.testContent = defaultContent;
        // Call the update function if provided
        if (this.props.onUpdateProvider) {
          this.props.onUpdateProvider("testContent", defaultContent);
        }
      }
    }
  }

  async sendTestImage(provider, originalProvider, text, owner, user) {
    await checkProvider(provider, originalProvider);
    this.setState({testButtonLoading: true, imageHtml: ""});

    try {
      const providerId = `${provider.owner}/${provider.name}`;
      const imageHtml = await TextToImageBackend.generateTextToImage("", providerId, "", text);

      if (imageHtml) {
        if (imageHtml.startsWith("{")) {
          const data = JSON.parse(imageHtml);
          if (data.status === "error") {
            Setting.showMessage("error", data.msg);
          }
        } else {
          this.setState({imageHtml: imageHtml});
        }
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error.message}`);
    } finally {
      this.setState({testButtonLoading: false});
    }
  }

  render() {
    const {provider, originalProvider, account, onUpdateProvider} = this.props;

    if (!provider || provider.category !== "Text-to-Image") {
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
            <Button style={{marginLeft: "10px", marginBottom: "5px"}} type="primary" loading={this.state.testButtonLoading} disabled={!provider.testContent} onClick={() => this.sendTestImage(provider, originalProvider, provider.testContent, account.owner, account.name)} >
              {i18next.t("general:Send")}
            </Button>
          </Col>
        </Row>
        {
          this.state.imageHtml && (
            <Row style={{marginTop: "20px"}}>
              <Col span={2} />
              <Col span={10}>
                <div dangerouslySetInnerHTML={{__html: this.state.imageHtml}} />
              </Col>
            </Row>
          )
        }
      </React.Fragment>
    );
  }
}

export default TestImageWidget;
