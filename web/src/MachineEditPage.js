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
import {Button, Card, Col, Input, Row, Select} from "antd";
import * as MachineBackend from "./backend/MachineBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

const {Option} = Select;

class MachineEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      machineOwner: props.match.params.organizationName,
      machineName: props.match.params.machineName,
      machine: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getMachine();
  }

  getMachine() {
    MachineBackend.getMachine(this.props.account.owner, this.state.machineName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            machine: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get machine: ${res.msg}`);
        }
      });
  }

  parseMachineField(key, value) {
    if (["port"].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateMachineField(key, value) {
    value = this.parseMachineField(key, value);
    const machine = this.state.machine;
    machine[key] = value;
    this.setState({
      machine: machine,
    });
  }

  renderMachine() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("machine:New Machine") : i18next.t("machine:Edit Machine")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitMachineEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitMachineEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteMachine()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.name} onChange={e => {
              this.updateMachineField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Display name")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.displayName} onChange={e => {
              this.updateMachineField("displayName", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Region")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.region} onChange={e => {
              this.updateMachineField("region", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("machine:Zone")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.zone} onChange={e => {
              this.updateMachineField("zone", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("provider:Category")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.category} onChange={e => {
              this.updateMachineField("category", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Type")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.machine.type} onChange={(value => {
              this.updateMachineField("type", value);
            })}>
              {
                [
                  {id: "Pay As You Go", name: "Pay As You Go"},
                  {id: "Reserved", name: "Reserved"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:Size")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.size} onChange={e => {
              this.updateMachineField("size", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("machine:Image")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.image} onChange={e => {
              this.updateMachineField("image", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("node:OS")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.machine.os} onChange={(value => {
              this.updateMachineField("os", value);
            })}>
              {
                [
                  {id: "Linux", name: "Linux"},
                  {id: "Windows", name: "Windows"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("machine:Public IP")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.publicIp} onChange={e => {
              this.updateMachineField("publicIp", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("machine:Private IP")}:
          </Col>
          <Col span={22} >
            <Input value={this.state.machine.privateIp} onChange={e => {
              this.updateMachineField("privateIp", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {i18next.t("general:State")}:
          </Col>
          <Col span={22} >
            <Select virtual={false} style={{width: "100%"}} value={this.state.machine.state} onChange={(value => {
              this.updateMachineField("state", value);
            })}>
              {
                [
                  {id: "Active", name: "Active"},
                  {id: "Stopped", name: "Stopped"},
                  {id: "Terminated", name: "Terminated"},
                ].map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
              }
            </Select>
          </Col>
        </Row>
      </Card>
    );
  }

  submitMachineEdit(willExist) {
    const machine = Setting.deepCopy(this.state.machine);
    MachineBackend.updateMachine(this.state.machine.owner, this.state.machineName, machine)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              machineName: this.state.machine.name,
            });
            if (willExist) {
              this.props.history.push("/machines");
            } else {
              this.props.history.push(`/machines/${this.state.machine.owner}/${encodeURIComponent(this.state.machine.name)}`);
            }
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save: server side failure"));
            this.updateMachineField("name", this.state.machineName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteMachine() {
    this.props.history.push("/machines");
  }

  render() {
    return (
      <div>
        {
          this.state.machine !== null ? this.renderMachine() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitMachineEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitMachineEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteMachine()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default MachineEditPage;
