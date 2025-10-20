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
import * as PatientBackend from "./backend/PatientBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class PatientEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      patientName: props.match.params.patientName,
      patient: null,
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getPatient();
  }

  getPatient() {
    PatientBackend.getPatient(this.props.account.owner, this.state.patientName)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            patient: res.data,
          });
        } else {
          Setting.showMessage("error", `Failed to get patient: ${res.msg}`);
        }
      });
  }

  parsePatientField(key, value) {
    if ([].includes(key)) {
      value = Setting.myParseInt(value);
    }
    return value;
  }

  updatePatientField(key, value) {
    value = this.parsePatientField(key, value);

    const patient = this.state.patient;
    patient[key] = value;
    this.setState({
      patient: patient,
    });
  }

  renderPatient() {
    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("patient:New Patient") : i18next.t("patient:Edit Patient")}&nbsp;&nbsp;&nbsp;&nbsp;
          <Button onClick={() => this.submitPatientEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitPatientEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deletePatient()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Organization"), i18next.t("general:Organization - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.owner} onChange={e => {
              this.updatePatientField("owner", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.name} onChange={e => {
              this.updatePatientField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Gender"), i18next.t("general:Gender - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.gender} onChange={e => {
              this.updatePatientField("gender", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Address"), i18next.t("general:Address - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.address} onChange={e => {
              this.updatePatientField("address", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Email"), i18next.t("general:Email - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.email} onChange={e => {
              this.updatePatientField("email", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Blood Type"), i18next.t("general:Blood Type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.bloodType} onChange={e => {
              this.updatePatientField("bloodType", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Allergies"), i18next.t("general:Allergies - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input value={this.state.patient.allergies} onChange={e => {
              this.updatePatientField("allergies", e.target.value);
            }} />
          </Col>
        </Row>
      </Card>
    );
  }

  submitPatientEdit(willExist) {
    const patient = Setting.deepCopy(this.state.patient);
    PatientBackend.updatePatient(this.state.patient.owner, this.state.patientName, patient)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data) {
            Setting.showMessage("success", "Successfully saved");
            this.setState({
              patientName: this.state.patient.name,
            });
            if (willExist) {
              this.props.history.push("/patients");
            } else {
              this.props.history.push(`/patients/${this.state.patient.owner}/${encodeURIComponent(this.state.patient.name)}`);
            }
            // this.getPatient(true);
          } else {
            Setting.showMessage("error", "failed to save: server side failure");
            this.updatePatientField("name", this.state.patientName);
          }
        } else {
          Setting.showMessage("error", `failed to save: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `failed to save: ${error}`);
      });
  }

  deletePatient() {
    PatientBackend.deletePatient(this.state.patient)
      .then((res) => {
        if (res.status === "ok") {
          this.props.history.push("/patients");
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
          this.state.patient !== null ? this.renderPatient() : null
        }
        <div style={{marginTop: "20px", marginLeft: "40px"}}>
          <Button size="large" onClick={() => this.submitPatientEdit(false)}>{i18next.t("general:Save")}</Button>
          <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitPatientEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deletePatient()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      </div>
    );
  }
}

export default PatientEditPage;
