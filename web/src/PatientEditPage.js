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
// import {LinkOutlined} from "@ant-design/icons";
import * as PatientBackend from "./backend/PatientBackend";
import * as DoctorBackend from "./backend/DoctorBackend";
import * as Setting from "./Setting";
import i18next from "i18next";

class PatientEditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,

      patientName: props.match.params.patientName,
      patient: null,
      doctors: [],
      hospitals: [],
      mode: props.location.mode !== undefined ? props.location.mode : "edit",
    };
  }

  UNSAFE_componentWillMount() {
    this.getPatient();
    this.getDoctors();
    this.getHospitals();
  }

  getPatient() {
    PatientBackend.getPatient(this.props.account.owner, this.state.patientName)
      .then((res) => {
        if (res.status === "ok") {
          const patient = res.data;
          if (!patient.owners) {
            patient.owners = [];
          }
          this.setState({
            patient: patient,
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getDoctors() {
    DoctorBackend.getDoctors(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            doctors: res.data || [],
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  getHospitals() {
    const HospitalBackend = require("./backend/HospitalBackend");
    HospitalBackend.getHospitals(this.props.account.owner)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            hospitals: res.data || [],
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
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

  canEditPatient() {
    const account = this.props.account;
    const patient = this.state.patient;
    if (!account || !patient) {
      return false;
    }

    // Admins can edit all patients
    if (Setting.isAdminUser(account) || account.tag === "Admin") {
      return true;
    }

    // Doctors who are owners can edit
    if (account.tag === "Doctor" && patient.owners) {
      return patient.owners.includes(account.name);
    }

    return false;
  }

  renderPatient() {
    const canEdit = this.canEditPatient();
    const isViewMode = !canEdit && this.state.mode === "edit";

    return (
      <Card size="small" title={
        <div>
          {this.state.mode === "add" ? i18next.t("patient:New Patient") : (isViewMode ? i18next.t("patient:View Patient") : i18next.t("patient:Edit Patient"))}&nbsp;&nbsp;&nbsp;&nbsp;
          {canEdit ? (
            <>
              <Button onClick={() => this.submitPatientEdit(false)}>{i18next.t("general:Save")}</Button>
              <Button style={{marginLeft: "20px"}} type="primary" onClick={() => this.submitPatientEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            </>
          ) : null}
          {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} onClick={() => this.deletePatient()}>{i18next.t("general:Cancel")}</Button> : null}
        </div>
      } style={{marginLeft: "5px"}} type="inner">
        <Row style={{marginTop: "10px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("general:Name"), i18next.t("general:Name - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={!canEdit} value={this.state.patient.name} onChange={e => {
              this.updatePatientField("name", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Owners"), i18next.t("med:Owners - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              mode="multiple"
              style={{width: "100%"}}
              disabled={!canEdit}
              value={this.state.patient.owners || []}
              onChange={(value) => {
                this.updatePatientField("owners", value);
              }}
              options={this.state.doctors.map((doctor) => ({
                label: doctor.name,
                value: doctor.name,
              }))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Hospital"), i18next.t("med:Hospital - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              style={{width: "100%"}}
              disabled={!canEdit}
              value={this.state.patient.hospitalName}
              onChange={(value) => {
                this.updatePatientField("hospitalName", value);
              }}
              options={this.state.hospitals.map((hospital) => ({
                label: hospital.name,
                value: hospital.name,
              }))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Gender"), i18next.t("med:Gender - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              style={{width: "100%"}}
              disabled={!canEdit}
              value={this.state.patient.gender}
              onChange={(value) => {
                this.updatePatientField("gender", value);
              }}
              options={[
                {value: "Male", label: i18next.t("med:Male")},
                {value: "Female", label: i18next.t("med:Female")},
                {value: "Other", label: i18next.t("med:Other")},
              ].map((item) => Setting.getOption(item.label, item.value))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Address"), i18next.t("med:Address - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={!canEdit} value={this.state.patient.address} onChange={e => {
              this.updatePatientField("address", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Email"), i18next.t("med:Email - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={!canEdit} value={this.state.patient.email} onChange={e => {
              this.updatePatientField("email", e.target.value);
            }} />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Blood type"), i18next.t("med:Blood type - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Select
              virtual={false}
              style={{width: "100%"}}
              disabled={!canEdit}
              value={this.state.patient.bloodType}
              onChange={(value) => {
                this.updatePatientField("bloodType", value);
              }}
              options={[
                {value: "A", label: "A"},
                {value: "B", label: "B"},
                {value: "AB", label: "AB"},
                {value: "O", label: "O"},
              ].map((item) => Setting.getOption(item.label, item.value))}
            />
          </Col>
        </Row>
        <Row style={{marginTop: "20px"}} >
          <Col style={{marginTop: "5px"}} span={(Setting.isMobile()) ? 22 : 2}>
            {Setting.getLabel(i18next.t("med:Allergies"), i18next.t("med:Allergies - Tooltip"))} :
          </Col>
          <Col span={22} >
            <Input disabled={!canEdit} value={this.state.patient.allergies} onChange={e => {
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
            Setting.showMessage("success", i18next.t("general:Successfully saved"));
            this.setState({
              patientName: this.state.patient.name,
            });
            if (willExist) {
              this.props.history.push("/patients");
            } else {
              this.props.history.push(`/patients/${encodeURIComponent(this.state.patient.name)}`);
            }
            // this.getPatient(true);
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to save"));
            this.updatePatientField("name", this.state.patientName);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${error}`);
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
    const canEdit = this.canEditPatient();

    return (
      <div>
        {
          this.state.patient !== null ? this.renderPatient() : null
        }
        {canEdit ? (
          <div style={{marginTop: "20px", marginLeft: "40px"}}>
            <Button size="large" onClick={() => this.submitPatientEdit(false)}>{i18next.t("general:Save")}</Button>
            <Button style={{marginLeft: "20px"}} type="primary" size="large" onClick={() => this.submitPatientEdit(true)}>{i18next.t("general:Save & Exit")}</Button>
            {this.state.mode === "add" ? <Button style={{marginLeft: "20px"}} size="large" onClick={() => this.deletePatient()}>{i18next.t("general:Cancel")}</Button> : null}
          </div>
        ) : null}
      </div>
    );
  }
}

export default PatientEditPage;
