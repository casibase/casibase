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
import {AutoComplete, Button, Card, Col, Input, InputNumber, Row, Select, Slider, Switch} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import copy from "copy-to-clipboard";
import FileSaver from "file-saver";
import McpToolsTable from "./table/McpToolsTable";
import ModelTestWidget from "./common/TestModelWidget";
import TtsTestWidget from "./common/TestTtsWidget";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");

const {Option} = Select;
const {TextArea} = Input;

class ProviderEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      providerName: props.match.params.providerName,
      provider: null,
      originalProvider: null,
      refreshButtonLoading: false,
      isAdmin: props.account?.isAdmin || props.account?.owner === "admin",
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
            originalProvider: Setting.deepCopy(res.data),
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getClientIdLabel(provider) {
    if (["Model", "Embedding"].includes(provider.category)) {
      if (provider.type === "Tencent Cloud") {
        return Setting.getLabel(i18next.t("general:Secret ID"), i18next.t("general:Secret ID - Tooltip"));
      } else if (provider.type === "Baidu Cloud") {
        return Setting.getLabel(i18next.t("provider:API key"), i18next.t("provider:API key - Tooltip"));
      } else if (provider.type === "Azure") {
        return Setting.getLabel(i18next.t("provider:Deployment name"), i18next.t("provider:Deployment name - Tooltip"));
      } else if (provider.type === "MiniMax") {
        return Setting.getLabel(i18next.t("provider:Group ID"), i18next.t("provider:Group ID - Tooltip"));
      }
    }
    if (provider.category === "Storage") {
      return Setting.getLabel(i18next.t("provider:API key"), i18next.t("provider:API key - Tooltip"));
    }
    return Setting.getLabel(i18next.t("provider:Client ID"), i18next.t("provider:Client ID - Tooltip"));
  }

  getNetworkLabel(provider) {
    if (provider.category === "Blockchain") {
      if (provider.type === "ChainMaker") {
        return Setting.getLabel(i18next.t("general:Node address"), i18next.t("general:Node address - Tooltip"));
      }
    }
    return Setting.getLabel(i18next.t("general:Network"), i18next.t("general:Network - Tooltip"));
  }

  getProviderUrlLabel(provider) {
    if (["Model", "Blockchain"].includes(provider.category)) {
      if (provider.type === "Volcano Engine") {
        return Setting.getLabel(i18next.t("provider:Endpoint ID"), i18next.t("provider:Endpoint ID - Tooltip"));
      } else if (provider.type === "ChainMaker") {
        return Setting.getLabel(i18next.t("general:Provider URL"), i18next.t("general:Provider URL - Tooltip"));
      }
    }
    return Setting.getLabel(i18next.t("general:Provider URL"), i18next.t("general:Provider URL - Tooltip"));
  }

  getRegionLabel(provider) {
    if (provider.category === "Blockchain") {
      if (provider.type === "ChainMaker") {
        return Setting.getLabel(i18next.t("general:Org ID"), i18next.t("general:Org ID - Tooltip"));
      }
    }
    return Setting.getLabel(i18next.t("general:Region"), i18next.t("general:Region - Tooltip"));
  }

  getClientSecretLabel(provider) {
    if (["Storage", "Embedding", "Text-to-Speech", "Speech-to-Text"].includes(provider.category)) {
      if (provider.type === "Baidu Cloud") {
        return Setting.getLabel(i18next.t("general:Access secret"), i18next.t("general:Access secret - Tooltip"));
      }
      return Setting.getLabel(i18next.t("general:Secret key"), i18next.t("general:Secret key - Tooltip"));
    } else if (provider.category === "Model") {
      if (provider.type === "Baidu Cloud" || provider.type === "Tencent Cloud") {
        return Setting.getLabel(i18next.t("provider:API key"), i18next.t("provider:API key - Tooltip"));
      }
    }
    return Setting.getLabel(i18next.t("provider:Client secret"), i18next.t("provider:Client secret - Tooltip"));
  }

  parseProviderField(key, value) {
    if (["topK"].includes(key)) {
      value = Setting.myParseInt(value);
    } else if (["temperature", "topP", "frequencyPenalty", "presencePenalty"].includes(key)) {
      value = Setting.myParseFloat(value);
    }
    return value;
  }

  parseMcpToolsField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateMcpToolsField(key, value) {
    value = this.parseMcpToolsField(key, value);
    const provider = this.state.provider;
    provider[key] = value;
    this.setState({
      provider: provider,
    });
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

  renderProvider() {
    const editorWidth = Setting.isMobile() ? 22 : 9;
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
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.name} onChange={e => {
              this.updateProviderField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Display name"), i18next.t("general:Display name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.provider.displayName} onChange={e => {
              this.updateProviderField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("provider:Category"), i18next.t("provider:Category - Tooltip"))} :
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
              } else if (value === "Agent") {
                this.updateProviderField("type", "MCP");
                this.updateProviderField("subType", "Default");
              } else if (value === "Video") {
                this.updateProviderField("type", "AWS");
              } else if (value === "Text-to-Speech") {
                this.updateProviderField("type", "Alibaba Cloud");
                this.updateProviderField("subType", "cosyvoice-v1");
              } else if (value === "Speech-to-Text") {
                this.updateProviderField("type", "Alibaba Cloud");
                this.updateProviderField("subType", "paraformer-realtime-v1");
              }
            })}>
              {
                [
                  {id: "Storage", name: "Storage"},
                  {id: "Model", name: "Model"},
                  {id: "Embedding", name: "Embedding"},
                  {id: "Agent", name: "Agent"},
                  {id: "Public Cloud", name: "Public Cloud"},
                  {id: "Private Cloud", name: "Private Cloud"},
                  {id: "Blockchain", name: "Blockchain"},
                  {id: "Video", name: "Video"},
                  {id: "Text-to-Speech", name: "Text-to-Speech"},
                  {id: "Speech-to-Text", name: "Speech-to-Text"},
                  {id: "Docker", name: "Docker"},
                  {id: "Kubernetes", name: "Kubernetes"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Type"), i18next.t("general:Type - Tooltip"))} :
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
                } else if (value === "Baidu Cloud") {
                  this.updateProviderField("subType", "ernie-4.0-8k");
                } else if (value === "MiniMax") {
                  this.updateProviderField("subType", "abab5-chat");
                } else if (value === "Claude") {
                  this.updateProviderField("subType", "claude-opus-4-0");
                } else if (value === "Hugging Face") {
                  this.updateProviderField("subType", "gpt2");
                } else if (value === "ChatGLM") {
                  this.updateProviderField("subType", "chatglm2-6b");
                } else if (value === "Ollama") {
                  this.updateProviderField("subType", "llama3.3:70b");
                } else if (value === "Local") {
                  this.updateProviderField("subType", "custom-model");
                } else if (value === "Azure") {
                  this.updateProviderField("subType", "gpt-4");
                } else if (value === "Cohere") {
                  this.updateProviderField("subType", "command");
                } else if (value === "Dummy") {
                  this.updateProviderField("subType", "Dummy");
                } else if (value === "Alibaba Cloud") {
                  this.updateProviderField("subType", "qwen-long");
                } else if (value === "Moonshot") {
                  this.updateProviderField("subType", "Moonshot-v1-8k");
                } else if (value === "Amazon Bedrock") {
                  this.updateProviderField("subType", "Claude");
                } else if (value === "Baichuan") {
                  this.updateProviderField("subType", "Baichuan2-Turbo");
                } else if (value === "Volcano Engine") {
                  this.updateProviderField("subType", "Doubao-lite-4k");
                } else if (value === "DeepSeek") {
                  this.updateProviderField("subType", "deepseek-chat");
                } else if (value === "StepFun") {
                  this.updateProviderField("subType", "step-1-8k");
                } else if (value === "Tencent Cloud") {
                  this.updateProviderField("subType", "hunyuan-turbo");
                } else if (value === "Yi") {
                  this.updateProviderField("subType", "yi-lightning");
                } else if (value === "Silicon Flow") {
                  this.updateProviderField("subType", "deepseek-ai/DeepSeek-R1");
                } else if (value === "GitHub") {
                  this.updateProviderField("subType", "gpt-4o");
                } else if (value === "Writer") {
                  this.updateProviderField("subType", "palmyra-x5");
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
                } else if (value === "Baidu Cloud") {
                  this.updateProviderField("subType", "Embedding-V1");
                } else if (value === "Local") {
                  this.updateProviderField("subType", "custom-embedding");
                } else if (value === "Azure") {
                  this.updateProviderField("subType", "AdaSimilarity");
                } else if (value === "Dummy") {
                  this.updateProviderField("subType", "Dummy");
                }
              } else if (this.state.provider.category === "Agent") {
                if (value === "MCP") {
                  this.updateProviderField("subType", "Default");
                } else if (value === "A2A") {
                  this.updateProviderField("subType", "Default");
                }
              } else if (this.state.provider.category === "Text-to-Speech") {
                if (value === "Alibaba Cloud") {
                  this.updateProviderField("subType", "cosyvoice-v1");
                }
              } else if (this.state.provider.category === "Speech-to-Text") {
                if (value === "Alibaba Cloud") {
                  this.updateProviderField("subType", "paraformer-realtime-v1");
                }
              }
            })}>
              {
                Setting.getProviderTypeOptions(this.state.provider.category)
                // .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => <Option key={index} value={item.name}>
                    <img width={20} height={20} style={{marginBottom: "3px", marginRight: "10px"}} src={Setting.getProviderLogoURL({category: this.state.provider.category, type: item.name})} alt={item.name} />
                    {item.name}
                  </Option>)
              }
            </Select>
          </Col>
        </Row>
        {
          !["Model", "Embedding", "Agent", "Text-to-Speech", "Speech-to-Text"].includes(this.state.provider.category) ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("provider:Sub type"), i18next.t("provider:Sub type - Tooltip"))} :
              </Col>
              <Col span={22} >
                {this.state.provider.type === "Ollama" ? (
                  <AutoComplete
                    style={{width: "100%"}}
                    value={this.state.provider.subType}
                    onChange={(value) => {
                      this.updateProviderField("subType", value);
                    }}
                    options={Setting.getProviderSubTypeOptions(this.state.provider.category, this.state.provider.type).map((item) => Setting.getOption(item.name, item.id))}
                    placeholder="Please select or enter the model name"
                  />
                ) : (
                  <Select
                    virtual={false}
                    style={{width: "100%"}}
                    value={this.state.provider.subType}
                    onChange={(value) => {
                      this.updateProviderField("subType", value);
                    }}
                  >
                    {Setting.getProviderSubTypeOptions(this.state.provider.category, this.state.provider.type)
                      .map((item, index) => (
                        <Option key={index} value={item.id}>{item.name}</Option>
                      ))
                    }
                  </Select>
                )}
              </Col>
            </Row>
          )
        }
        {
          (this.state.provider.type === "Cohere" && this.state.provider.category === "Embedding") && (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("provider:Input type"), i18next.t("provider:Input type - Tooltip"))} :
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
          ((this.state.provider.category === "Embedding" && this.state.provider.type === "Baidu Cloud") || (this.state.provider.category === "Embedding" && this.state.provider.type === "Tencent Cloud") || this.state.provider.category === "Storage") ||
          (this.state.provider.category === "Model" && this.state.provider.type === "MiniMax") ||
          (this.state.provider.category === "Blockchain" && this.state.provider.type !== "ChainMaker") ||
          ((this.state.provider.category === "Model" || this.state.provider.category === "Embedding") && this.state.provider.type === "Azure") ||
          (!(["Storage", "Model", "Embedding", "Text-to-Speech", "Speech-to-Text", "Agent", "Blockchain"].includes(this.state.provider.category))) ? (
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {this.getClientIdLabel(this.state.provider)} :
                </Col>
                <Col span={22} >
                  <Input value={this.state.provider.clientId} onChange={e => {
                    this.updateProviderField("clientId", e.target.value);
                  }} />
                </Col>
              </Row>
            ) : null
        }
        {
          (this.state.provider.type === "Local") ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Compitable Provider"), i18next.t("provider:Compitable Provider - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Select virtual={false} style={{width: "100%"}} value={this.state.provider.compitableProvider} onChange={(value => {
                    this.updateProviderField("compitableProvider", value);
                  })}>
                    {
                      Setting.getCompitableProviderOptions(this.state.provider.category)
                      // .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                    }
                  </Select>
                </Col>
              </Row>
            </>
          ) : null
        }
        {
          !(this.state.provider.category === "Model" && (this.state.provider.type === "Local" || this.state.provider.type === "Ollama")) ? null : (
            <>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Input price / 1k tokens"), i18next.t("provider:Input price / 1k tokens - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <InputNumber min={0} value={this.state.provider.inputPricePerThousandTokens} onChange={value => {
                    this.updateProviderField("inputPricePerThousandTokens", value);
                  }} />
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Output price / 1k tokens"), i18next.t("provider:Output price / 1k tokens - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <InputNumber min={0} value={this.state.provider.outputPricePerThousandTokens} onChange={value => {
                    this.updateProviderField("outputPricePerThousandTokens", value);
                  }} />
                </Col>
              </Row>
            </>
          )
        }
        {
          !(this.state.provider.category === "Embedding" && (this.state.provider.type === "Local" || this.state.provider.type === "Ollama")) ? null : (
            <>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Input price / 1k tokens"), i18next.t("provider:Input price / 1k tokens - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <InputNumber min={0} value={this.state.provider.inputPricePerThousandTokens} onChange={value => {
                    this.updateProviderField("inputPricePerThousandTokens", value);
                  }} />
                </Col>
              </Row>
            </>
          )
        }
        {
          (this.state.provider.type === "Local" || this.state.provider.type === "Ollama") ? (
            <>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Currency"), i18next.t("provider:Currency - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Select virtual={false} style={{width: "100%"}} value={this.state.provider.currency} onChange={(value => {
                    this.updateProviderField("currency", value);
                  })}>
                    {
                      [
                        {id: "USD", name: "USD"},
                        {id: "CNY", name: "CNY"},
                        {id: "EUR", name: "EUR"},
                        {id: "JPY", name: "JPY"},
                        {id: "GBP", name: "GBP"},
                        {id: "AUD", name: "AUD"},
                        {id: "CAD", name: "CAD"},
                        {id: "CHF", name: "CHF"},
                        {id: "HKD", name: "HKD"},
                        {id: "SGD", name: "SGD"},
                      ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                    }
                  </Select>
                </Col>
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Text-to-Speech" && this.state.provider.type === "Alibaba Cloud" && this.state.provider.subType === "cosyvoice-v1") ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Flavor"), i18next.t("provider:Flavor - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Select virtual={false} style={{width: "100%"}} value={this.state.provider.flavor} onChange={(value => {
                    this.updateProviderField("flavor", value);
                  })}>
                    {
                      Setting.getTtsFlavorOptions(this.state.provider.type, this.state.provider.subType)
                        .map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                    }
                  </Select>
                </Col>
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Storage" || this.state.provider.type === "Dummy" || (this.state.provider.category === "Agent" && this.state.provider.type === "MCP") || (this.state.provider.category === "Blockchain" && this.state.provider.type === "ChainMaker")) ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {this.getClientSecretLabel(this.state.provider)} :
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
          (this.state.provider.category === "Model" && this.state.provider.type === "Claude" && Setting.getThinkingModelMaxTokens(this.state.provider.subType) !== 0) ? (
            <>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Enable thinking"), i18next.t("provider:Enable thinking - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <Switch checked={this.state.provider.enableThinking} onChange={checked => {
                    this.updateProviderField("enableThinking", checked);
                  }} />
                </Col>
              </Row>
              {
                this.state.provider.enableThinking && (
                  <Row style={{marginTop: "20px"}} >
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("provider:Thinking tokens"), i18next.t("provider:Thinking tokens - Tooltip"))} :
                    </Col>
                    <Col span={22} >
                      <InputNumber min={1024} max={Setting.getThinkingModelMaxTokens(this.state.provider.subType) - 1} value={this.state.provider.topK || 1024} onChange={value => {
                        this.updateProviderField("topK", value);
                      }} />
                    </Col>
                  </Row>
                )
              }
            </>
          ) : null
        }
        {
          !["Agent"].includes(this.state.provider.category) ? null : (
            <>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:MCP servers"), i18next.t("provider:MCP servers - Tooltip"))} :
                </Col>
                <Col span={10} >
                  <div style={{height: "500px"}}>
                    <CodeMirror
                      value={this.state.provider.text}
                      options={{mode: "application/json", theme: "material-darker"}}
                      onBeforeChange={(editor, data, value) => {
                        this.updateProviderField("text", value);
                      }}
                    />
                  </div>
                  <br />
                  <Button loading={this.state.refreshButtonLoading} style={{marginBottom: "10px"}} type="primary" onClick={() => {
                    this.refreshMcpTools();
                  }}
                  >
                    {i18next.t("provider:Refresh MCP tools")}
                  </Button>
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:MCP tools"), i18next.t("provider:MCP tools - Tooltip"))} :
                </Col>
                <Col span={22}>
                  <McpToolsTable
                    title={i18next.t("provider:MCP tools")}
                    table={this.state.provider.mcpTools}
                    onUpdateTable={(value) => {
                      this.updateMcpToolsField("mcpTools", value);
                    }}
                  />
                </Col>
              </Row>
            </>
          )
        }
        {
          ["Storage", "Model", "Embedding", "Agent", "Text-to-Speech", "Speech-to-Text"].includes(this.state.provider.category) ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {this.getRegionLabel(this.state.provider)} :
              </Col>
              <Col span={22} >
                <Input value={this.state.provider.region} onChange={e => {
                  this.updateProviderField("region", e.target.value);
                }} />
              </Col>
            </Row>
          )
        }
        {
          this.state.provider.category === "Blockchain" && (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Chain"), i18next.t("provider:Chain - Tooltip"))} :
                </Col>
                <Col span={22}>
                  <Input value={this.state.provider.chain} onChange={e => {
                    this.updateProviderField("chain", e.target.value);
                  }} />
                </Col>
              </Row>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {this.getNetworkLabel(this.state.provider)} :
                </Col>
                <Col span={22}>
                  <Input value={this.state.provider.network} onChange={e => {
                    this.updateProviderField("network", e.target.value);
                  }} />
                </Col>
              </Row>
              {this.state.provider.type === "ChainMaker" ? (
                <>
                  <Row style={{marginTop: "20px"}}>
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("provider:Auth type"), i18next.t("provider:Auth type - Tooltip"))} :
                    </Col>
                    <Col span={22}>
                      <Select
                        virtual={false}
                        style={{width: "100%"}}
                        value={this.state.provider.text}
                        onChange={value => {
                          this.updateProviderField("text", value);
                        }}
                      >
                        <Select.Option value="permissionedwithcert">permissionedwithcert</Select.Option>
                        <Select.Option value="permissionedwithkey">permissionedwithkey</Select.Option>
                        <Select.Option value="public">public</Select.Option>
                      </Select>
                    </Col>
                  </Row>
                  <Row style={{marginTop: "20px"}} >
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("cert:User cert"), i18next.t("cert:User cert - Tooltip"))} :
                    </Col>
                    <Col span={editorWidth} >
                      <Button style={{marginRight: "10px", marginBottom: "10px"}} disabled={this.state.provider.userCert === ""} onClick={() => {
                        copy(this.state.provider.userCert);
                        Setting.showMessage("success", i18next.t("general:Copied to clipboard successfully"));
                      }}
                      >
                        {i18next.t("general:Copy")}
                      </Button>
                      <Button type="primary" disabled={this.state.provider.userCert === ""} onClick={() => {
                        const blob = new Blob([this.state.provider.userCert], {type: "text/plain;charset=utf-8"});
                        FileSaver.saveAs(blob, "user_cert.pem");
                      }}
                      >
                        {i18next.t("general:Download")}
                      </Button>
                      <TextArea autoSize={{minRows: 16, maxRows: 16}} value={this.state.provider.userCert} onChange={e => {
                        this.updateProviderField("userCert", e.target.value);
                      }} />
                    </Col>
                    <Col span={1} />
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("cert:User key"), i18next.t("cert:User key - Tooltip"))} :
                    </Col>
                    <Col span={editorWidth} >
                      <Button style={{marginRight: "10px", marginBottom: "10px"}} disabled={this.state.provider.userKey === ""} onClick={() => {
                        copy(this.state.provider.userKey);
                        Setting.showMessage("success", i18next.t("general:Copied to clipboard successfully"));
                      }}
                      >
                        {i18next.t("general:Copy")}
                      </Button>
                      <Button type="primary" disabled={this.state.provider.userKey === ""} onClick={() => {
                        const blob = new Blob([this.state.provider.userKey], {type: "text/plain;charset=utf-8"});
                        FileSaver.saveAs(blob, "token_jwt_key.key");
                      }}
                      >
                        {i18next.t("general:Download")}
                      </Button>
                      <TextArea autoSize={{minRows: 16, maxRows: 16}} value={this.state.provider.userKey} onChange={e => {
                        this.updateProviderField("userKey", e.target.value);
                      }} />
                    </Col>
                  </Row>
                  <Row style={{marginTop: "20px"}} >
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("cert:Sign cert"), i18next.t("cert:Sign cert - Tooltip"))} :
                    </Col>
                    <Col span={editorWidth} >
                      <Button style={{marginRight: "10px", marginBottom: "10px"}} disabled={this.state.provider.signCert === ""} onClick={() => {
                        copy(this.state.provider.signCert);
                        Setting.showMessage("success", i18next.t("general:Copied to clipboard successfully"));
                      }}
                      >
                        {i18next.t("general:Copy")}
                      </Button>
                      <Button type="primary" disabled={this.state.provider.signCert === ""} onClick={() => {
                        const blob = new Blob([this.state.provider.signCert], {type: "text/plain;charset=utf-8"});
                        FileSaver.saveAs(blob, "user_cert.pem");
                      }}
                      >
                        {i18next.t("general:Download")}
                      </Button>
                      <TextArea autoSize={{minRows: 16, maxRows: 16}} value={this.state.provider.signCert} onChange={e => {
                        this.updateProviderField("signCert", e.target.value);
                      }} />
                    </Col>
                    <Col span={1} />
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("cert:Sign key"), i18next.t("cert:Sign key - Tooltip"))} :
                    </Col>
                    <Col span={editorWidth} >
                      <Button style={{marginRight: "10px", marginBottom: "10px"}} disabled={this.state.provider.signKey === ""} onClick={() => {
                        copy(this.state.provider.signKey);
                        Setting.showMessage("success", i18next.t("general:Copied to clipboard successfully"));
                      }}
                      >
                        {i18next.t("general:Copy")}
                      </Button>
                      <Button type="primary" disabled={this.state.provider.signKey === ""} onClick={() => {
                        const blob = new Blob([this.state.provider.signKey], {type: "text/plain;charset=utf-8"});
                        FileSaver.saveAs(blob, "token_jwt_key.key");
                      }}
                      >
                        {i18next.t("general:Download")}
                      </Button>
                      <TextArea autoSize={{minRows: 16, maxRows: 16}} value={this.state.provider.signKey} onChange={e => {
                        this.updateProviderField("signKey", e.target.value);
                      }} />
                    </Col>
                  </Row>
                  <Row style={{marginTop: "20px"}}>
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("provider:Contract name"), i18next.t("provider:Contract name - Tooltip"))} :
                    </Col>
                    <Col span={22}>
                      <Input value={this.state.provider.contractName} onChange={e => {
                        this.updateProviderField("contractName", e.target.value);
                      }} />
                    </Col>
                  </Row>
                  <Row style={{marginTop: "20px"}}>
                    <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                      {Setting.getLabel(i18next.t("provider:Invoke method"), i18next.t("provider:Invoke method - Tooltip"))} :
                    </Col>
                    <Col span={22}>
                      <Input value={this.state.provider.contractMethod} onChange={e => {
                        this.updateProviderField("contractMethod", e.target.value);
                      }} />
                    </Col>
                  </Row>
                </>
              ) : null}
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Browser URL"), i18next.t("provider:Browser URL - Tooltip"))} :
                </Col>
                <Col span={22}>
                  <Input prefix={<LinkOutlined />} value={this.state.provider.browserUrl}
                    placeholder={this.state.provider.type === "ChainMaker" ? "https://explorer-testnet.chainmaker.org.cn/chainmaker_testnet_chain/block/{bh}" : ""}
                    onChange={e => {
                      this.updateProviderField("browserUrl", e.target.value);
                    }} />
                </Col>
              </Row>
            </>
          )
        }
        {
          (this.state.provider.category === "Model" && ["OpenAI", "OpenRouter", "iFlytek", "Hugging Face", "Baidu Cloud", "MiniMax", "Gemini", "Alibaba Cloud", "Baichuan", "Volcano Engine", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Silicon Flow", "Ollama", "Writer"].includes(this.state.provider.type)) ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Temperature"), i18next.t("provider:Temperature - Tooltip"))} :
                </Col>
                <this.InputSlider
                  min={0}
                  max={["Alibaba Cloud", "Gemini", "OpenAI", "OpenRouter", "Baichuan", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Ollama", "Writer"].includes(this.state.provider.type) ? 2 : 1}
                  step={0.01}
                  value={this.state.provider.temperature}
                  onChange={(value) => {
                    this.updateProviderField("temperature", value);
                  }}
                  isMobile={Setting.isMobile()}
                />
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Model" && ["OpenAI", "OpenRouter", "Baidu Cloud", "Gemini", "Alibaba Cloud", "Baichuan", "Volcano Engine", "DeepSeek", "StepFun", "Tencent Cloud", "Mistral", "Yi", "Silicon Flow", "Ollama", "Writer"].includes(this.state.provider.type)) ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Top P"), i18next.t("provider:Top P - Tooltip"))} :
                </Col>
                <this.InputSlider
                  min={0}
                  max={1.0}
                  step={0.01}
                  value={this.state.provider.topP}
                  onChange={(value) => {
                    this.updateProviderField("topP", value);
                  }}
                  isMobile={Setting.isMobile()}
                />
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Model" && ["iFlytek", "Gemini"].includes(this.state.provider.type)) ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Top K"), i18next.t("provider:Top K - Tooltip"))} :
                </Col>
                <this.InputSlider
                  min={1}
                  max={6}
                  step={1}
                  value={this.state.provider.topK}
                  onChange={(value) => {
                    this.updateProviderField("topK", value);
                  }}
                  isMobile={Setting.isMobile()}
                />
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Model" && ["OpenAI"].includes(this.state.provider.type)) ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Presence penalty"), i18next.t("provider:Presence penalty - Tooltip"))} :
                </Col>
                <this.InputSlider
                  label={i18next.t("provider:Presence penalty")}
                  min={(this.state.provider.type === "OpenAI" ? -2 : 1)}
                  max={2}
                  step={0.01}
                  value={this.state.provider.presencePenalty}
                  onChange={(value) => {
                    this.updateProviderField("presencePenalty", value);
                  }}
                  isMobile={Setting.isMobile()}
                />
              </Row>
            </>
          ) : null
        }
        {
          (this.state.provider.category === "Model" && this.state.provider.type === "OpenAI") ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:Frequency penalty"), i18next.t("provider:Frequency penalty - Tooltip"))} :
                </Col>
                <this.InputSlider
                  label={i18next.t("provider:Frequency penalty")}
                  min={-2}
                  max={2}
                  step={0.01}
                  value={this.state.provider.frequencyPenalty}
                  onChange={(value) => {
                    this.updateProviderField("frequencyPenalty", value);
                  }}
                  isMobile={Setting.isMobile()}
                />
              </Row>
            </>
          ) : null
        }
        {
          ((this.state.provider.category === "Model" || this.state.provider.category === "Embedding") && this.state.provider.type === "Azure") ? (
            <>
              <Row style={{marginTop: "20px"}}>
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                  {Setting.getLabel(i18next.t("provider:API version"), i18next.t("provider:API version - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <AutoComplete style={{width: "100%"}} value={this.state.provider.apiVersion}
                    options={Setting.getProviderAzureApiVersionOptions().map((item) => Setting.getOption(item.name, item.id))}
                    onChange={(value) => {this.updateProviderField("apiVersion", value);}}
                  />
                </Col>
              </Row>
            </>
          ) : null
        }
        <ModelTestWidget
          provider={this.state.provider}
          originalProvider={this.state.originalProvider}
          account={this.props.account}
        />
        <TtsTestWidget
          provider={this.state.provider}
          originalProvider={this.state.originalProvider}
          account={this.props.account}
          onUpdateProvider={this.updateProviderField.bind(this)}
        />
        {
          this.state.provider.category === "Model" ? (
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("provider:Provider key"), i18next.t("provider:Provider key - Tooltip"))} :
              </Col>
              <Col span={22} >
                <Input.Password
                  value={this.state.provider.providerKey}
                  disabled={!this.state.isAdmin}
                  onChange={e => {
                    this.updateProviderField("providerKey", e.target.value);
                  }}
                />
              </Col>
            </Row>
          ) : null
        }
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {this.getProviderUrlLabel(this.state.provider)} :
          </Col>
          <Col span={22} >
            <Input prefix={<LinkOutlined />} value={this.state.provider.providerUrl} onChange={e => {
              this.updateProviderField("providerUrl", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("store:Is default"), i18next.t("store:Is default - Tooltip"))} :
          </Col>
          <Col span={1}>
            <Switch checked={this.state.provider.isDefault} onChange={checked => {
              this.updateProviderField("isDefault", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:State"), i18next.t("general:State - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Select virtual={false} style={{width: "100%"}} value={this.state.provider.state} onChange={value => {
              this.updateProviderField("state", value);
            }}
            options={[
              {value: "Active", label: "Active"},
              {value: "Inactive", label: "Inactive"},
            ].map(item => Setting.getOption(item.label, item.value))} />
          </Col>
        </Row>
      </Card>
    );
  }

  refreshMcpTools() {
    this.setState({
      refreshButtonLoading: true,
    });
    const provider = Setting.deepCopy(this.state.provider);
    provider.mcpTools = [];
    ProviderBackend.refreshMcpTools(provider)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
          this.setState({
            provider: res.data,
          }, () => {
            this.submitProviderEdit(false);
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
          this.setState({
            provider: provider,
          });
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
        this.setState({
          provider: provider,
        });
      })
      .finally(() => {
        this.setState({refreshButtonLoading: false});
      });
  }

  submitProviderEdit(exitAfterSave) {
    const provider = Setting.deepCopy(this.state.provider);
    ProviderBackend.updateProvider(this.state.provider.owner, this.state.providerName, provider)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              providerName: this.state.provider.name,
            });

            if (exitAfterSave) {
              this.props.history.push("/providers");
            } else {
              this.props.history.push(`/providers/${this.state.provider.name}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateProviderField("name", this.state.providerName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
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
