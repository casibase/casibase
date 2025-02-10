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
import {Button, Card, Col, Input, InputNumber, Row, Select} from "antd";
import * as WordsetBackend from "./backend/WordsetBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import FactorTable from "./FactorTable";
import WordsetGraph from "./WordsetGraph";
import * as FactorsetBackend from "./backend/FactorsetBackend";

const {Option} = Select;

class WordsetEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      wordsetName: props.match.params.wordsetName,
      wordset: null,
      factorsets: null,
      matchLoading: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.getWordset();
    this.getFactorsets();
  }

  getWordset() {
    WordsetBackend.getWordset(this.props.account.name, this.state.wordsetName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            wordset: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get wordset: ${res.msg}`);
        }
      });
  }

  getFactorsets() {
    FactorsetBackend.getFactorsets(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            factorsets: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get factorsets: ${res.msg}`);
        }
      });
  }

  parseWordsetField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateWordsetField(key, value) {
    value = this.parseWordsetField(key, value);

    const wordset = this.state.wordset;
    wordset[key] = value;
    this.setState({
      wordset: wordset,
    });
  }

  renderWordset() {
    const allWords = this.state.wordset?.factors.length;
    const validWords = this.state.wordset?.factors.filter(factor => factor.data.length !== 0).length;

    return (
      <Card size="small" title={
        <div>
          {i18next.t("wordset:Edit Wordset")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitWordsetEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitWordsetEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.wordset.name} onChange={e => {
              this.updateWordsetField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.wordset.displayName} onChange={e => {
              this.updateWordsetField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Factorset")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.wordset.factorset} onChange={(value => {this.updateWordsetField("factorset", value);})}>
              {
                this.state.factorsets?.map((factorset, index) => <Option key={index} value={factorset.name}>{factorset.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Match")}:
          </Col>
          <Col span={22} >
            <Button loading={this.state.matchLoading} type="primary" onClick={() => {
              this.setState({
                matchLoading: true,
              });
              WordsetBackend.getWordsetMatch(this.props.account.name, this.state.wordsetName)
                .then((res) => {
                  if (res.status === "ok") {
                    this.setState({
                      wordset: res.data,
                      matchLoading: false,
                    });
                  } else {
                    Setting.showMessage("error", `Failed to get wordset: ${res.msg}`);
                  }
                });
            }}>{i18next.t("wordset:Match")}</Button>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Matched")}:
          </Col>
          <Col span={22} >
            <Input value={`${Setting.getPercentage(allWords === 0 ? 0 : validWords / allWords)}% (${validWords} / ${allWords})`} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Distance limit")}:
          </Col>
          <Col span={22} >
            <InputNumber value={this.state.wordset.distanceLimit} onChange={value => {
              this.updateWordsetField("distanceLimit", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("wordset:Words")}:
          </Col>
          <Col span={22} >
            <FactorTable
              title={i18next.t("wordset:Words")}
              table={this.state.wordset.factors}
              wordset={this.state.wordset}
              onUpdateTable={(value) => {this.updateWordsetField("factors", value);}}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Preview")}:
          </Col>
          <Col span={22} >
            <WordsetGraph wordset={this.state.wordset} wordsetName={this.state.wordset.name} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitWordsetEdit(exitAfterSave) {
    const wordset = Setting.deepCopy(this.state.wordset);
    WordsetBackend.updateWordset(this.state.wordset.owner, this.state.wordsetName, wordset)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              wordsetName: this.state.wordset.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/wordsets");
            } else {
              this.props.history.push(`/wordsets/${this.state.wordset.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateWordsetField("name", this.state.wordsetName);
          }
        } else {
          Setting.showMessage("error", `failed to save: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `failed to save: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.wordset !== null ? this.renderWordset() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitWordsetEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitWordsetEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default WordsetEditPage;
