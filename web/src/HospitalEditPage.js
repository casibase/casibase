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
import {Button, Card, Col, Input, Row} from "antd";
// import {LinkOutlined} from "@ant-design/icons";
import * as HospitalBackend from "./backend/HospitalBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class HospitalEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      hospitalName: props.match.params.hospitalName,
      hospital: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getHospital();
  }

  getHospital() {
    HospitalBackend.getHospital(this.props.account.owner, this.state.hospitalName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            hospital: res.data,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  parseHospitalField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updateHospitalField(key, value) {
    value = this.parseHospitalField(key, value);

    const hospital = this.state.hospital;
    hospital[key] = value;
    this.setState({
      hospital: hospital,
    });
  }

  renderHospital() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("hospital:New Hospital") : i18next.t("hospital:Edit Hospital")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitHospitalEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitHospitalEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deleteHospital()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.hospital.name} onChange={e => {
              this.updateHospitalField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Address"), i18next.t("med:Address - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.hospital.address} onChange={e => {
              this.updateHospitalField("address", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitHospitalEdit(willExist) {
    const hospital = Setting.deepCopy(this.state.hospital);
    HospitalBackend.updateHospital(this.state.hospital.owner, this.state.hospitalName, hospital)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              hospitalName: this.state.hospital.name,
            });
            if (willExist) {
              this.props.history.push("/hospitals");
            } else {
              this.props.history.push(`/hospitals/${encodeURIComponent(this.state.hospital.name)}`);
            }
            // this.getHospital(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updateHospitalField("name", this.state.hospitalName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
      });
  }

  deleteHospital() {
    HospitalBackend.deleteHospital(this.state.hospital)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/hospitals");
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
          this.state.hospital !== null ? this.renderHospital() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitHospitalEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitHospitalEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deleteHospital()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default HospitalEditPage;
