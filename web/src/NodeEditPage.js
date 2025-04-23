// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import {Button, Card, Col, Input, Row, Select, Switch} from "antd";
import * as NodeBackend from "./backend/NodeBackend";
import * as Setting from "./Setting";
import i18next from "i18next";
import ServiceTable from "./ServiceTable";
import RemoteAppTable from "./RemoteAppTable";

const {Option} = Select;

class NodeEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodeOwner: props.match.params.organizationName,
      nodeName: props.match.params.nodeName,
      node: null,
      organizations: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };

    this.timer = null;
  }

  UNSAFE_componentWillMount() {
    this.getNode();
    this.startTimer();
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  getNode(updateFromRemote = false) {
    NodeBackend.getNode(this.props.account.owner, this.state.nodeName)
      .then((res) => {
        if (res.status === "ok") {
          // Clone the fetched node data using the spread operator
          const newNode = {
            ...res.data,
            // ip: res.data.privateIp,
            // username: res.data.remoteUsername,
            // protocol: res.data.remoteProtocol,
            // port: res.data.remotePort,
          };

          if (!updateFromRemote && this.state.node !== null) {
            newNode.autoQuery = this.state.node.autoQuery;

            // Update or add remote Apps to the node data
            newNode.remoteApps = newNode.remoteApps.map((newApp, i) => {
              if (i < this.state.node.remoteApps.length) {
                const oldApp = this.state.node.remoteApps[i];
                return {
                  ...oldApp, // Preserve old attributes
                  ...newApp, // Override with new attributes
                };
              } else {
                return newApp; // Add new service
              }
            }).slice(0, this.state.node.remoteApps.length);

            // Update or add services to the node data
            newNode.services = newNode.services.map((newService, i) => {
              if (i < this.state.node.services.length) {
                const oldService = this.state.node.services[i];
                return {
                  ...oldService, // Preserve old attributes
                  ...newService, // Override with new attributes
                };
              } else {
                return newService; // Add new service
              }
            }).slice(0, this.state.node.services.length);
          }

          this.setState({
            node: newNode,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")} : ${res.msg}`);
        }
      });
  }

  startTimer() {
    if (this.timer === null) {
      this.timer = window.setInterval(this.doTimer.bind(this), 3000);
    }
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  doTimer() {
    if (this.state.node?.autoQuery) {
      this.getNode(false);
    }
  }

  parseNodeField(key, value) {
    if (["port"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateNodeField(key, value) {
    value = this.parseNodeField(key, value);

    const node = this.state.node;
    node[key] = value;
    this.setState({
      node: node,
    });
  }

  getDefaultPort(protocol) {
    if (protocol === "RDP") {
      return 3389;
    } else if (protocol === "VNC") {
      return 5900;
    } else if (protocol === "SSH") {
      return 22;
    } else if (protocol === "Telnet") {
      return 23;
    } else {
      return 0;
    }
  }

  renderNode() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("node:New Node") : i18next.t("node:Edit Node")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitNodeEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitNodeEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteNode()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.owner} onChange={e => {
              this.updateNodeField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.name} onChange={e => {
              this.updateNodeField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Description"), i18next.t("general:Description - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.description} onChange={e => {
              this.updateNodeField("description", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("machine:Protocol"), i18next.t("machine:Protocol - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.node.remoteProtocol} onChange={value => {
              this.updateNodeField("remoteProtocol", value);
              this.updateNodeField("remotePort", this.getDefaultPort(value));
            }}>
              {
                [
                  {id: "RDP", name: "RDP"},
                  {id: "VNC", name: "VNC"},
                  {id: "SSH", name: "SSH"},
                  {id: "Telnet", name: "Telnet"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:IP"), i18next.t("general:IP - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.privateIp} onChange={e => {
              this.updateNodeField("privateIp", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("machine:Port"), i18next.t("machine:Port - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input
              value={this.state.node.remotePort}
              defaultValue={this.getDefaultPort(this.state.node.remoteProtocol)}
              onChange={e => {
                this.updateNodeField("remotePort", e.target.value);
              }}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Username"), i18next.t("general:Username - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.remoteUsername} onChange={e => {
              this.updateNodeField("remoteUsername", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Password"), i18next.t("general:Password - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.remotePassword} onChange={e => {
              this.updateNodeField("remotePassword", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("node:OS"), i18next.t("node:OS - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.node.os} onChange={value => {
              this.updateNodeField("os", value);
            }}
            options={[
              {value: "Windows", label: "Windows"},
              {value: "Linux", label: "Linux"},
            ].map(item => Setting.getOption(item.label, item.value))} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}}>
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Tag"), i18next.t("general:Tag - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.tag} onChange={e => {
              this.updateNodeField("tag", e.target.value);
            }
            } />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Language"), i18next.t("general:Language - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.node.language} onChange={e => {
              this.updateNodeField("language", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("node:Auto query"), i18next.t("node:Auto query - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Switch checked={this.state.node.autoQuery} onChange={checked => {
              this.updateNodeField("autoQuery", checked);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("node:Is permanent"), i18next.t("node:Is permanent - Tooltip"))} :
          </Col>
          <Col span={1} >
            <Switch checked={this.state.node.isPermanent} onChange={checked => {
              this.updateNodeField("isPermanent", checked);
            }} />
          </Col>
        </Row>
        {this.state.node.protocol === "RDP" && (
          <div>
            <Row style={{marginTop: "20px"}} >
              <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
                {Setting.getLabel(i18next.t("node:Enable Remote App"), i18next.t("node:Enable Remote App - Tooltip"))} :
              </Col>
              <Col span={22}>
                <Switch checked={this.state.node.enableRemoteApp} onChange={checked => {
                  if (checked && this.state.node.remoteApps.length === 0) {
                    Setting.showMessage("error", i18next.t("node:Cannot enable Remote App when Remote Apps are empty. Please add at least one Remote App in below table first, then enable again"));
                    return;
                  }
                  this.updateNodeField("enableRemoteApp", checked);
                }} />
              </Col>
            </Row>
            {this.state.node.enableRemoteApp && (
              <Row style={{marginTop: "20px"}} >
                <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2} >
                  {Setting.getLabel(i18next.t("node:Remote Apps"), i18next.t("node:Remote Apps - Tooltip"))} :
                </Col>
                <Col span={22} >
                  <RemoteAppTable title={"Remote Apps"} table={this.state.node.remoteApps} onUpdateTable={(value) => {
                    this.updateNodeField("remoteApps", value);
                  }} />
                </Col>
              </Row>
            )}
          </div>
        )}
        {this.state.node.protocol === "SSH" && (
          <div>
          </div>
        )}
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("node:Services"), i18next.t("node:Services - Tooltip"))} :
          </Col>
          <Col span={22} >
            <ServiceTable title={"Services"} table={this.state.node.services} onUpdateTable={(value) => {
              this.updateNodeField("services", value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitNodeEdit(willExist) {
    const node = Setting.deepCopy(this.state.node);
    NodeBackend.updateNode(this.state.node.owner, this.state.nodeName, node)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              nodeName: this.state.node.name,
            });
            if (willExist) {
              this.props.history.push("/nodes");
            } else {
              this.props.history.push(`/nodes/${encodeURIComponent(this.state.node.name)}`);
            }
            // this.getNode(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
            this.updateNodeField("name", this.state.nodeName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteNode() {
    NodeBackend.deleteNode(this.state.node)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/nodes");
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  render() {
    return (
      <div>
        {
          this.state.node !== null ? this.renderNode() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitNodeEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitNodeEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteNode()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default NodeEditPage;
