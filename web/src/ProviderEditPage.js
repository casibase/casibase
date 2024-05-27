// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import {AutoComplete, Button, Card, Col, Input, InputNumber, Row, Select, Slider} from "antd";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import {LinkOutlined} from "@ant-design/icons";

const {Option} = Select;

class ProviderEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      providerName: props.match.params.providerName,
      provider: null,
    };
  }

  UNSAFE_componentWillMount() {
    this.getProvider();
  }

  getProvider() {
    ProviderBackend.getProvider("admin", this.state.providerName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            provider: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get provider: ${res.msg}`);
        }
      });
  }

  parseProviderField(key, value) {
    if (["topK"].includes(key)) {
      value = Setting.myParseInt(value);
    } else if (["temperature", "topP", "frequencyPenalty", "presencePenalty"].includes(key)) {
      value = Setting.myParseFloat(value);
    }
    return value;
  }

  updateProviderField(key, value) {
    value = this.parseProviderField(key, value);

    const provider = this.state.provider;
    provider[key] = value;
    this.setState({
      provider: provider,
    });
  }

  InputSlider(props) {
    const {
      min,
      max,
      step,
      value,
      onChange,
    } = props;

    return (
      <>
        <Col span={2}>
          <InputNumber
            min={min}
            max={max}
            step={step}
            style={{width: "100%"}}
            value={value}
            onChange={onChange}
          />
        </Col>
        <Col span={20}>
          <Slider
            min={min}
            max={max}
            step={step}
            style={{
              marginLeft: "1%",
              marginRight: "1%",
            }}
            value={value}
            onChange={onChange}
          />
        </Col>
      </>
    );
  }

  ProviderTemplateInput(props) {
    const {
      colName,
      filedName,
      colValue,
    } = props;
    return (
      <>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t(colName)}:
          </Col>
          <Col span={22} >
            <Input value={colValue} onChange={e => {
              this.updateProviderField(filedName, e.target.value);
            }} />
          </Col>
        </Row>
      </>
    );
  }

  ProviderTemplateInputSlider(props) {
    const {
      colName,
      min,
      max,
      colValue,
      step,
      filedName,
    } = props;

    return (
      <>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t(colName)}:
          </Col>
          <this.InputSlider
            label={i18next.t(colName)}
            min={min}
            max={max}
            step={step}
            value={colValue}
            onChange={(value) => {
              this.updateProviderField(filedName, value);
            }}
            isMobile={Setting.isMobile()}
          />
        </Row>
      </>
    );
  }

  ProviderTemplateOptions(props) {
    const {
      colName,
      options,
      filedName,
      colValue,
    } = props;

    return (
      <>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t(colName)}:
          </Col>
          <Col span={22} >
            <AutoComplete style={{width: "100%"}} value={colValue}
              options={options}
              onChange={(value) => {this.updateProviderField(filedName, value);}}
            />
          </Col>
        </Row>
      </>
    );
  }

  ProviderTemplate(props) {
    const {
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      topK,
      groupId,
      deploymentName,
      apiVersion,
      secretKey,
    } = props;

    const TemperatureSliderConfig = {
      colName: "provider:Temperature",
      min: 0,
      max: 1.99,
      step: 0.01,
      colValue: this.state.provider.temperature,
      filedName: "temperature",
    };

    const TopPSilderConfig = {
      colName: "provider:Top P",
      min: 0,
      max: 0.99,
      step: 0.01,
      colValue: this.state.provider.topP,
      filedName: "topP",
    };

    const FrequencyPenaltySliderConfig = {
      colName: "provider:Frequency penalty",
      min: -2,
      max: 2,
      step: 0.01,
      colValue: this.state.provider.frequencyPenalty,
      filedName: "frequencyPenalty",
    };

    const PresencePenaltySliderConfig = {
      colName: "provider:Presence penalty",
      min: -2,
      max: 2,
      step: 0.01,
      colValue: this.state.provider.presencePenalty,
      filedName: "presencePenalty",
    };

    const TopKSliderConfig = {
      colName: "provider:Top K",
      min: 1,
      max: 6,
      step: 1,
      colValue: this.state.provider.topK,
      filedName: "topK",
    };

    const GroupIDConfig = {
      colName: "provider:groupID",
      filedName: "clientId",
      colValue: this.state.provider.clientId,
    };

    const DeploymentNameConfig = {
      colName: "provider:Deployment name",
      filedName: "clientId",
      colValue: this.state.provider.clientId,
    };

    const APIVersionConfig = {
      colName: "provider:API version",
      filedName: "apiVersion",
      colValue: this.state.provider.apiVersion,
      options: Setting.getProviderAzureApiVersionOptions().map((item) => Setting.getOption(item.name, item.id)),
    };

    const SecretConfig = {
      colName: "provider:Secret key",
      filedName: "clientSecret",
      colValue: this.state.provider.clientSecret,
    };
    return (
      <>
        {groupId && this.ProviderTemplateInput(GroupIDConfig)}
        {deploymentName && this.ProviderTemplateInput(DeploymentNameConfig)}
        {apiVersion && this.ProviderTemplateOptions(APIVersionConfig)}
        {temperature && this.ProviderTemplateInputSlider(TemperatureSliderConfig)}
        {topP && this.ProviderTemplateInputSlider(TopPSilderConfig)}
        {frequencyPenalty && this.ProviderTemplateInputSlider(FrequencyPenaltySliderConfig)}
        {presencePenalty && this.ProviderTemplateInputSlider(PresencePenaltySliderConfig)}
        {topK && this.ProviderTemplateInputSlider(TopKSliderConfig)}
        {secretKey && this.ProviderTemplateInput(SecretConfig)}

      </>
    );
  }

  GetProviderParamSetting(modelName) {
    const QwenConfig = {temperature: true, topP: true};
    const OpenAiConfig = {temperature: true, topP: true, frequencyPenalty: true, presencePenalty: true};
    const OpenRouterConfig = {temperature: true, topP: true};
    const iFlytekConfig = {temperature: true, topK: true};
    const HuggingFaceConfig = {temperature: true};
    const ErnieConfig = {temperature: true, topP: true, presencePenalty: true};
    const MiniMaxConfig = {groupId: true, temperature: true};
    const GeminiConfig = {temperature: true, topP: true, topK: true};
    const AzureConfig = {deploymentName: true, apiVersion: true};
    const SecretInputConfig = {secretKey: true};
    const modelConfigs = {
      "Qwen": QwenConfig,
      "OpenAI": OpenAiConfig,
      "OpenRouter": OpenRouterConfig,
      "iFlytek": iFlytekConfig,
      "Hugging Face": HuggingFaceConfig,
      "Ernie": ErnieConfig,
      "MiniMax": MiniMaxConfig,
      "Gemini": GeminiConfig,
      "Azure": AzureConfig,
      "secretKey": SecretInputConfig,
    };

    return modelConfigs[modelName];
  }

  renderProvider() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("provider:Edit Provider")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitProviderEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitProviderEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.name} onChange={e => {
              this.updateProviderField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.displayName} onChange={e => {
              this.updateProviderField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Category")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.provider.category} onChange={(value => {
              this.updateProviderField("category", value);
              if (value === "Storage") {
                this.updateProviderField("type", "Local File System");
              } else if (value === "Model") {
                this.updateProviderField("type", "OpenAI");
                this.updateProviderField("subType", "gpt-4");
              } else if (value === "Embedding") {
                this.updateProviderField("type", "OpenAI");
                this.updateProviderField("subType", "AdaSimilarity");
              }
            })}>
              {
                [
                  {id: "Storage", name: "Storage"},
                  {id: "Model", name: "Model"},
                  {id: "Embedding", name: "Embedding"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Type")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.provider.type} onChange={(value => {
              this.updateProviderField("type", value);
              if (this.state.provider.category === "Model") {
                if (value === "OpenAI") {
                  this.updateProviderField("subType", "gpt-4");
                } else if (value === "Gemini") {
                  this.updateProviderField("subType", "gemini-pro");
                } else if (value === "OpenRouter") {
                  this.updateProviderField("subType", "openai/gpt-4");
                } else if (value === "iFlytek") {
                  this.updateProviderField("subType", "spark-v2.0");
                } else if (value === "Ernie") {
                  this.updateProviderField("subType", "ERNIE-Bot");
                } else if (value === "MiniMax") {
                  this.updateProviderField("subType", "abab5-chat");
                } else if (value === "Claude") {
                  this.updateProviderField("subType", "claude-2");
                } else if (value === "Hugging Face") {
                  this.updateProviderField("subType", "gpt2");
                } else if (value === "ChatGLM") {
                  this.updateProviderField("subType", "chatglm2-6b");
                } else if (value === "Local") {
                  this.updateProviderField("subType", "custom-model");
                } else if (value === "Azure") {
                  this.updateProviderField("subType", "gpt-4");
                } else if (value === "Cohere") {
                  this.updateProviderField("subType", "command");
                } else if (value === "Dummy") {
                  this.updateProviderField("subType", "Dummy");
                } else if (value === "Qwen") {
                  this.updateProviderField("subType", "qwen-long");
                } else if (value === "Moonshot") {
                  this.updateProviderField("subType", "Moonshot-v1-8k");
                }
              } else if (this.state.provider.category === "Embedding") {
                if (value === "OpenAI") {
                  this.updateProviderField("subType", "AdaSimilarity");
                } else if (value === "Gemini") {
                  this.updateProviderField("subType", "embedding-001");
                } else if (value === "Hugging Face") {
                  this.updateProviderField("subType", "sentence-transformers/all-MiniLM-L6-v2");
                } else if (value === "Cohere") {
                  this.updateProviderField("subType", "embed-english-v2.0");
                } else if (value === "Ernie") {
                  this.updateProviderField("subType", "default");
                } else if (value === "Local") {
                  this.updateProviderField("subType", "custom-embedding");
                } else if (value === "Azure") {
                  this.updateProviderField("subType", "AdaSimilarity");
                } else if (value === "Dummy") {
                  this.updateProviderField("subType", "Dummy");
                }
              }
            })}>
              {
                Setting.getProviderTypeOptions(this.state.provider.category)
                  // .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        {
          this.state.provider.category === "Storage" ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("provider:Sub type")}:
              </Col>
              <Col span={22} >
                <Select virtual={false} style={{width: "100%"}} value={this.state.provider.subType} onChange={(value => {this.updateProviderField("subType", value);})}>
                  {
                    Setting.getProviderSubTypeOptions(this.state.provider.category, this.state.provider.type)
                      // .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                  }
                </Select>
              </Col>
            </Row>
          )
        }
        {
          (this.state.provider.type === "Cohere" && this.state.provider.category === "Embedding") && (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("provider:Input type")}:
              </Col>
              <Col span={22} >
                <Select virtual={false} style={{width: "100%"}} value={this.state.provider.clientId} onChange={(value => {this.updateProviderField("clientId", value);})}>
                  {
                    ["search_document", "search_query"]
                      .map((item, index) => <Option key={index} value={item}>{item}</Option>)
                  }
                </Select>
              </Col>
            </Row>
          )
        }
        {
          (this.state.provider.type !== "Ernie" && this.state.provider.category !== "Storage") ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {
                  (this.state.provider.category !== "Storage") ? i18next.t("provider:API key") :
                    i18next.t("provider:Path")}:
              </Col>
              <Col span={22} >
                <Input value={this.state.provider.clientId} onChange={e => {
                  this.updateProviderField("clientId", e.target.value);
                }} />
              </Col>
            </Row>
          )
        }
        {
          (this.state.provider.category === "Storage" || this.state.provider.type === "Dummy") ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("provider:Secret key")}:
              </Col>
              <Col span={22} >
                <Input value={this.state.provider.clientSecret} onChange={e => {
                  this.updateProviderField("clientSecret", e.target.value);
                }} />
              </Col>
            </Row>
          )
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "OpenAI") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("OpenAI"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "OpenRouter") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("OpenRouter"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "iFlytek") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("iFlytek"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "Hugging Face") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("Hugging Face"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "Ernie") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("Ernie"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "MiniMax") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("MiniMax"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "Gemini") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("Gemini"))
          ) : null
        }
        {
          ((this.state.provider.category === "Model" || this.state.provider.category === "Embedding") && this.state.provider.type === "Azure") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("Azure"))
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "Qwen") ? (
            this.ProviderTemplate(this.GetProviderParamSetting("Qwen"))
          ) : null
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Provider URL")}:
          </Col>
          <Col span={22} >
            <Input prefix={<LinkOutlined />} value={this.state.provider.providerUrl} onChange={e => {
              this.updateProviderField("providerUrl", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitProviderEdit(exitAfterSave) {
    const provider = Setting.deepCopy(this.state.provider);
    ProviderBackend.updateProvider(this.state.provider.owner, this.state.providerName, provider)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              providerName: this.state.provider.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/providers");
            } else {
              this.props.history.push(`/providers/${this.state.provider.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateProviderField("name", this.state.providerName);
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
          this.state.provider !== null ? this.renderProvider() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitProviderEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitProviderEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default ProviderEditPage;
