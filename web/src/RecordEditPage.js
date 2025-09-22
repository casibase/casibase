// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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
import { Button, Card, Col, Input, Row, Select, Switch, message } from "antd";
import * as RecordBackend from "./backend/RecordBackend";
import * as ProviderBackend from "./backend/ProviderBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
require("codemirror/theme/material-darker.css");
require("codemirror/mode/javascript/javascript");


import * as DYCF_UTIL from "./utils/dynamicConfigUtil";
import { DYNAMIC_CONFIG_KEYS } from "./const/DynamicConfigConst";

const { Option } = Select;

class RecordEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      recordOwner: props.match.params.organizationName,
      recordName: props.match.params.recordName,
      record: null,
      blockchainProviders: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
      ipfsQueryLoading: false,
      ipfsQueryResult: null
    };
  }

  UNSAFE_componentWillMount() {
    this.getRecord();
    this.getProviders();
  }

  getRecord() {
    RecordBackend.getRecord(this.props.account.owner, this.state.recordName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            record: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getProviders() {
    ProviderBackend.getProviders(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            blockchainProviders: res.data.filter(provider => provider.category === "Blockchain" && provider.state === "Active"),
          });
        } else {
          Setting.showMessage("error", res.msg);
        }
      });
  }

  parseRecordField(key, value) {
    if ([""].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateRecordField(key, value) {
    value = this.parseRecordField(key, value);

    const record = this.state.record;
    record[key] = value;
    this.setState({
      record: record,
    });
  }

  renderRecord() {
    // const history = useHistory();
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("record:New Record") : i18next.t("record:View Record")}&nbsp;&nbsp;&nbsp;&nbsp;
          {this.state.mode !== "123" ? (
            <React.Fragment>
              <Button onClick={() => this.submitRecordEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{ marginLeft: "20px" }} type="primary" onClick={() => this.submitRecordEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            </React.Fragment>
          ) : (
            <Button type="primary" onClick={() => this.props.history.push("/records")}>{i18next.t("general:Exit")}</Button>
          )}
          {this.state.mode === "add" ? <Button style={{ marginLeft: "20px" }} onClick={() => this.deleteRecord()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{ marginLeft: "5px" }} type="inner">
        <Row style={{ marginTop: "10px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.owner} onChange={e => {
              // this.updateRecordField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.name} onChange={e => {
              // this.updateRecordField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider"), i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Select disabled={false} virtual={false} style={{ width: "100%" }} value={this.state.record.provider} onChange={(value => {
              this.updateRecordField("provider", value);
            })}>
              {
                this.state.blockchainProviders.map((provider, index) => (
                  <Option key={index} value={provider.name}>{provider.name}</Option>
                ))
              }
            </Select>
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Block"), i18next.t("general:Block - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input disabled={false} value={this.state.record.block} onChange={e => {
              // this.updateRecordField("block", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Provider") + " 2", i18next.t("general:Provider - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Select disabled={false} virtual={false} style={{ width: "100%" }} value={this.state.record.provider2} onChange={(value => {
              this.updateRecordField("provider2", value);
            })}>
              {
                this.state.blockchainProviders.map((provider, index) => (
                  <Option key={index} value={provider.name}>{provider.name}</Option>
                ))
              }
            </Select>
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Block") + " 2", i18next.t("general:Block - Tooltip"))} :
          </Col>
          <Col span={22}>
            <Input disabled={false} value={this.state.record.block2} onChange={e => {
              // this.updateRecordField("block", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Client IP"), i18next.t("general:Client IP - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.clientIp} onChange={e => {
              // this.updateRecordField("clientIp", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:User"), i18next.t("general:User - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.user} onChange={e => {
              // this.updateRecordField("user", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Method"), i18next.t("general:Method - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select disabled={false} virtual={false} style={{ width: "100%" }} value={this.state.record.method} onChange={(value => {
              // this.updateRecordField("method", value);
            })}>
              {
                [
                  { id: "GET", name: "GET" },
                  { id: "HEAD", name: "HEAD" },
                  { id: "POST", name: "POST" },
                  { id: "PUT", name: "PUT" },
                  { id: "DELETE", name: "DELETE" },
                  { id: "CONNECT", name: "CONNECT" },
                  { id: "OPTIONS", name: "OPTIONS" },
                  { id: "TRACE", name: "TRACE" },
                  { id: "PATCH", name: "PATCH" },
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Request URI"), i18next.t("general:Request URI - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.requestUri} onChange={e => {
              // this.updateRecordField("requestUri", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Action"), i18next.t("general:Action - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.action} onChange={e => {
              // this.updateRecordField("action", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Language"), i18next.t("general:Language - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.language} onChange={e => {
              // this.updateRecordField("language", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Region"), i18next.t("general:Region - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.region} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:City"), i18next.t("general:City - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.city} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Unit"), i18next.t("general:Unit - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.unit} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Section"), i18next.t("general:Section - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.section} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:DiseaseCategory"), i18next.t("general:DiseaseCategory - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.diseaseCategory} />
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:CorrelationId"), i18next.t("general:CorrelationId - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={false} value={this.state.record.correlationId} />
          </Col>
        </Row>
        {/* <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Object"), i18next.t("general:Object - Tooltip"))} :
          </Col>
          <Col span={22} >
            <div style={{ width: "900px", height: "300px" }}>
              <CodeMirror
                value={Setting.formatJsonString(this.state.record.object)}
                options={{ mode: "javascript", theme: "material-darker" }}
                onBeforeChange={(editor, data, value) => {
                }}
              />
            </div>
          </Col>
        </Row> */}
        {/* objcid展示：如果objcid为空则不渲染，否则渲染按钮，点击弹窗展示CodeMirror */}
        {this.state.record.objcid && this.state.record.objcid !== "" && (
          <Row style={{ marginTop: "20px" }} >
            <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
              {Setting.getLabel(i18next.t("general:objcid"), i18next.t("general:objcid - Tooltip"))} :
            </Col>

            <Col span={22} >
              {/* 内联 objcid 预览按钮及逻辑 */}
              {(() => {
                // 本地 state
                if (!this.objcidPreviewState) {
                  this.objcidPreviewState = { visible: false, loading: false };
                }
                const { visible, loading } = this.objcidPreviewState;
                const ipfsQueryResult = this.state.ipfsQueryResult;
                const ipfsQueryLoading = this.state.ipfsQueryLoading;
                const handlePreviewClick = async () => {
                  if (!ipfsQueryResult) {
                    this.objcidPreviewState.loading = true;
                    this.forceUpdate();
                    await this.fetchQueryResult(this.state.record.objcid);
                    this.objcidPreviewState.loading = false;
                    this.objcidPreviewState.visible = true;
                    this.forceUpdate();
                  } else {
                    this.objcidPreviewState.visible = !this.objcidPreviewState.visible;
                    this.forceUpdate();
                  }
                };
                return (
                  <div>
                    <span style={{ marginRight: 16 }}>{this.state.record.objcid}</span>
                    <Button onClick={handlePreviewClick} loading={loading || ipfsQueryLoading}>
                      {visible ? "收起" : "查询"}
                    </Button>
                    {/* 动画展开效果 */}
                    <div style={{
                      maxHeight: visible ? 400 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                      marginTop: visible ? 16 : 0,
                      background: '#222',
                      borderRadius: 6,
                      boxShadow: visible ? '0 2px 8px #0002' : 'none',
                    }}>
                      {visible && (
                        <div style={{ padding: 12 }}>
                          {ipfsQueryLoading || loading ? (
                            <div style={{ textAlign: 'center', padding: 32 }}>
                              <span>加载中...</span>
                            </div>
                          ) : (
                            <CodeMirror
                              value={Setting.formatJsonString(ipfsQueryResult)}
                              options={{ mode: "javascript", theme: "material-darker", readOnly: true }}
                              onBeforeChange={() => { }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </Col>
          </Row>
        )}
        <Row style={{ marginTop: "20px" }}>
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Response"), i18next.t("general:Response - Tooltip"))} :
          </Col>
          <Col span={22}>
            <div style={{ width: "900px", height: "300px" }}>
              <CodeMirror
                value={Setting.formatJsonString(this.state.record.response)}
                options={{ mode: "javascript", theme: "material-darker" }}
                onBeforeChange={(editor, data, value) => {
                }}
              />
            </div>
          </Col>
        </Row>
        <Row style={{ marginTop: "20px" }} >
          <Col style={{ marginTop: "5px" }} span={(Setting.isMobile()) ? 19 : 2}>
            {Setting.getLabel(i18next.t("general:Is triggered"), i18next.t("general:Is triggered - Tooltip"))} :
          </Col>
          <Col span={1} >
            <Switch disabled={false} checked={this.state.record.isTriggered} onChange={checked => {
              // this.updateRecordField("isTriggered", checked);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitRecordEdit(willExist) {
    const record = Setting.deepCopy(this.state.record);
    RecordBackend.updateRecord(this.state.record.owner, this.state.recordName, record)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              recordName: this.state.record.name,
            });
            if (willExist) {
              this.props.history.push("/records");
            } else {
              this.props.history.push(`/records/${this.state.record.owner}/${encodeURIComponent(this.state.record.id)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateRecordField("name", this.state.recordName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteRecord() {
    RecordBackend.deleteRecord(this.state.record)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/records");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  fetchQueryResult = async (ipfsAddress) => {
    this.setState({ ipfsQueryLoading: true });
    const queryItemObj = {
      queryConcatType: "single",
      filePos: [[ipfsAddress]],
      returnField: [ipfsAddress + "_*"],
      queryConditions: [],
    };
    const queryItem = JSON.stringify(queryItemObj);
    try {
      const uId = (this.props.account && this.props.account.name) ? this.props.account.name : 'admin';

      // 获取基本chainqa的动态配置
      const chainServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CHAINSERVICEURL, "");
      const contractName = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_CONTRACTNAME, "chainQA");
      const ipfsServiceUrl = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_IPFSSERVICEURL, "https://47.113.204.64:5001");
      const serverURL = await DYCF_UTIL.GET(DYNAMIC_CONFIG_KEYS.CHAINQA_SERVER, "	https://47.113.204.64:23554");

      const response = await fetch(serverURL + "/api/query/queryData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uId,
          queryItem,
          apiUrl: {
            ipfsServiceUrl: ipfsServiceUrl,
            // chainServiceUrl: "http://47.113.204.64:9001/tencent-chainapi/exec",
            chainServiceUrl: chainServiceUrl,
            // contractName: "tencentChainqaContractV221demo01",
            contractName: contractName,
          },
        }),
      });
      const res = await response.json();
      this.praseQueryResult(res);
    } catch (e) {
      this.setState({
        ipfsQueryLoading: false,
        ipfsQueryResult: null
      });
      message.warning("查询失败，" + e.toString() + ". 建议稍后重试");

    }
  };

  praseQueryResult = (res) => {
    try {
      if (res.code === 0) {
        let dataObj = {};
        let parseError = false;
        try {
          dataObj = JSON.parse(res.data);
        } catch (e) {
          // 不是标准json，直接展示data内容
          parseError = true;
        }
        console.log(dataObj);
        if (!parseError && typeof dataObj === 'object' && !Array.isArray(dataObj) && Object.keys(dataObj).length === 0) {
          this.setState({
            ipfsQueryLoading: false,
            ipfsQueryResult: null
          });
          var errmsg
          if (res.msg) {
            errmsg = res.msg;
          } else if (res.message) {
            errmsg = res.message;
          } else {
            errmsg = "查询失败";
          }
          message.warning("查询出现错误，" + errmsg + ". 建议稍后重试");
        } else if (parseError) {
          this.setState({
            ipfsQueryLoading: false,
            ipfsQueryResult: null
          });
          var errmsg
          if (res.msg) {
            errmsg = res.msg;
          } else if (res.message) {
            errmsg = res.message;
          } else {
            errmsg = "查询失败";
          }
          message.warning("查询出现错误，" + errmsg + ". 建议稍后重试");
        } else if (dataObj.data) {
          // dataObj.data是一个数组，提取第一个元素
          this.setState({
            ipfsQueryLoading: false,
            ipfsQueryResult: JSON.stringify(dataObj.data[0])
          });
        } else {
          this.setState({
            ipfsQueryLoading: false,
            ipfsQueryResult: null
          });
          var errmsg
          if (res.data) {
            errmsg = res.data;
          }
          else if (res.msg) {
            errmsg = res.msg;
          } else if (res.message) {
            errmsg = res.message;
          } else {
            errmsg = "查询失败";
          }
          message.warning("查询出现错误，" + errmsg + ". 建议稍后重试");
        }
      } else {
        this.setState({
          ipfsQueryLoading: false,
          ipfsQueryResult: null
        });
        var errmsg
        if (res.msg) {
          errmsg = res.msg;
        } else if (res.message) {
          errmsg = res.message;
        } else {
          errmsg = "查询失败";
        }
        message.warning("查询出现错误，" + errmsg + ". 建议稍后重试");
      }
    } catch (e) {
      this.setState({
        ipfsQueryLoading: false,
        ipfsQueryResult: null
      });

      message.warning("查询出现错误，" + e.toString() + ". 建议稍后重试");
    }
  }

  render() {
    return (
      <div>
        {
          this.state.record !== null ? this.renderRecord() : null
        }
        <div style={{ marginTop: "20px", marginLeft: "40px" }}>
          {this.state.mode !== "123" ? (
            <React.Fragment>
              <Button size="large" onClick={() => this.submitRecordEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{ marginLeft: "20px" }} type="primary" size="large" onClick={() => this.submitRecordEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            </React.Fragment>
          ) : (
            <Button type="primary" size="large" onClick={() => this.props.history.push("/records")}>{i18next.t("general:Exit")}</Button>
          )}
          {this.state.mode === "add" ? <Button style={{ marginLeft: "20px" }} size="large" onClick={() => this.deleteRecord()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default RecordEditPage;

