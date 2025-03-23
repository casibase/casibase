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
import * as StoreBackend from "./backend/StoreBackend";
import * as StorageProviderBackend from "./backend/StorageProviderBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import FileTree from "./FileTree";
import {ThemeDefault} from "./Conf";
import PromptTable from "./PromptTable";

const {TextArea} = Input;

class StoreEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      owner: props.match.params.owner,
      storeName: props.match.params.storeName,
      casdoorStorageProviders: [],
      storageProviders: [],
      modelProviders: [],
      embeddingProviders: [],
      store: null,
      themeColor: ThemeDefault.colorPrimary,
    };
  }

  UNSAFE_componentWillMount() {
    this.getStore();
    this.getStorageProviders();
    this.getProviders();
  }

  getStore() {
    StoreBackend.getStore(this.state.owner, this.state.storeName)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data && typeof res.data2 === "string" && res.data2 !== "") {
            res.data.error = res.data2;
          }

          this.setState({
            store: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get store: ${res.msg}`);
        }
      });
  }

  getStorageProviders() {
    StorageProviderBackend.getStorageProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            casdoorStorageProviders: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get storage providers: ${res.msg}`);
        }
      });
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.name)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            storageProviders: res.data.filter(provider => provider.category === "Storage"),
            modelProviders: res.data.filter(provider => provider.category === "Model"),
            embeddingProviders: res.data.filter(provider => provider.category === "Embedding"),
          });
        } else {
          Setting.showMessage("error", `Failed to get providers: ${res.msg}`);
        }
      });
  }

  parseStoreField(key, value) {
    if (["score"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateStoreField(key, value) {
    value = this.parseStoreField(key, value);

    const store = this.state.store;
    store[key] = value;
    this.setState({
      store: store,
    });
  }

  renderStore() {
    return (
      <Card size="small" title={
        <div>
          {i18next.t("store:Edit Store")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitStoreEdit(false, undefined)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitStoreEdit(true, undefined)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.name} onChange={e => {
              this.updateStoreField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.displayName} onChange={e => {
              this.updateStoreField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Title")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.title} onChange={e => {
              this.updateStoreField("title", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Avatar")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.avatar} onChange={e => {
              this.updateStoreField("avatar", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Storage provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.storageProvider} onChange={(value => {this.updateStoreField("storageProvider", value);})}
              options={this.state.storageProviders.concat(this.state.casdoorStorageProviders).map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, provider.name))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Image provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.imageProvider} onChange={(value => {this.updateStoreField("imageProvider", value);})}
              options={this.state.casdoorStorageProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, provider.name))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Split provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.splitProvider} onChange={(value => {this.updateStoreField("splitProvider", value);})}
              options={[{name: "Default"}, {name: "Basic"}, {name: "QA"}].map((provider) => Setting.getOption(provider.name, provider.name))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Model provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.modelProvider} onChange={(value => {this.updateStoreField("modelProvider", value);})}
              options={this.state.modelProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, provider.name))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Embedding provider")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.embeddingProvider} onChange={(value => {this.updateStoreField("embeddingProvider", value);})}
              options={this.state.embeddingProviders.map((provider) => Setting.getOption(`${provider.displayName} (${provider.name})`, provider.name))
              } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Frequency")}:
          </Col>
          <Col span={22} >
            <InputNumber min={0} value={this.state.store.frequency} onChange={value => {
              this.updateStoreField("frequency", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Memory limit")}:
          </Col>
          <Col span={22} >
            <InputNumber min={0} value={this.state.store.memoryLimit} onChange={value => {
              this.updateStoreField("memoryLimit", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Limit minutes")}:
          </Col>
          <Col span={22} >
            <InputNumber min={0} value={this.state.store.limitMinutes} onChange={value => {
              this.updateStoreField("limitMinutes", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Welcome")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.store.welcome} onChange={e => {
              this.updateStoreField("welcome", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Welcome title")}:
          </Col>
          <Col span={22} >
            <Input
              value={this.state.store.welcomeTitle} onChange={e => {
                this.updateStoreField("welcomeTitle", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Welcome text")}:
          </Col>
          <Col span={22} >
            <Input
              value={this.state.store.welcomeText} onChange={e => {
                this.updateStoreField("welcomeText", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Prompt")}:
          </Col>
          <Col span={22} >
            <TextArea autoSize={{minRows: 1, maxRows: 15}} value={this.state.store.prompt} onChange={(e) => {
              this.updateStoreField("prompt", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Prompts")}:
          </Col>
          <Col span={22} >
            <PromptTable prompts={this.state.store.prompts} onUpdatePrompts={(prompts) => {
              this.updateStoreField("prompts", prompts);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Knowledge count")}:
          </Col>
          <Col span={22} >
            <InputNumber min={0} max={100} value={this.state.store.knowledgeCount} onChange={value => {
              this.updateStoreField("knowledgeCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Suggestion count")}:
          </Col>
          <Col span={22} >
            <InputNumber min={0} max={10} value={this.state.store.suggestionCount} onChange={value => {
              this.updateStoreField("suggestionCount", value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:Theme color")}:
          </Col>
          <Col span={22} >
            <input type="color" value={this.state.store.themeColor} onChange={(e) => {
              this.updateStoreField("themeColor", e.target.value);
            }} />
          </Col>
        </Row>
        {
          this.state.store.name !== "store-built-in" ? null : (
            <Row style={{marginTop: "20px"}} >
              <Col style={{}} span={(Setting.isMobile()) ? 22 : 2}>
                {i18next.t("store:Can Select Store")}:
              </Col>
              <Col span={22} style={{display: "flex", alignItems: "center"}}>
                <input type="checkbox" checked={this.state.store.canSelectStore} onClick={(e) => {
                  this.updateStoreField("canSelectStore", e.target.checked);
                }} />
              </Col>
            </Row>
          )
        }
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:State")} :
          </Col>
          <Col span={5}>
            <Select virtual={false} style={{width: "100%"}} value={this.state.store.state} onChange={value => {
              this.updateStoreField("state", value);
            }}
            options={[
              {value: "Active", label: "Active"},
              {value: "Inactive", label: "Inactive"},
            ].map(item => Setting.getOption(item.label, item.value))} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("store:File tree")}:
          </Col>
          <Col span={22} >
            <FileTree account={this.props.account} store={this.state.store} onUpdateStore={(store) => {
              this.setState({
                store: store,
              });
              this.submitStoreEdit(undefined, store);
            }} onRefresh={() => this.getStore()} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitStoreEdit(exitAfterSave, storeParam) {
    let store = Setting.deepCopy(this.state.store);
    if (storeParam) {
      store = storeParam;
    }

    store.fileTree = undefined;
    StoreBackend.updateStore(this.state.store.owner, this.state.storeName, store)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.setThemeColor(this.state.store.themeColor);
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              storeName: this.state.store.name,
            });
            if (exitAfterSave) {
              this.props.history.push("/stores");
            } else {
              this.props.history.push(`/stores/${this.state.store.owner}/${this.state.store.name}`);
            }
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updateStoreField("name", this.state.storeName);
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
          this.state.store !== null ? this.renderStore() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitStoreEdit(false, undefined)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitStoreEdit(true, undefined)}>{i18next.t("general:Save & Exit")}</Button>
        </div>
      </div>
    );
  }
}

export default StoreEditPage;
