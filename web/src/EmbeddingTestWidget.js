// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {Button, Col, Row} from "antd";
import * as Setting from "./Setting";
import i18next from "i18next";
import * as VectorBackend from "./backend/VectorBackend";
import {withRouter} from "react-router-dom";

class EmbeddingTestWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      vectorName: `test-vector-${Date.now()}`,
    };
  }

  generateTestVector = () => {
    const {provider, history} = this.props;
    const testText = "Hello, this is a test";
    const vectorOwner = "admin";
    const vectorName = this.state.vectorName;

    this.setState({loading: true});

    const placeholderVector = {
      owner: vectorOwner,
      name: vectorName,
      displayName: `Test Vector for ${provider.name}`,
      provider: provider.name,
      store: "default-store",
      text: "",
      data: [],
    };

    VectorBackend.addVector(placeholderVector)
      .then(res => {
        if (res.status !== "ok") {
          throw new Error(`Failed to add placeholder vector: ${res.msg}`);
        }

        const updatedVector = {
          ...placeholderVector,
          text: testText,
        };

        return VectorBackend.updateVector(vectorOwner, vectorName, updatedVector);
      })
      .then((res) => {
        if (res.status !== "ok") {
          throw new Error(`Failed to update vector and generate data: ${res.msg}`);
        }
        Setting.showMessage("success", i18next.t("general:Successfully added"));
        history.push(`/vectors/${vectorName}`);
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error.message}`);
      })
      .finally(() => {
        this.setState({loading: false});
      });
  };

  render() {
    if (this.props.provider.category !== "Embedding") {
      return null;
    }

    return (
      <Row style={{marginTop: "20px"}}>
        <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
          {Setting.getLabel(i18next.t("provider:Provider test"), i18next.t("provider:Provider test"))} :
        </Col>
        <Col span={22}>
          <Button type="primary" onClick={this.generateTestVector} loading={this.state.loading}>
            {i18next.t("provider:Provider test")}
          </Button>
        </Col>
      </Row>
    );
  }
}

export default withRouter(EmbeddingTestWidget);
